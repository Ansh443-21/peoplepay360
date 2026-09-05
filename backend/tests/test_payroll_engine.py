"""
Focused unit tests for the payroll calculation engine.
No database access — rules are plain in-memory stand-ins.
"""

from datetime import date
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.payroll_models import ComputationType
from app.payroll_engine.context import CalculationInput
from app.payroll_engine.engine import calculate_payslip
from app.payroll_engine.exceptions import (
    MissingPercentageBaseError,
    UnknownFormulaVariableError,
    UnsafeFormulaError,
)


def make_rule(
    code,
    name,
    sequence,
    computation_type,
    fixed_amount=None,
    percentage=None,
    formula=None,
    category_code="EARNING",
    is_active=True,
):
    """Lightweight stand-in for a SalaryRule ORM row."""
    return SimpleNamespace(
        code=code,
        name=name,
        sequence=sequence,
        computation_type=computation_type,
        fixed_amount=fixed_amount,
        percentage=percentage,
        formula=formula,
        category_code=category_code,
        is_active=is_active,
    )


def make_input(base_inputs=None, worked_days=Decimal("30")):
    return CalculationInput(
        structure_id=uuid4(),
        employee_id=uuid4(),
        contract_id=uuid4(),
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        worked_days=worked_days,
        base_inputs=base_inputs or {},
    )


# ---------------------------------------------------------------------------
# 1. FIXED rule
# ---------------------------------------------------------------------------

def test_fixed_rule():
    rules = [
        make_rule("ALLOWANCE", "Allowance", 10, ComputationType.FIXED,
                   fixed_amount=Decimal("2000.00")),
    ]
    result = calculate_payslip(rules, make_input())
    assert result.lines[0].amount == Decimal("2000.00")
    assert result.gross_salary == Decimal("2000.00")


# ---------------------------------------------------------------------------
# 2. PERCENTAGE based on BASIC
# ---------------------------------------------------------------------------

def test_percentage_based_on_basic():
    rules = [
        make_rule("HRA", "House Rent Allowance", 20, ComputationType.PERCENTAGE,
                   percentage=Decimal("20.00"), formula="BASIC"),
    ]
    calc_input = make_input(base_inputs={"BASIC": Decimal("50000.00")})
    result = calculate_payslip(rules, calc_input)
    assert result.lines[0].amount == Decimal("10000.00")


# ---------------------------------------------------------------------------
# 3. Multiple sequential rules (BASIC/HRA/ALLOWANCE/PF -> GROSS/NET)
# ---------------------------------------------------------------------------

def test_multiple_sequential_rules_full_payslip():
    rules = [
        make_rule("BASIC", "Basic Pay", 10, ComputationType.FIXED,
                   fixed_amount=Decimal("50000.00"), category_code="EARNING"),
        make_rule("HRA", "HRA", 20, ComputationType.PERCENTAGE,
                   percentage=Decimal("20.00"), formula="BASIC", category_code="EARNING"),
        make_rule("ALLOWANCE", "Allowance", 30, ComputationType.FIXED,
                   fixed_amount=Decimal("2000.00"), category_code="EARNING"),
        make_rule("PF", "Provident Fund", 40, ComputationType.PERCENTAGE,
                   percentage=Decimal("12.00"), formula="BASIC", category_code="PF"),
    ]
    result = calculate_payslip(rules, make_input())

    assert result.gross_salary == Decimal("62000.00")       # 50000 + 10000 + 2000
    assert result.total_deductions == Decimal("6000.00")     # 12% of 50000
    assert result.net_salary == Decimal("56000.00")


# ---------------------------------------------------------------------------
# 4. FORMULA using prior rule codes
# ---------------------------------------------------------------------------

def test_formula_using_prior_rule_codes():
    rules = [
        make_rule("BASIC", "Basic Pay", 10, ComputationType.FIXED,
                   fixed_amount=Decimal("50000.00")),
        make_rule("HRA", "HRA", 20, ComputationType.PERCENTAGE,
                   percentage=Decimal("20.00"), formula="BASIC"),
        make_rule("SPECIAL", "Special Allowance", 30, ComputationType.FORMULA,
                   formula="(BASIC + HRA) * 0.1"),
    ]
    result = calculate_payslip(rules, make_input())
    # (50000 + 10000) * 0.1 = 6000.00
    special_line = next(l for l in result.lines if l.code == "SPECIAL")
    assert special_line.amount == Decimal("6000.00")


# ---------------------------------------------------------------------------
# 5. Missing percentage base
# ---------------------------------------------------------------------------

def test_missing_percentage_base_raises():
    rules = [
        make_rule("HRA", "HRA", 10, ComputationType.PERCENTAGE,
                   percentage=Decimal("20.00"), formula="BASIC"),
    ]
    with pytest.raises(MissingPercentageBaseError):
        calculate_payslip(rules, make_input(base_inputs={}))


# ---------------------------------------------------------------------------
# 6. Unknown formula variable
# ---------------------------------------------------------------------------

def test_unknown_formula_variable_raises():
    rules = [
        make_rule("BONUS", "Bonus", 10, ComputationType.FORMULA,
                   formula="NON_EXISTENT * 2"),
    ]
    with pytest.raises(UnknownFormulaVariableError):
        calculate_payslip(rules, make_input())


# ---------------------------------------------------------------------------
# 7. Unsafe formula rejection
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "formula",
    [
        "__import__('os').system('echo hi')",
        "os.system('echo hi')",
        "[x for x in range(10)]",
        "(lambda: 1)()",
        "open('file.txt')",
        "BASIC.__class__",
        "BASIC if True else 0",
    ],
)
def test_unsafe_formula_rejected(formula):
    rules = [
        make_rule("BASIC", "Basic Pay", 10, ComputationType.FIXED,
                   fixed_amount=Decimal("50000.00")),
        make_rule("HACK", "Hack Attempt", 20, ComputationType.FORMULA,
                   formula=formula),
    ]
    with pytest.raises(UnsafeFormulaError):
        calculate_payslip(rules, make_input())


# ---------------------------------------------------------------------------
# 8. Earnings/deductions aggregation
# ---------------------------------------------------------------------------

def test_earnings_deductions_aggregation():
    rules = [
        make_rule("BASIC", "Basic Pay", 10, ComputationType.FIXED,
                   fixed_amount=Decimal("30000.00"), category_code="EARNING"),
        make_rule("TAX", "Income Tax", 20, ComputationType.FIXED,
                   fixed_amount=Decimal("3000.00"), category_code="TAX"),
        make_rule("DED_MISC", "Misc Deduction", 30, ComputationType.FIXED,
                   fixed_amount=Decimal("500.00"), category_code="DEDUCTION"),
    ]
    result = calculate_payslip(rules, make_input())
    assert result.gross_salary == Decimal("30000.00")
    assert result.total_deductions == Decimal("3500.00")
    assert result.net_salary == Decimal("26500.00")


# ---------------------------------------------------------------------------
# 9. Decimal rounding (ROUND_HALF_UP to 2dp)
# ---------------------------------------------------------------------------

def test_decimal_rounding_half_up():
    rules = [
        make_rule("BASIC", "Basic Pay", 10, ComputationType.FIXED,
                   fixed_amount=Decimal("10000.005")),
        make_rule("HRA", "HRA", 20, ComputationType.PERCENTAGE,
                   percentage=Decimal("33.335"), formula="BASIC"),
    ]
    result = calculate_payslip(rules, make_input())

    basic_line = next(l for l in result.lines if l.code == "BASIC")
    hra_line = next(l for l in result.lines if l.code == "HRA")

    # 10000.005 -> rounds half up to 10000.01
    assert basic_line.amount == Decimal("10000.01")
    # 33.335% of 10000.01 = 3333.5033335 -> rounds to 3333.50
    assert hra_line.amount == Decimal("3333.50")
    assert result.gross_salary == basic_line.amount + hra_line.amount