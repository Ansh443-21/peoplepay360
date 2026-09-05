"""
Focused tests for the payroll service layer.

Uses a real SQLite in-memory database — sqlalchemy.dialects.postgresql.UUID
degrades cleanly to CHAR on non-Postgres dialects, so the existing models
work unmodified here without needing a live Supabase connection.

HR contract lookups are stubbed via a fake ActiveContractProvider —
no HTTP calls are made in these tests.
"""

from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.payroll_hr_client import ActiveContractDTO
from app.payroll_models import (
    ComputationType,
    PayrunStatus,
    SalaryCategory,
    SalaryRule,
    SalaryStructure,
)
from app.payroll_service import (
    EmptyEmployeeListError,
    InvalidPayrunStateError,
    InvalidPeriodError,
    compute_payrun,
    create_payrun,
    get_payslip,
    get_payslip_lines,
    validate_payrun,
    mark_payrun_paid,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")

    # Standard SQLAlchemy recipe so SAVEPOINT (begin_nested) works correctly
    # against SQLite's pysqlite driver.
    @event.listens_for(engine, "connect")
    def do_connect(dbapi_connection, connection_record):
        dbapi_connection.isolation_level = None

    @event.listens_for(engine, "begin")
    def do_begin(conn):
        conn.exec_driver_sql("BEGIN")

    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


class FakeHRClient:
    """Stub ActiveContractProvider — no HTTP calls."""

    def __init__(self, contracts: dict):
        self._contracts = contracts

    def get_active_contract(self, employee_id, period_start, period_end):
        return self._contracts.get(employee_id)


def _make_structure_with_rules(db) -> SalaryStructure:
    structure = SalaryStructure(name="Standard", is_active=True)
    db.add(structure)
    db.flush()

    earning_cat = SalaryCategory(name="Earning", code="EARNING")
    pf_cat = SalaryCategory(name="Provident Fund", code="PF")
    db.add_all([earning_cat, pf_cat])
    db.flush()

    basic = SalaryRule(
        structure_id=structure.id, category_id=earning_cat.id,
        name="Basic Pay", code="BASIC", sequence=10,
        computation_type=ComputationType.FIXED, fixed_amount=None,
    )
    # BASIC is seeded from contract.wage as a base_input, not a FIXED rule
    # with a hardcoded amount — so give it a FORMULA that just echoes itself
    # would be redundant; instead we don't add a BASIC rule row at all and
    # rely on base_inputs={"BASIC": wage}. Remove the placeholder above.
    db.rollback()  # discard the unused `basic` object above; re-flush clean state
    db.add(structure)
    db.add_all([earning_cat, pf_cat])
    db.flush()

    hra = SalaryRule(
        structure_id=structure.id, category_id=earning_cat.id,
        name="HRA", code="HRA", sequence=10,
        computation_type=ComputationType.PERCENTAGE,
        percentage=Decimal("20.00"), formula="BASIC", is_active=True,
    )
    pf = SalaryRule(
        structure_id=structure.id, category_id=pf_cat.id,
        name="Provident Fund", code="PF", sequence=20,
        computation_type=ComputationType.PERCENTAGE,
        percentage=Decimal("12.00"), formula="BASIC", is_active=True,
    )
    db.add_all([hra, pf])
    db.commit()
    db.refresh(structure)
    return structure


def _create_request(structure_id, employee_ids=None):
    from app.payroll_schemas import CreatePayrunRequest
    return CreatePayrunRequest(
        name="September 2026 Payroll",
        salary_structure_id=structure_id,
        period_start=date(2026, 9, 1),
        period_end=date(2026, 9, 30),
        employee_ids=employee_ids or [],
    )


# ---------------------------------------------------------------------------
# 1. Create payrun
# ---------------------------------------------------------------------------

def test_create_payrun_success(db):
    structure = _make_structure_with_rules(db)
    payrun = create_payrun(db, _create_request(structure.id))
    assert payrun.status == PayrunStatus.DRAFT
    assert payrun.salary_structure_id == structure.id


# ---------------------------------------------------------------------------
# 2. Invalid period
# ---------------------------------------------------------------------------

def test_create_payrun_invalid_period_raises(db):
    structure = _make_structure_with_rules(db)
    req = _create_request(structure.id)
    req.period_end = date(2026, 8, 1)  # before period_start
    with pytest.raises(InvalidPeriodError):
        create_payrun(db, req)


# ---------------------------------------------------------------------------
# 3. Compute payrun (also covers rules loading in sequence + payslip lines)
# ---------------------------------------------------------------------------

def test_compute_payrun_success(db):
    structure = _make_structure_with_rules(db)
    payrun = create_payrun(db, _create_request(structure.id))

    employee_id = uuid4()
    contract = ActiveContractDTO(
        id=uuid4(), employee_id=employee_id, salary_structure_id=structure.id,
        wage=Decimal("50000.00"), start_date=date(2026, 9, 1), end_date=None, status="ACTIVE",
    )
    hr_client = FakeHRClient({employee_id: contract})

    updated_payrun, count, warnings = compute_payrun(
        db, payrun.id, [employee_id], hr_client
    )

    assert count == 1
    assert warnings == []
    assert updated_payrun.status == PayrunStatus.COMPUTED

    payslips = list_payslips_for_payrun_helper(db, payrun.id)
    assert len(payslips) == 1
    payslip = payslips[0]
    # gross = BASIC(50000) + HRA(20% of 50000=10000) = 60000
    # deductions = PF(12% of 50000=6000)
    assert payslip.gross_salary == Decimal("60000.00")
    assert payslip.total_deductions == Decimal("6000.00")
    assert payslip.net_salary == Decimal("54000.00")


def list_payslips_for_payrun_helper(db, payrun_id):
    from app.payroll_service import list_payslips_for_payrun
    return list_payslips_for_payrun(db, payrun_id)


# ---------------------------------------------------------------------------
# 4. Invalid status transition (recompute a COMPUTED payrun)
# ---------------------------------------------------------------------------

def test_recompute_computed_payrun_raises(db):
    structure = _make_structure_with_rules(db)
    payrun = create_payrun(db, _create_request(structure.id))
    employee_id = uuid4()
    contract = ActiveContractDTO(
        id=uuid4(), employee_id=employee_id, salary_structure_id=structure.id,
        wage=Decimal("50000.00"), start_date=date(2026, 9, 1), end_date=None, status="ACTIVE",
    )
    hr_client = FakeHRClient({employee_id: contract})
    compute_payrun(db, payrun.id, [employee_id], hr_client)

    with pytest.raises(InvalidPayrunStateError):
        compute_payrun(db, payrun.id, [employee_id], hr_client)


# ---------------------------------------------------------------------------
# 5. Missing active contract -> warning, no payslip
# ---------------------------------------------------------------------------

def test_missing_active_contract_produces_warning(db):
    structure = _make_structure_with_rules(db)
    payrun = create_payrun(db, _create_request(structure.id))

    employee_with_contract = uuid4()
    employee_without_contract = uuid4()
    contract = ActiveContractDTO(
        id=uuid4(), employee_id=employee_with_contract, salary_structure_id=structure.id,
        wage=Decimal("40000.00"), start_date=date(2026, 9, 1), end_date=None, status="ACTIVE",
    )
    hr_client = FakeHRClient({employee_with_contract: contract})

    updated_payrun, count, warnings = compute_payrun(
        db, payrun.id, [employee_with_contract, employee_without_contract], hr_client
    )

    assert count == 1
    assert len(warnings) == 1
    assert str(employee_without_contract) in warnings[0]
    assert updated_payrun.status == PayrunStatus.COMPUTED


# ---------------------------------------------------------------------------
# 6. Empty employee list
# ---------------------------------------------------------------------------

def test_compute_with_empty_employee_list_raises(db):
    structure = _make_structure_with_rules(db)
    payrun = create_payrun(db, _create_request(structure.id))
    with pytest.raises(EmptyEmployeeListError):
        compute_payrun(db, payrun.id, [], FakeHRClient({}))


# ---------------------------------------------------------------------------
# 7. Payslip line creation
# ---------------------------------------------------------------------------

def test_payslip_line_creation(db):
    structure = _make_structure_with_rules(db)
    payrun = create_payrun(db, _create_request(structure.id))
    employee_id = uuid4()
    contract = ActiveContractDTO(
        id=uuid4(), employee_id=employee_id, salary_structure_id=structure.id,
        wage=Decimal("50000.00"), start_date=date(2026, 9, 1), end_date=None, status="ACTIVE",
    )
    hr_client = FakeHRClient({employee_id: contract})
    compute_payrun(db, payrun.id, [employee_id], hr_client)

    payslips = list_payslips_for_payrun_helper(db, payrun.id)
    lines = get_payslip_lines(db, payslips[0].id)
    codes = {line.code for line in lines}
    assert codes == {"HRA", "PF"}


# ---------------------------------------------------------------------------
# 8. Duplicate payslip prevention (same employee twice in one compute call)
# ---------------------------------------------------------------------------

def test_duplicate_payslip_prevented(db):
    structure = _make_structure_with_rules(db)
    payrun = create_payrun(db, _create_request(structure.id))
    employee_id = uuid4()
    contract = ActiveContractDTO(
        id=uuid4(), employee_id=employee_id, salary_structure_id=structure.id,
        wage=Decimal("50000.00"), start_date=date(2026, 9, 1), end_date=None, status="ACTIVE",
    )
    hr_client = FakeHRClient({employee_id: contract})

    updated_payrun, count, warnings = compute_payrun(
        db, payrun.id, [employee_id, employee_id], hr_client
    )

    assert count == 1
    assert any("already exists" in w for w in warnings)
    payslips = list_payslips_for_payrun_helper(db, payrun.id)
    assert len(payslips) == 1


# ---------------------------------------------------------------------------
# 9. Validate transition
# ---------------------------------------------------------------------------

def test_validate_transition(db):
    structure = _make_structure_with_rules(db)
    payrun = create_payrun(db, _create_request(structure.id))

    with pytest.raises(InvalidPayrunStateError):
        validate_payrun(db, payrun.id)  # still DRAFT

    employee_id = uuid4()
    contract = ActiveContractDTO(
        id=uuid4(), employee_id=employee_id, salary_structure_id=structure.id,
        wage=Decimal("50000.00"), start_date=date(2026, 9, 1), end_date=None, status="ACTIVE",
    )
    compute_payrun(db, payrun.id, [employee_id], FakeHRClient({employee_id: contract}))

    validated = validate_payrun(db, payrun.id)
    assert validated.status == PayrunStatus.VALIDATED


# ---------------------------------------------------------------------------
# 10. Mark-paid transition
# ---------------------------------------------------------------------------

def test_mark_paid_transition(db):
    structure = _make_structure_with_rules(db)
    payrun = create_payrun(db, _create_request(structure.id))
    employee_id = uuid4()
    contract = ActiveContractDTO(
        id=uuid4(), employee_id=employee_id, salary_structure_id=structure.id,
        wage=Decimal("50000.00"), start_date=date(2026, 9, 1), end_date=None, status="ACTIVE",
    )
    compute_payrun(db, payrun.id, [employee_id], FakeHRClient({employee_id: contract}))

    with pytest.raises(InvalidPayrunStateError):
        mark_payrun_paid(db, payrun.id)  # still COMPUTED, not VALIDATED

    validate_payrun(db, payrun.id)
    paid = mark_payrun_paid(db, payrun.id)
    assert paid.status == PayrunStatus.PAID