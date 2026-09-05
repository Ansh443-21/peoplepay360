"""
Orchestrates payroll calculation: sorts active rules by sequence,
resolves each rule's value against the running context, then
aggregates results into gross/deductions/net.

No database access happens here — the caller fetches active
SalaryRule rows for a structure_id and passes them in, and provides
contract-derived base_inputs. Employee/Contract concepts never
appear inside this module.
"""

from decimal import ROUND_HALF_UP, Decimal

from backend.app.payroll_models import ComputationType
from backend.app.payroll_engine.context import (
    CalculationContext,
    CalculationInput,
    CalculationResult,
    PayslipLineResult,
)
from backend.app.payroll_engine.exceptions import (
    DuplicateRuleCodeError,
    InvalidPayrollPeriodError,
    InvalidRuleError,
    NegativeValueError,
)
from backend.app.payroll_engine.resolvers import resolve_fixed, resolve_formula, resolve_percentage

_CENTS = Decimal("0.01")

# ---------------------------------------------------------------------------
# Earning/deduction classification.
#
# Hackathon-only convention: a rule is a deduction if its category's `code`
# is one of these. This is intentionally isolated in one place so it can be
# swapped for a real SalaryCategory.type / SalaryRule.rule_type field later
# without touching aggregation logic elsewhere.
# ---------------------------------------------------------------------------
_DEDUCTION_CATEGORY_CODES = frozenset({"PF", "TAX", "DEDUCTION"})


def is_deduction_category(category_code: str) -> bool:
    return (category_code or "").strip().upper() in _DEDUCTION_CATEGORY_CODES


def _quantize(value: Decimal) -> Decimal:
    return value.quantize(_CENTS, rounding=ROUND_HALF_UP)


def _validate_input(calc_input: CalculationInput) -> None:
    if calc_input.period_end < calc_input.period_start:
        raise InvalidPayrollPeriodError(
            f"period_end ({calc_input.period_end}) is before "
            f"period_start ({calc_input.period_start})"
        )
    if calc_input.worked_days is None or calc_input.worked_days < 0:
        raise InvalidPayrollPeriodError(
            f"worked_days must be >= 0, got {calc_input.worked_days}"
        )
    for code, value in calc_input.base_inputs.items():
        if value is None:
            raise InvalidRuleError(code, "base_inputs value is None")
        if value < 0:
            raise NegativeValueError(f"base_inputs[{code}]", value)


def _validate_rules(rules: list) -> list:
    """Filter/validate the rule list: active only, no duplicate codes."""
    seen_codes: set[str] = set()
    active_rules = []
    for rule in rules:
        if not getattr(rule, "is_active", False):
            continue
        if not rule.code:
            raise InvalidRuleError("<missing>", "rule has no code")
        if rule.code in seen_codes:
            raise DuplicateRuleCodeError(rule.code)
        seen_codes.add(rule.code)
        active_rules.append(rule)

    if not active_rules:
        return active_rules

    return sorted(active_rules, key=lambda r: r.sequence)


def _resolve_rule(rule, context: CalculationContext) -> Decimal:
    if rule.computation_type == ComputationType.FIXED:
        return resolve_fixed(rule)
    if rule.computation_type == ComputationType.PERCENTAGE:
        return resolve_percentage(rule, context)
    if rule.computation_type == ComputationType.FORMULA:
        return resolve_formula(rule, context)

    raise InvalidRuleError(
        rule.code, f"unrecognized computation_type '{rule.computation_type}'"
    )


def _category_label(rule) -> str:
    """
    Best-effort human-readable category label for the payslip line.
    Accepts either a rule with a `.category` attribute already resolved
    to a code/name string, or one with a `.category_id` only (in which
    case the id is stringified — callers that want a friendly category
    name should resolve it before passing rules in, e.g. by attaching
    a `.category_code` attribute to the rule object).
    """
    category_code = getattr(rule, "category_code", None)
    if category_code:
        return category_code
    category = getattr(rule, "category", None)
    if category is not None:
        return getattr(category, "code", str(category))
    return str(getattr(rule, "category_id", "")) or "UNCATEGORIZED"


def calculate_payslip(rules: list, calc_input: CalculationInput) -> CalculationResult:
    """
    Main entry point.

    rules: list of SalaryRule-like objects for calc_input.structure_id
           (caller is responsible for filtering to the correct structure_id;
           this function filters to is_active and sorts by sequence).
    calc_input: CalculationInput with seed base_inputs (e.g. {"BASIC": ...}).
    """
    _validate_input(calc_input)
    ordered_rules = _validate_rules(rules)

    context = CalculationContext(
        base_inputs=calc_input.base_inputs,
        worked_days=calc_input.worked_days,
    )

    lines: list[PayslipLineResult] = []
    for rule in ordered_rules:
        value = _resolve_rule(rule, context)
        context.set(rule.code, value)

        lines.append(
            PayslipLineResult(
                code=rule.code,
                name=rule.name,
                category=_category_label(rule),
                sequence=rule.sequence,
                amount=value,
            )
        )

    gross = Decimal("0.00")
    deductions = Decimal("0.00")
    for line in lines:
        if is_deduction_category(line.category):
            deductions += line.amount
        else:
            gross += line.amount

    gross = _quantize(gross)
    deductions = _quantize(deductions)
    net = _quantize(gross - deductions)

    return CalculationResult(
        gross_salary=gross,
        total_deductions=deductions,
        net_salary=net,
        lines=lines,
    )