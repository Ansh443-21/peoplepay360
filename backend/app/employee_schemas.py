"""
Pydantic request/response schemas for the Employee API.
"""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.employee_models import EmployeeStatus, EmployeeType


class EmployeeCreate(BaseModel):
    employee_code: str = Field(..., max_length=50)
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    department_id: UUID | None = None
    manager_id: UUID | None = None
    job_position: str | None = Field(default=None, max_length=120)
    employee_type: EmployeeType = EmployeeType.FULL_TIME
    joining_date: date
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    schedule_id: UUID | None = None


class EmployeeUpdate(BaseModel):
    """All fields optional — PATCH applies only the fields provided."""
    employee_code: str | None = Field(default=None, max_length=50)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    department_id: UUID | None = None
    manager_id: UUID | None = None
    job_position: str | None = Field(default=None, max_length=120)
    employee_type: EmployeeType | None = None
    joining_date: date | None = None
    status: EmployeeStatus | None = None
    schedule_id: UUID | None = None


class EmployeeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    employee_code: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: str | None
    department_id: UUID | None
    manager_id: UUID | None
    job_position: str | None
    employee_type: EmployeeType
    joining_date: date
    status: EmployeeStatus
    schedule_id: UUID | None
    created_at: datetime
    updated_at: datetime


class EmployeeListResponse(BaseModel):
    items: list[EmployeeResponse]
    total: int
    page: int
    page_size: int