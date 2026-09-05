"""
Payroll service layer: owns all database access for the Payrun/Payslip
workflow and calls the (unmodified) pure payroll_engine to do math.

Business rules implemented here:
1. Only DRAFT payruns can be computed.
2. period_start <= period_end enforced on creation.
3. Compute uses the active contract per employee for the pay period,
   via the injected ActiveContractProvider (payroll_hr_client).
4. Missing active contract -> warning, no payslip created for that employee.
5/6. Salary structure and rules must be active.
7/9. Duplicate payslips prevented by the existing unique constraint;
     caught per-employee via a SAVEPOINT so one bad employee doesn't
     sink the whole batch.
8. Re-computing a COMPUTED payrun is rejected outright (see
   InvalidPayrunStateError below) rather than silently re-running —
   this is the "safe behavior" chosen: computing is a one-shot
   transition per payrun; a real "redo" would need an explicit,
   separate reset-to-DRAFT operation (not implemented here).
12. Each employee's payslip+lines are written inside a nested
    transaction (SAVEPOINT) so a single employee's failure rolls back
    only that employee, while the batch as a whole still commits once.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.payroll_hr_client import ActiveContractProvider, HRClientError
from backend.app.payroll_engine import CalculationInput, PayrollEngineError, calculate_payslip
from backend.app.payroll_models import (
    Payrun,
    PayrunStatus,
    Payslip,
    PayslipLine,
    SalaryRule,
    SalaryStructure,
)


# ---------------------------------------------------------------------------
# Service-level typed exceptions (mapped to HTTP responses in payroll_routes)
# ---------------------------------------------------------------------------

class PayrollServiceError(Exception):
    pass


class PayrunNotFoundError(PayrollServiceError):
    def __init__(self, payrun_id: UUID):
        self.payrun_id = payrun_id
        super().__init__(f"Payrun {payrun_id} not found")


class PayslipNotFoundError(PayrollServiceError):
    def __init__(self, payslip_id: UUID):
        self.payslip_id = payslip_id
        super().__init__(f"Payslip {payslip_id} not found")


class SalaryStructureNotFoundError(PayrollServiceError):
    def __init__(self, structure_id: UUID):
        self.structure_id = structure_id
        super().__init__(f"Salary structure {structure_id} not found")


class SalaryStructureInactiveError(PayrollServiceError):
    def __init__(self, structure_id: UUID):
        self.structure_id = structure_id
        super().__init__(f"Salary structure {structure_id} is not active")


class InvalidPeriodError(PayrollServiceError):
    def __init__(self, period_start: date, period_end: date):
        super().__init__(
            f"period_end ({period_end}) must not be before period_start ({period_start})"
        )


class InvalidPayrunStateError(PayrollServiceError):
    def __init__(self, payrun_id: UUID, current_status: PayrunStatus, action: str, detail: str = ""):
        self.payrun_id = payrun_id
        self.current_status = current_status
        self.action = action
        message = f"Cannot {action} payrun {payrun_id}: current status is {current_status.value}."
        if detail:
            message += f" {detail}"
        super().__init__(message)


class EmptyEmployeeListError(PayrollServiceError):
    def __init__(self):
        super().__init__(
            "employee_ids is required to compute a payrun and must not be empty"
        )


# ---------------------------------------------------------------------------
# Worked-days placeholder — isolated so attendance integration can replace it
# ---------------------------------------------------------------------------

def _default_worked_days(period_start: date, period_end: date) -> Decimal:
    """
    Placeholder: full calendar days in the period. Replace this function
    (only this function) once real attendance data is available — nothing
    else in the service needs to change.
    """
    days = (period_end - period_start).days + 1
    return Decimal(days)


# ---------------------------------------------------------------------------
# Payrun: create
# ---------------------------------------------------------------------------

def create_payrun(db: Session, payload) -> Payrun:
    if payload.period_end < payload.period_start:
        raise InvalidPeriodError(payload.period_start, payload.period_end)

    structure = db.get(SalaryStructure, payload.salary_structure_id)
    if structure is None:
        raise SalaryStructureNotFoundError(payload.salary_structure_id)
    if not structure.is_active:
        raise SalaryStructureInactiveError(payload.salary_structure_id)

    # NOTE: payload.employee_ids is accepted/validated per the contract but
    # not persisted — Payrun has no column for it. See flagged conflict.
    payrun = Payrun(
    name=payload.name,
    salary_structure_id=payload.salary_structure_id,
    period_start=payload.period_start,
    period_end=payload.period_end,
    employee_ids=[str(employee_id) for employee_id in payload.employee_ids],
    status=PayrunStatus.DRAFT,
)
    db.add(payrun)
    db.commit()
    db.refresh(payrun)
    return payrun


def list_payruns(db: Session) -> list[Payrun]:
    return list(db.scalars(select(Payrun).order_by(Payrun.created_at.desc())).all())


def get_payrun(db: Session, payrun_id: UUID) -> Payrun:
    payrun = db.get(Payrun, payrun_id)
    if payrun is None:
        raise PayrunNotFoundError(payrun_id)
    return payrun


# ---------------------------------------------------------------------------
# Payrun: compute
# ---------------------------------------------------------------------------

def compute_payrun(
    db: Session,
    payrun_id: UUID,
    employee_ids: list[UUID],
    hr_client: ActiveContractProvider,
    worked_days_overrides: dict[UUID, Decimal] | None = None,
) -> tuple[Payrun, int, list[str]]:
    payrun = db.get(Payrun, payrun_id)
    if payrun is None:
        raise PayrunNotFoundError(payrun_id)

    if payrun.status != PayrunStatus.DRAFT:
        raise InvalidPayrunStateError(
            payrun_id,
            payrun.status,
            "compute",
            "Only DRAFT payruns can be computed; this payrun has already "
            "been processed once and will not be recomputed automatically.",
        )

    if not employee_ids:
        raise EmptyEmployeeListError()

    structure = db.get(SalaryStructure, payrun.salary_structure_id)
    if structure is None:
        raise SalaryStructureNotFoundError(payrun.salary_structure_id)
    if not structure.is_active:
        raise SalaryStructureInactiveError(payrun.salary_structure_id)

    rules = list(
        db.scalars(
            select(SalaryRule)
            .where(SalaryRule.structure_id == structure.id, SalaryRule.is_active.is_(True))
            .order_by(SalaryRule.sequence.asc())
        ).all()
    )
    rules_by_code = {r.code: r for r in rules}

    worked_days_overrides = worked_days_overrides or {}
    warnings: list[str] = []
    payslip_count = 0

    for employee_id in employee_ids:
        savepoint = db.begin_nested()
        try:
            contract = hr_client.get_active_contract(
                employee_id, payrun.period_start, payrun.period_end
            )
            if contract is None:
                warnings.append(
                    f"No active contract found for employee {employee_id} "
                    f"in period {payrun.period_start}..{payrun.period_end}; skipped."
                )
                savepoint.rollback()
                continue

            worked_days = worked_days_overrides.get(employee_id) or _default_worked_days(
                payrun.period_start, payrun.period_end
            )

            calc_input = CalculationInput(
                structure_id=structure.id,
                employee_id=employee_id,
                contract_id=contract.id,
                period_start=payrun.period_start,
                period_end=payrun.period_end,
                worked_days=worked_days,
                base_inputs={"BASIC": Decimal(contract.wage)},
            )
            result = calculate_payslip(rules, calc_input)

            payslip = Payslip(
                payrun_id=payrun.id,
                employee_id=employee_id,
                contract_id=contract.id,
                salary_structure_id=structure.id,
                worked_days=worked_days,
                gross_salary=result.gross_salary,
                total_deductions=result.total_deductions,
                net_salary=result.net_salary,
                status=PayrunStatus.COMPUTED,
            )
            db.add(payslip)
            db.flush()  # assign payslip.id; still inside the savepoint

            for line in result.lines:
                rule = rules_by_code.get(line.code)
                db.add(
                    PayslipLine(
                        payslip_id=payslip.id,
                        rule_id=rule.id if rule else None,
                        code=line.code,
                        name=line.name,
                        category=line.category,
                        sequence=line.sequence,
                        amount=line.amount,
                    )
                )
            db.flush()

        except HRClientError as exc:
            savepoint.rollback()
            warnings.append(f"HR lookup failed for employee {employee_id}: {exc}")
        except PayrollEngineError as exc:
            savepoint.rollback()
            warnings.append(f"Calculation failed for employee {employee_id}: {exc}")
        except IntegrityError:
            savepoint.rollback()
            warnings.append(
                f"Payslip already exists for employee {employee_id} in this payrun; skipped."
            )
        else:
            savepoint.commit()
            payslip_count += 1

    if payslip_count > 0:
        payrun.status = PayrunStatus.COMPUTED
    else:
        warnings.append("No payslips could be computed; payrun remains DRAFT.")

    db.commit()
    db.refresh(payrun)
    return payrun, payslip_count, warnings


# ---------------------------------------------------------------------------
# Payrun: validate / mark-paid
# ---------------------------------------------------------------------------

def validate_payrun(db: Session, payrun_id: UUID) -> Payrun:
    payrun = db.get(Payrun, payrun_id)
    if payrun is None:
        raise PayrunNotFoundError(payrun_id)
    if payrun.status != PayrunStatus.COMPUTED:
        raise InvalidPayrunStateError(
            payrun_id, payrun.status, "validate",
            "Only COMPUTED payruns can be validated.",
        )
    payrun.status = PayrunStatus.VALIDATED
    db.commit()
    db.refresh(payrun)
    return payrun


def mark_payrun_paid(db: Session, payrun_id: UUID) -> Payrun:
    payrun = db.get(Payrun, payrun_id)
    if payrun is None:
        raise PayrunNotFoundError(payrun_id)
    if payrun.status != PayrunStatus.VALIDATED:
        raise InvalidPayrunStateError(
            payrun_id, payrun.status, "mark-paid",
            "Only VALIDATED payruns can be marked PAID.",
        )
    payrun.status = PayrunStatus.PAID
    db.commit()
    db.refresh(payrun)
    return payrun


# ---------------------------------------------------------------------------
# Payslip queries
# ---------------------------------------------------------------------------

def get_payslip(db: Session, payslip_id: UUID) -> Payslip:
    payslip = db.get(Payslip, payslip_id)
    if payslip is None:
        raise PayslipNotFoundError(payslip_id)
    return payslip


def list_payslips_for_payrun(db: Session, payrun_id: UUID) -> list[Payslip]:
    return list(
        db.scalars(select(Payslip).where(Payslip.payrun_id == payrun_id)).all()
    )


def get_payslip_lines(db: Session, payslip_id: UUID) -> list[PayslipLine]:
    return list(
        db.scalars(
            select(PayslipLine)
            .where(PayslipLine.payslip_id == payslip_id)
            .order_by(PayslipLine.sequence.asc())
        ).all()
    )