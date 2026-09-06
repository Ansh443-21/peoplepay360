"""
Payroll service layer: owns all database access for the Payrun/Payslip
workflow and calls the pure payroll_engine to do calculations.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.payroll_hr_client import (
    ActiveContractProvider,
    HRClientError,
)

from app.payroll_engine import (
    CalculationInput,
    PayrollEngineError,
    calculate_payslip,
)

from app.payroll_models import (
    Payrun,
    PayrunStatus,
    Payslip,
    PayslipLine,
    SalaryRule,
    SalaryStructure,
)


# ============================================================
# SERVICE EXCEPTIONS
# ============================================================

class PayrollServiceError(Exception):
    pass


class PayrunNotFoundError(PayrollServiceError):

    def __init__(self, payrun_id: UUID):
        self.payrun_id = payrun_id

        super().__init__(
            f"Payrun {payrun_id} not found"
        )


class PayslipNotFoundError(PayrollServiceError):

    def __init__(self, payslip_id: UUID):
        self.payslip_id = payslip_id

        super().__init__(
            f"Payslip {payslip_id} not found"
        )


class SalaryStructureNotFoundError(PayrollServiceError):

    def __init__(
        self,
        structure_id: UUID
    ):
        self.structure_id = structure_id

        super().__init__(
            f"Salary structure {structure_id} not found"
        )


class SalaryStructureInactiveError(PayrollServiceError):

    def __init__(
        self,
        structure_id: UUID
    ):
        self.structure_id = structure_id

        super().__init__(
            f"Salary structure {structure_id} is not active"
        )


class InvalidPeriodError(PayrollServiceError):

    def __init__(
        self,
        period_start: date,
        period_end: date
    ):
        super().__init__(
            f"period_end ({period_end}) must not be "
            f"before period_start ({period_start})"
        )


class InvalidPayrunStateError(PayrollServiceError):

    def __init__(
        self,
        payrun_id: UUID,
        current_status: PayrunStatus,
        action: str,
        detail: str = "",
    ):
        self.payrun_id = payrun_id
        self.current_status = current_status
        self.action = action

        message = (
            f"Cannot {action} payrun {payrun_id}: "
            f"current status is {current_status.value}."
        )

        if detail:
            message += f" {detail}"

        super().__init__(message)


class EmptyEmployeeListError(PayrollServiceError):

    def __init__(self):
        super().__init__(
            "employee_ids is required to compute "
            "a payrun and must not be empty"
        )


# ============================================================
# WORKED DAYS
# ============================================================

def _default_worked_days(
    period_start: date,
    period_end: date,
) -> Decimal:
    """
    Temporary implementation.

    Returns the number of calendar days
    between period_start and period_end.

    This can later be replaced with
    attendance-based calculation.
    """

    days = (
        period_end - period_start
    ).days + 1

    return Decimal(days)


# ============================================================
# CREATE PAYRUN
# ============================================================

def create_payrun(
    db: Session,
    payload,
) -> Payrun:

    if payload.period_end < payload.period_start:
        raise InvalidPeriodError(
            payload.period_start,
            payload.period_end,
        )

    structure = db.get(
        SalaryStructure,
        payload.salary_structure_id,
    )

    if structure is None:
        raise SalaryStructureNotFoundError(
            payload.salary_structure_id
        )

    if not structure.is_active:
        raise SalaryStructureInactiveError(
            payload.salary_structure_id
        )

    payrun = Payrun(
        name=payload.name,
        salary_structure_id=payload.salary_structure_id,
        period_start=payload.period_start,
        period_end=payload.period_end,
        employee_ids=[
            str(employee_id)
            for employee_id
            in payload.employee_ids
        ],
        status=PayrunStatus.DRAFT,
    )

    db.add(payrun)
    db.commit()
    db.refresh(payrun)

    return payrun


# ============================================================
# LIST PAYRUNS
# ============================================================

def list_payruns(
    db: Session,
) -> list[Payrun]:

    return list(
        db.scalars(
            select(Payrun)
            .order_by(
                Payrun.created_at.desc()
            )
        ).all()
    )


# ============================================================
# GET PAYRUN
# ============================================================

def get_payrun(
    db: Session,
    payrun_id: UUID,
) -> Payrun:

    payrun = db.get(
        Payrun,
        payrun_id,
    )

    if payrun is None:
        raise PayrunNotFoundError(
            payrun_id
        )

    return payrun


# ============================================================
# COMPUTE PAYRUN
# ============================================================

def compute_payrun(

    db: Session,

    payrun_id: UUID,

    employee_ids: list[UUID],

    hr_client: ActiveContractProvider,

    worked_days_overrides:
    dict[UUID, Decimal] | None = None,

) -> tuple[Payrun, int, list[str]]:

    # --------------------------------------------------------
    # Get Payrun
    # --------------------------------------------------------

    payrun = db.get(
        Payrun,
        payrun_id,
    )

    if payrun is None:
        raise PayrunNotFoundError(
            payrun_id
        )

    # --------------------------------------------------------
    # Only DRAFT can be computed
    # --------------------------------------------------------

    if (
        payrun.status
        != PayrunStatus.DRAFT
    ):
        raise InvalidPayrunStateError(
            payrun_id,
            payrun.status,
            "compute",
            "Only DRAFT payruns can be computed.",
        )

    # --------------------------------------------------------
    # Validate employees
    # --------------------------------------------------------

    if not employee_ids:
        raise EmptyEmployeeListError()

    # --------------------------------------------------------
    # Get Salary Structure
    # --------------------------------------------------------

    structure = db.get(
        SalaryStructure,
        payrun.salary_structure_id,
    )

    if structure is None:
        raise SalaryStructureNotFoundError(
            payrun.salary_structure_id
        )

    if not structure.is_active:
        raise SalaryStructureInactiveError(
            payrun.salary_structure_id
        )

    # --------------------------------------------------------
    # Get Active Salary Rules
    # --------------------------------------------------------

    rules = list(
        db.scalars(
            select(SalaryRule)
            .where(
                SalaryRule.structure_id
                == structure.id,

                SalaryRule.is_active.is_(True),
            )
            .order_by(
                SalaryRule.sequence.asc()
            )
        ).all()
    )

    rules_by_code = {
        rule.code: rule
        for rule in rules
    }

    # --------------------------------------------------------
    # Defaults
    # --------------------------------------------------------

    worked_days_overrides = (
        worked_days_overrides
        or {}
    )

    warnings: list[str] = []

    payslip_count = 0

    # ========================================================
    # PROCESS EACH EMPLOYEE
    # ========================================================

    for employee_id in employee_ids:

        savepoint = db.begin_nested()

        try:

            # ------------------------------------------------
            # Get Active Contract
            # ------------------------------------------------

            contract = (
                hr_client.get_active_contract(
                    employee_id,
                    payrun.period_start,
                    payrun.period_end,
                )
            )

            # ------------------------------------------------
            # No Contract
            # ------------------------------------------------

            if contract is None:

                warnings.append(
                    f"No active contract found for "
                    f"employee {employee_id}; skipped."
                )

                savepoint.rollback()

                continue

            # ------------------------------------------------
            # Worked Days
            # ------------------------------------------------

            worked_days = (
                worked_days_overrides.get(
                    employee_id
                )
            )

            if worked_days is None:

                worked_days = (
                    _default_worked_days(
                        payrun.period_start,
                        payrun.period_end,
                    )
                )

            # ------------------------------------------------
            # Contract Wage
            # ------------------------------------------------

            contract_wage = Decimal(
                str(contract.wage)
            )

            # ------------------------------------------------
            # Calculation Input
            # ------------------------------------------------

            calc_input = CalculationInput(
                structure_id=structure.id,
                employee_id=employee_id,
                contract_id=contract.id,
                period_start=payrun.period_start,
                period_end=payrun.period_end,
                worked_days=worked_days,
                base_inputs={
                    "BASIC": contract_wage
                },
            )

            # ------------------------------------------------
            # Calculate Payroll
            # ------------------------------------------------

            result = calculate_payslip(
                rules,
                calc_input,
            )

            # ------------------------------------------------
            # Get Calculation Results
            # ------------------------------------------------

            gross_salary = (
                result.gross_salary
            )

            total_deductions = (
                result.total_deductions
            )

            net_salary = (
                result.net_salary
            )

            # ------------------------------------------------
            # FALLBACK:
            # If no active salary rules exist,
            # use contract wage directly.
            # ------------------------------------------------

            if not rules:

                gross_salary = (
                    contract_wage.quantize(
                        Decimal("0.01")
                    )
                )

                total_deductions = (
                    Decimal("0.00")
                )

                net_salary = (
                    gross_salary
                )

                warnings.append(
                    f"No active salary rules found "
                    f"for employee {employee_id}. "
                    f"Contract wage was used as "
                    f"BASIC salary."
                )

            # ------------------------------------------------
            # Create Payslip
            # ------------------------------------------------

            payslip = Payslip(
                payrun_id=payrun.id,
                employee_id=employee_id,
                contract_id=contract.id,
                salary_structure_id=structure.id,
                worked_days=worked_days,
                gross_salary=gross_salary,
                total_deductions=total_deductions,
                net_salary=net_salary,
                status=PayrunStatus.COMPUTED,
            )

            db.add(
                payslip
            )

            # Generate payslip ID

            db.flush()

            # ------------------------------------------------
            # Create Payslip Lines
            # ------------------------------------------------

            for line in result.lines:

                rule = (
                    rules_by_code.get(
                        line.code
                    )
                )

                if rule is None:
                    continue

                payslip_line = (
                    PayslipLine(
                        payslip_id=payslip.id,
                        rule_id=rule.id,
                        code=line.code,
                        name=line.name,
                        category=line.category,
                        sequence=line.sequence,
                        amount=line.amount,
                    )
                )

                db.add(
                    payslip_line
                )

            db.flush()

        # ----------------------------------------------------
        # HR Error
        # ----------------------------------------------------

        except HRClientError as exc:

            savepoint.rollback()

            warnings.append(
                f"HR lookup failed for employee "
                f"{employee_id}: {exc}"
            )

        # ----------------------------------------------------
        # Payroll Calculation Error
        # ----------------------------------------------------

        except PayrollEngineError as exc:

            savepoint.rollback()

            warnings.append(
                f"Calculation failed for employee "
                f"{employee_id}: {exc}"
            )

        # ----------------------------------------------------
        # Duplicate Payslip
        # ----------------------------------------------------

        except IntegrityError:

            savepoint.rollback()

            warnings.append(
                f"Payslip already exists for "
                f"employee {employee_id} "
                f"in this payrun; skipped."
            )

        # ----------------------------------------------------
        # Successful Calculation
        # ----------------------------------------------------

        else:

            savepoint.commit()

            payslip_count += 1

    # ========================================================
    # UPDATE PAYRUN STATUS
    # ========================================================

    if payslip_count > 0:

        payrun.status = (
            PayrunStatus.COMPUTED
        )

    else:

        warnings.append(
            "No payslips could be computed; "
            "payrun remains DRAFT."
        )

    # ========================================================
    # SAVE DATABASE
    # ========================================================

    db.commit()

    db.refresh(
        payrun
    )

    return (
        payrun,
        payslip_count,
        warnings,
    )


# ============================================================
# VALIDATE PAYRUN
# ============================================================

def validate_payrun(

    db: Session,

    payrun_id: UUID,

) -> Payrun:

    payrun = db.get(
        Payrun,
        payrun_id,
    )

    if payrun is None:
        raise PayrunNotFoundError(
            payrun_id
        )

    if (
        payrun.status
        != PayrunStatus.COMPUTED
    ):
        raise InvalidPayrunStateError(
            payrun_id,
            payrun.status,
            "validate",
            "Only COMPUTED payruns "
            "can be validated.",
        )

    payrun.status = (
        PayrunStatus.VALIDATED
    )

    db.commit()

    db.refresh(
        payrun
    )

    return payrun


# ============================================================
# MARK PAYRUN PAID
# ============================================================

def mark_payrun_paid(

    db: Session,

    payrun_id: UUID,

) -> Payrun:

    payrun = db.get(
        Payrun,
        payrun_id,
    )

    if payrun is None:
        raise PayrunNotFoundError(
            payrun_id
        )

    if (
        payrun.status
        != PayrunStatus.VALIDATED
    ):
        raise InvalidPayrunStateError(
            payrun_id,
            payrun.status,
            "mark-paid",
            "Only VALIDATED payruns "
            "can be marked PAID.",
        )

    payrun.status = (
        PayrunStatus.PAID
    )

    db.commit()

    db.refresh(
        payrun
    )

    return payrun


# ============================================================
# GET PAYSLIP
# ============================================================

def get_payslip(

    db: Session,

    payslip_id: UUID,

) -> Payslip:

    payslip = db.get(
        Payslip,
        payslip_id,
    )

    if payslip is None:
        raise PayslipNotFoundError(
            payslip_id
        )

    return payslip


# ============================================================
# LIST PAYSLIPS FOR PAYRUN
# ============================================================

def list_payslips_for_payrun(

    db: Session,

    payrun_id: UUID,

) -> list[Payslip]:

    return list(
        db.scalars(
            select(Payslip)
            .where(
                Payslip.payrun_id
                == payrun_id
            )
        ).all()
    )


# ============================================================
# GET PAYSLIP LINES
# ============================================================

def get_payslip_lines(

    db: Session,

    payslip_id: UUID,

) -> list[PayslipLine]:

    return list(
        db.scalars(
            select(PayslipLine)
            .where(
                PayslipLine.payslip_id
                == payslip_id
            )
            .order_by(
                PayslipLine.sequence.asc()
            )
        ).all()
    )