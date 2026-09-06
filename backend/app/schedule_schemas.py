import uuid
from datetime import datetime, time
from decimal import Decimal
from typing import Optional, List, Any

from pydantic import BaseModel, Field, model_validator


class ScheduleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    working_days: List[int] = Field(..., min_length=1)
    daily_working_hours: Decimal = Field(..., gt=0, le=24)
    start_time: time
    end_time: time
    is_active: bool = True

    @model_validator(mode="after")
    def validate_schedule(self):
        if any(d < 0 or d > 6 for d in self.working_days):
            raise ValueError("working_days values must be between 0 (Mon) and 6 (Sun)")
        if len(set(self.working_days)) != len(self.working_days):
            raise ValueError("working_days must not contain duplicates")
        if self.start_time >= self.end_time:
            raise ValueError("start_time must be before end_time")
        return self


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    working_days: Optional[List[int]] = None
    daily_working_hours: Optional[Decimal] = Field(None, gt=0, le=24)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def validate_partial(self):
        if self.working_days is not None:
            if any(d < 0 or d > 6 for d in self.working_days):
                raise ValueError("working_days values must be between 0 (Mon) and 6 (Sun)")
            if len(set(self.working_days)) != len(self.working_days):
                raise ValueError("working_days must not contain duplicates")
        if (
            self.start_time is not None
            and self.end_time is not None
            and self.start_time >= self.end_time
        ):
            raise ValueError("start_time must be before end_time")
        return self


class ScheduleOut(BaseModel):
    id: uuid.UUID
    name: str
    working_days: List[int]
    daily_working_hours: Decimal
    start_time: time
    end_time: time
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedSchedules(BaseModel):
    items: List[ScheduleOut]
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