"""
Restricted AST-based evaluator for SalaryRule.formula.

Never uses eval()/exec()/compile-to-execute. Parses the expression into
an AST, then recursively evaluates only a small whitelist of node types
using Decimal arithmetic. Any other node type is rejected.

Allowed:
    - Module/Expression wrapper
    - BinOp: Add, Sub, Mult, Div, Pow
    - UnaryOp: USub (unary minus)
    - Constant (numeric only)
    - Name (Load context only) — must already exist in the provided context

Rejected (raises UnsafeFormulaError):
    - Attribute access, subscripting, function calls, comprehensions,
      imports, lambda, boolean ops, comparisons, string constants,
      dunder names, or anything else not explicitly listed above.
"""

import ast
from decimal import Decimal, DivisionByZero, InvalidOperation

from backend.app.payroll_engine.exceptions import (
    InvalidFormulaError,
    UnknownFormulaVariableError,
    UnsafeFormulaError,
)

_ALLOWED_BINOPS = (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow)
_ALLOWED_UNARYOPS = (ast.USub,)


def safe_eval_formula(rule_code: str, formula: str, context: dict) -> Decimal:
    """
    Evaluate `formula` using only variables present in `context`.
    Returns a Decimal. Raises InvalidFormulaError / UnsafeFormulaError /
    UnknownFormulaVariableError on any problem.
    """
    if not formula or not formula.strip():
        raise InvalidFormulaError(rule_code, "formula is empty")

    try:
        parsed = ast.parse(formula, mode="eval")
    except (SyntaxError, ValueError) as exc:
        raise InvalidFormulaError(rule_code, f"could not parse expression: {exc}") from exc

    try:
        result = _eval_node(rule_code, parsed.body, context)
    except (DivisionByZero, InvalidOperation, ZeroDivisionError) as exc:
        raise InvalidFormulaError(rule_code, f"arithmetic error: {exc}") from exc

    if not isinstance(result, Decimal):
        raise InvalidFormulaError(rule_code, "formula did not evaluate to a numeric value")

    return result


def _eval_node(rule_code: str, node: ast.AST, context: dict) -> Decimal:
    if isinstance(node, ast.Constant):
        if isinstance(node.value, bool) or not isinstance(node.value, (int, float)):
            raise UnsafeFormulaError(rule_code, f"Constant({type(node.value).__name__})")
        return Decimal(str(node.value))

    if isinstance(node, ast.Name):
        if not isinstance(node.ctx, ast.Load):
            raise UnsafeFormulaError(rule_code, "Name (non-Load context)")
        if node.id.startswith("__"):
            raise UnsafeFormulaError(rule_code, "dunder name")
        if node.id not in context:
            raise UnknownFormulaVariableError(rule_code, node.id)
        value = context[node.id]
        return value if isinstance(value, Decimal) else Decimal(str(value))

    if isinstance(node, ast.BinOp):
        if not isinstance(node.op, _ALLOWED_BINOPS):
            raise UnsafeFormulaError(rule_code, f"BinOp({type(node.op).__name__})")
        left = _eval_node(rule_code, node.left, context)
        right = _eval_node(rule_code, node.right, context)
        if isinstance(node.op, ast.Add):
            return left + right
        if isinstance(node.op, ast.Sub):
            return left - right
        if isinstance(node.op, ast.Mult):
            return left * right
        if isinstance(node.op, ast.Div):
            if right == 0:
                raise InvalidFormulaError(rule_code, "division by zero")
            return left / right
        if isinstance(node.op, ast.Pow):
            # Guard against absurd exponents; payroll formulas never need this,
            # but keep Pow allowed for e.g. compound-interest-style formulas.
            if right != int(right) or abs(right) > 6:
                raise UnsafeFormulaError(rule_code, "Pow(exponent out of allowed range)")
            return left ** int(right)

    if isinstance(node, ast.UnaryOp):
        if not isinstance(node.op, _ALLOWED_UNARYOPS):
            raise UnsafeFormulaError(rule_code, f"UnaryOp({type(node.op).__name__})")
        operand = _eval_node(rule_code, node.operand, context)
        return -operand

    # Anything else — Call, Attribute, Subscript, Compare, BoolOp,
    # comprehensions, Lambda, IfExp, etc. — is explicitly rejected.
    raise UnsafeFormulaError(rule_code, type(node).__name__)