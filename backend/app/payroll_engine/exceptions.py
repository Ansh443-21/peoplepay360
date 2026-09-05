"""Typed exceptions for the payroll calculation engine.

Every failure mode raises one of these instead of silently
defaulting a value to zero.
"""


class PayrollEngineError(Exception):
    """Base class for all payroll engine errors."""


class InvalidPayrollPeriodError(PayrollEngineError):
    """period_end is before period_start, or worked_days is invalid."""


class InvalidRuleError(PayrollEngineError):
    """A rule is inactive, malformed, or has an unrecognized computation_type."""

    def __init__(self, rule_code: str, reason: str):
        self.rule_code = rule_code
        self.reason = reason
        super().__init__(f"Invalid rule '{rule_code}': {reason}")


class DuplicateRuleCodeError(PayrollEngineError):
    """Two active rules in the same structure share the same code."""

    def __init__(self, code: str):
        self.code = code
        super().__init__(f"Duplicate rule code within structure: '{code}'")


class MissingFixedAmountError(PayrollEngineError):
    """A FIXED rule has no fixed_amount."""

    def __init__(self, rule_code: str):
        self.rule_code = rule_code
        super().__init__(f"Rule '{rule_code}' is FIXED but fixed_amount is missing")


class MissingPercentageError(PayrollEngineError):
    """A PERCENTAGE rule has no percentage value."""

    def __init__(self, rule_code: str):
        self.rule_code = rule_code
        super().__init__(f"Rule '{rule_code}' is PERCENTAGE but percentage is missing")


class MissingPercentageBaseError(PayrollEngineError):
    """A PERCENTAGE rule's base code is not present in the context."""

    def __init__(self, rule_code: str, base_code: str):
        self.rule_code = rule_code
        self.base_code = base_code
        super().__init__(
            f"Rule '{rule_code}' references base '{base_code}' which has not "
            f"been computed yet (or is missing from base_inputs)"
        )


class UnknownFormulaVariableError(PayrollEngineError):
    """A FORMULA rule references a name not present in the context."""

    def __init__(self, rule_code: str, variable: str):
        self.rule_code = rule_code
        self.variable = variable
        super().__init__(
            f"Rule '{rule_code}' formula references unknown variable '{variable}'"
        )


class InvalidFormulaError(PayrollEngineError):
    """A FORMULA rule's expression is empty, unparsable, or malformed."""

    def __init__(self, rule_code: str, reason: str):
        self.rule_code = rule_code
        self.reason = reason
        super().__init__(f"Rule '{rule_code}' has invalid formula: {reason}")


class UnsafeFormulaError(PayrollEngineError):
    """A FORMULA rule's expression uses a disallowed AST node."""

    def __init__(self, rule_code: str, node_type: str):
        self.rule_code = rule_code
        self.node_type = node_type
        super().__init__(
            f"Rule '{rule_code}' formula uses disallowed construct: {node_type}"
        )


class NegativeValueError(PayrollEngineError):
    """A computed value or input is negative where it must not be."""

    def __init__(self, label: str, value):
        self.label = label
        self.value = value
        super().__init__(f"'{label}' must not be negative, got {value}")