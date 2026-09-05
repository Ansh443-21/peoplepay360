import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict, Field


# ---- Enums (kept as plain Literals-in-string form for hackathon speed) ----
# Adjust these lists if your team needs more values later.
EMPLOYEE_TYPES = ("FULL_TIME", "PART_TIME", "CONTRACT", "INTERN")
EMPLOYEE_STATUSES = ("ACTIVE", "INACTIVE", "TERMINATED", "ON_LEAVE")


class EmployeeBase(BaseModel):
    """Shared fields between create and response schemas."""
    employee_code: str = Field(..., max_length=50)
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    department_id: Optional[uuid.UUID] = None
    manager_id: Optional[uuid.UUID] = None
    job_position: Optional[str] = Field(None, max_length=150)
    employee_type: str = Field(default="FULL_TIME")
    joining_date: date
    status: str = Field(default="ACTIVE")
    schedule_id: Optional[uuid.UUID] = None


class EmployeeCreate(EmployeeBase):
    """Request body for POST /api/v1/employees — matches locked contract."""
    pass


class EmployeeUpdate(BaseModel):
    """Request body for PATCH /api/v1/employees/{employee_id} — all optional."""
    employee_code: Optional[str] = Field(None, max_length=50)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    department_id: Optional[uuid.UUID] = None
    manager_id: Optional[uuid.UUID] = None
    job_position: Optional[str] = Field(None, max_length=150)
    employee_type: Optional[str] = None
    joining_date: Optional[date] = None
    status: Optional[str] = None
    schedule_id: Optional[uuid.UUID] = None


class EmployeeResponse(EmployeeBase):
    """Shape of a single employee object inside the 'data' field."""
    id: uuid.UUID
    full_name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)