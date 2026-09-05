import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.contracts import service
from backend.app.contracts.schema import ContractCreate, ContractUpdate, ContractResponse

router = APIRouter(prefix="/api/v1/contracts", tags=["contracts"])

# Separate router: this endpoint lives under /api/v1/employees, not /api/v1/contracts
active_contract_router = APIRouter(prefix="/api/v1/employees", tags=["contracts"])


@router.post("/")
def create_contract(payload: ContractCreate, db: Session = Depends(get_db)):
    contract = service.create_contract(db, payload)
    return {"success": True, "data": ContractResponse.model_validate(contract)}


@router.get("/")
def list_contracts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    contracts, total = service.get_contracts(db, page=page, page_size=page_size)
    return {
        "success": True,
        "data": [ContractResponse.model_validate(c) for c in contracts],
        "pagination": {"page": page, "page_size": page_size, "total": total},
    }


@router.get("/{contract_id}")
def get_contract(contract_id: uuid.UUID, db: Session = Depends(get_db)):
    contract = service.get_contract_by_id(db, contract_id)
    return {"success": True, "data": ContractResponse.model_validate(contract)}


@router.patch("/{contract_id}")
def update_contract(
    contract_id: uuid.UUID,
    payload: ContractUpdate,
    db: Session = Depends(get_db),
):
    contract = service.update_contract(db, contract_id, payload)
    return {"success": True, "data": ContractResponse.model_validate(contract)}


@active_contract_router.get("/{employee_id}/active-contract")
def get_active_contract(
    employee_id: uuid.UUID,
    period_start: date | None = Query(None),
    period_end: date | None = Query(None),
    db: Session = Depends(get_db),
):
    contract = service.get_active_contract(db, employee_id, period_start, period_end)
    return {"success": True, "data": ContractResponse.model_validate(contract)}