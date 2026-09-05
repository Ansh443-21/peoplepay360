"""
Pydantic request/response schemas for the payroll API.
Field shapes follow the shared API contract exactly for documented
fields; anything not covered by the contract (e.g. compute's optional
body — see flagged conflict) is clearly marked as an addition.
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.payroll_models import PayrunStatus


# ---------------------------------------------------------------------------
# Payrun
# ---------------------------------------------------------------------------

class CreatePayrunRequest(BaseModel):
    name: str
    salary_structure_id: UUID
    period_start: date
    period_end: date
    employee_ids: list[UUID] = Field(default_factory=list)


class PayrunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    salary_structure_id: UUID
    period_start: date
    period_end: date
    status: PayrunStatus
    created_at: datetime
    updated_at: datetime


# NOT part of the documented contract (compute has no specified body).
# Optional and backward-compatible: omit it and you'll get a clear error
# telling you it's required, rather than a silent no-op. See the flagged
# model conflict in the response for why this exists.
class ComputePayrunRequest(BaseModel):
    employee_ids: list[UUID] = Field(default_factory=list)
    worked_days_overrides: dict[UUID, Decimal] | None = None


class ComputePayrunResponse(BaseModel):
    id: UUID
    status: PayrunStatus
    payslip_count: int
    warnings: list[str]


# ---------------------------------------------------------------------------
# Payslip
# ---------------------------------------------------------------------------

class PayslipLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    name: str
    category: str
    sequence: int
    amount: Decimal


# Stub objects — full employee/payrun/salary_structure detail isn't available
# yet because no Employee model exists. Flagged in the design summary.
class EmployeeStub(BaseModel):
    id: UUID


class PayrunStub(BaseModel):
    id: UUID
    name: str
    status: PayrunStatus


class SalaryStructureStub(BaseModel):
    id: UUID
    name: str


class PayslipDetailResponse(BaseModel):
    id: UUID
    employee: EmployeeStub
    payrun: PayrunStub
    salary_structure: SalaryStructureStub
    period_start: date
    period_end: date
    worked_days: Decimal
    status: PayrunStatus
    salary_breakdown: list[PayslipLineResponse]
    gross_salary: Decimal
    total_deductions: Decimal
    net_salary: Decimal
    warnings: list[str] = Field(default_factory=list)


class PayslipSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    payrun_id: UUID
    employee_id: UUID
    gross_salary: Decimal
    total_deductions: Decimal
    net_salary: Decimal
    status: PayrunStatus