"""
Payroll calculation engine for PeoplePay360.

Pure Python, no DB access, no side effects. Given a list of active
SalaryRule rows (already fetched by the caller) and a CalculationInput,
computes gross/deductions/net + per-rule payslip lines.
"""

from backend.app.payroll_engine.engine import calculate_payslip
from backend.app.payroll_engine.context import CalculationContext, CalculationInput, CalculationResult, PayslipLineResult
from backend.app.payroll_engine.exceptions import (
    PayrollEngineError,
    InvalidPayrollPeriodError,
    InvalidRuleError,
    DuplicateRuleCodeError,
    MissingFixedAmountError,
    MissingPercentageError,
    MissingPercentageBaseError,
    UnknownFormulaVariableError,
    InvalidFormulaError,
    UnsafeFormulaError,
    NegativeValueError,
)

__all__ = [
    "calculate_payslip",
    "CalculationContext",
    "CalculationInput",
    "CalculationResult",
    "PayslipLineResult",
    "PayrollEngineError",
    "InvalidPayrollPeriodError",
    "InvalidRuleError",
    "DuplicateRuleCodeError",
    "MissingFixedAmountError",
    "MissingPercentageError",
    "MissingPercentageBaseError",
    "UnknownFormulaVariableError",
    "InvalidFormulaError",
    "UnsafeFormulaError",
    "NegativeValueError",
]