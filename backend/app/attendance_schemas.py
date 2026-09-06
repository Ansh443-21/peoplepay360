import uuid
from datetime import date, time, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Any

from pydantic import BaseModel, Field, model_validator


class AttendanceStatusEnum(str, Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    HALF_DAY = "HALF_DAY"
    ON_LEAVE = "ON_LEAVE"
    HOLIDAY = "HOLIDAY"


def _compute_worked_hours(check_in: Optional[time], check_out: Optional[time]) -> Optional[Decimal]:
    if check_in is None or check_out is None:
        return None
    today = date.today()
    delta = datetime.combine(today, check_out) - datetime.combine(today, check_in)
    hours = Decimal(delta.total_seconds()) / Decimal(3600)
    return hours.quantize(Decimal("0.01"))


class AttendanceBase(BaseModel):
    employee_id: uuid.UUID
    attendance_date: date
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    status: AttendanceStatusEnum = AttendanceStatusEnum.PRESENT
    worked_hours: Optional[Decimal] = None
    remarks: Optional[str] = None

    @model_validator(mode="after")
    def validate_and_derive(self):
        if self.check_in is not None and self.check_out is not None:
            if self.check_out < self.check_in:
                raise ValueError("check_out must not be earlier than check_in")

            derived = _compute_worked_hours(self.check_in, self.check_out)

            if self.worked_hours is None:
                self.worked_hours = derived
            else:
                # Allow a small tolerance for rounding, otherwise reject inconsistent input.
                if abs(self.worked_hours - derived) > Decimal("0.05"):
                    raise ValueError(
                        "worked_hours does not match check_in/check_out interval"
                    )

        if self.worked_hours is not None and self.worked_hours < 0:
            raise ValueError("worked_hours cannot be negative")

        return self


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    status: Optional[AttendanceStatusEnum] = None
    worked_hours: Optional[Decimal] = None
    remarks: Optional[str] = None

    @model_validator(mode="after")
    def validate_partial(self):
        if (
            self.check_in is not None
            and self.check_out is not None
            and self.check_out < self.check_in
        ):
            raise ValueError("check_out must not be earlier than check_in")

        if self.worked_hours is not None and self.worked_hours < 0:
            raise ValueError("worked_hours cannot be negative")

        return self


class AttendanceOut(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    attendance_date: date
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    status: AttendanceStatusEnum
    worked_hours: Optional[Decimal] = None
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedAttendance(BaseModel):
    items: List[AttendanceOut]
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