from datetime import time
from typing import Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator


VALID_DAYS = {"MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"}


class ScheduleBase(BaseModel):
    name: str = Field(..., max_length=100)
    start_time: time
    end_time: time
    working_days: list[str]
    is_active: bool = True

    @field_validator("working_days")
    @classmethod
    def validate_working_days(cls, value: list[str]) -> list[str]:
        if not value:
            raise ValueError("working_days must contain at least one day.")

        days = [day.strip().upper() for day in value]

        invalid = [day for day in days if day not in VALID_DAYS]

        if invalid:
            raise ValueError(
                f"Invalid day(s): {invalid}. "
                f"Must be one of {sorted(VALID_DAYS)}."
            )

        return days


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    working_days: Optional[list[str]] = None
    is_active: Optional[bool] = None

    @field_validator("working_days")
    @classmethod
    def validate_working_days(
        cls,
        value: Optional[list[str]]
    ) -> Optional[list[str]]:

        if value is None:
            return value

        if not value:
            raise ValueError("working_days must contain at least one day.")

        days = [day.strip().upper() for day in value]

        invalid = [day for day in days if day not in VALID_DAYS]

        if invalid:
            raise ValueError(
                f"Invalid day(s): {invalid}. "
                f"Must be one of {sorted(VALID_DAYS)}."
            )

        return days


class ScheduleResponse(ScheduleBase):
    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)