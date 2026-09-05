import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ContractBase(BaseModel):
    employee_id: uuid.UUID
    salary_structure_id: uuid.UUID
    wage: Decimal
    contract_type: str = Field(..., max_length=50)
    start_date: date
    end_date: Optional[date] = None
    status: str = Field(default="ACTIVE")


class ContractCreate(ContractBase):
    pass


class ContractUpdate(BaseModel):
    employee_id: Optional[uuid.UUID] = None
    salary_structure_id: Optional[uuid.UUID] = None
    wage: Optional[Decimal] = None
    contract_type: Optional[str] = Field(None, max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None


class ContractResponse(ContractBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)