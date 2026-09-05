import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Any

from pydantic import BaseModel, Field, model_validator


class ContractStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class ContractBase(BaseModel):
    employee_id: uuid.UUID
    department_id: Optional[uuid.UUID] = None
    job_position: Optional[str] = None
    salary_structure_id: uuid.UUID
    wage: Decimal
    start_date: date
    end_date: Optional[date] = None
    status: ContractStatusEnum = ContractStatusEnum.ACTIVE

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class ContractCreate(ContractBase):
    pass


class ContractOut(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    department_id: Optional[uuid.UUID] = None
    job_position: Optional[str] = None
    salary_structure_id: uuid.UUID
    wage: Decimal
    start_date: date
    end_date: Optional[date] = None
    status: ContractStatusEnum
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ActiveContractOut(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    salary_structure_id: uuid.UUID
    wage: Decimal
    start_date: date
    end_date: Optional[date] = None
    status: ContractStatusEnum

    class Config:
        from_attributes = True


class SuccessResponse(BaseModel):
    success: bool = True
    data: Any


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail