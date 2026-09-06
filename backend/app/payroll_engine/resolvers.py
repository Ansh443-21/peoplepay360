"""
Per-computation_type resolver functions. Each takes a SalaryRule
(or any object with the same attribute shape) and the running
CalculationContext, and returns the rule's computed Decimal value
quantized to 2 decimal places (ROUND_HALF_UP).

None of these mutate the context directly — the engine is
responsible for calling context.set(rule.code, value) after a
resolver returns, keeping "compute" and "record" separate.
"""

from decimal import ROUND_HALF_UP, Decimal

from app.payroll_engine.context import CalculationContext
from app.payroll_engine.exceptions import (
    MissingFixedAmountError,
    MissingPercentageBaseError,
    MissingPercentageError,
)
from app.payroll_engine.safe_eval import safe_eval_formula

_CENTS = Decimal("0.01")
DEFAULT_PERCENTAGE_BASE_CODE = "BASIC"


def _quantize(value: Decimal) -> Decimal:
    return value.quantize(_CENTS, rounding=ROUND_HALF_UP)


def resolve_fixed(rule) -> Decimal:
    if rule.fixed_amount is None:
        raise MissingFixedAmountError(rule.code)
    return _quantize(Decimal(rule.fixed_amount))


def resolve_percentage(rule, context: CalculationContext) -> Decimal:
    if rule.percentage is None:
        raise MissingPercentageError(rule.code)

    base_code = (rule.formula or "").strip() or DEFAULT_PERCENTAGE_BASE_CODE
    base_value = context.get(base_code)
    if base_value is None:
        raise MissingPercentageBaseError(rule.code, base_code)

    percentage = Decimal(rule.percentage)
    value = (percentage / Decimal("100")) * Decimal(base_value)
    return _quantize(value)


def resolve_formula(rule, context: CalculationContext) -> Decimal:
    value = safe_eval_formula(rule.code, rule.formula, context.as_dict())
    return _quantize(value)