import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Any

from pydantic import BaseModel, Field, model_validator


class LeaveRequestStatusEnum(str, Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


# ---------- Leave Type ----------

class LeaveTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    default_days: Optional[Decimal] = Field(None, ge=0)
    is_paid: bool = True
    is_active: bool = True


class LeaveTypeCreate(LeaveTypeBase):
    pass


class LeaveTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    default_days: Optional[Decimal] = Field(None, ge=0)
    is_paid: Optional[bool] = None
    is_active: Optional[bool] = None
    # code is intentionally not updatable to avoid breaking references/reporting


class LeaveTypeOut(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    description: Optional[str] = None
    default_days: Optional[Decimal] = None
    is_paid: bool
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------- Time Off Request ----------

def _calc_days(start_date: date, end_date: date) -> Decimal:
    return Decimal((end_date - start_date).days + 1)


class TimeOffBase(BaseModel):
    employee_id: uuid.UUID
    leave_type_id: uuid.UUID
    start_date: date
    end_date: date
    number_of_days: Optional[Decimal] = Field(None, gt=0)
    reason: Optional[str] = None

    @model_validator(mode="after")
    def validate_and_derive(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must not be before start_date")

        derived = _calc_days(self.start_date, self.end_date)

        if self.number_of_days is None:
            self.number_of_days = derived
        else:
            if self.number_of_days <= 0:
                raise ValueError("number_of_days must be positive")
            if self.number_of_days > derived:
                raise ValueError(
                    "number_of_days cannot exceed the number of calendar days "
                    "in the requested date range"
                )

        return self


class TimeOffCreate(TimeOffBase):
    pass


class TimeOffUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    number_of_days: Optional[Decimal] = Field(None, gt=0)
    reason: Optional[str] = None

    @model_validator(mode="after")
    def validate_partial(self):
        if (
            self.start_date is not None
            and self.end_date is not None
            and self.end_date < self.start_date
        ):
            raise ValueError("end_date must not be before start_date")
        return self


class TimeOffOut(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    leave_type_id: uuid.UUID
    start_date: date
    end_date: date
    number_of_days: Decimal
    reason: Optional[str] = None
    status: LeaveRequestStatusEnum
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedLeaveTypes(BaseModel):
    items: List[LeaveTypeOut]
    total: int
    skip: int
    limit: int


class PaginatedTimeOff(BaseModel):
    items: List[TimeOffOut]
    total: int
    skip: int
    limit: int


class SuccessResponse(BaseModel):
    success: bool = True
    data: Any


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail