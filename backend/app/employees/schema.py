import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict, Field


class EmployeeBase(BaseModel):
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
    pass


class EmployeeUpdate(BaseModel):
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
    id: uuid.UUID
    full_name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)