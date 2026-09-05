"""
Input/output data structures and the running calculation context
for the payroll engine.
"""

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from uuid import UUID


@dataclass
class CalculationInput:
    structure_id: UUID
    employee_id: UUID
    contract_id: UUID
    period_start: date
    period_end: date
    worked_days: Decimal
    base_inputs: dict[str, Decimal] = field(default_factory=dict)


@dataclass
class PayslipLineResult:
    code: str
    name: str
    category: str
    sequence: int
    amount: Decimal


@dataclass
class CalculationResult:
    gross_salary: Decimal
    total_deductions: Decimal
    net_salary: Decimal
    lines: list[PayslipLineResult]


class CalculationContext:
    """
    Holds the running code -> Decimal value map while rules execute
    in sequence order. Seeded from base_inputs; each rule's computed
    value is added under its own code once resolved.
    """

    def __init__(self, base_inputs: dict[str, Decimal], worked_days: Decimal):
        self._values: dict[str, Decimal] = dict(base_inputs)
        self._values["WORKED_DAYS"] = worked_days

    def get(self, code: str) -> Decimal | None:
        return self._values.get(code)

    def has(self, code: str) -> bool:
        return code in self._values

    def set(self, code: str, value: Decimal) -> None:
        self._values[code] = value

    def as_dict(self) -> dict[str, Decimal]:
        return dict(self._values)