import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.database import get_db
from app.contract_models import Contract, ContractStatus
from app.contract_schemas import ContractCreate, ContractOut, ActiveContractOut

router = APIRouter(prefix="/api/v1", tags=["Contracts"])


def _error(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {"code": code, "message": message},
        },
    )


def _success(data) -> dict:
    return {"success": True, "data": jsonable_encoder(data)}


@router.get("/employees/{employee_id}/contracts")
def list_employee_contracts(employee_id: uuid.UUID, db: Session = Depends(get_db)):
    contracts = (
        db.query(Contract)
        .filter(Contract.employee_id == employee_id)
        .order_by(Contract.start_date.desc())
        .all()
    )
    result = [ContractOut.model_validate(c) for c in contracts]
    return _success(result)


@router.post("/contracts")
def create_contract(payload: ContractCreate, db: Session = Depends(get_db)):
    contract = Contract(**payload.model_dump())
    db.add(contract)
    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        return _error(400, "CONTRACT_CREATE_FAILED", str(exc))
    db.refresh(contract)
    return _success(ContractOut.model_validate(contract))


@router.get("/contracts/{contract_id}")
def get_contract(contract_id: uuid.UUID, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        return _error(404, "CONTRACT_NOT_FOUND", "Contract not found.")
    return _success(ContractOut.model_validate(contract))


@router.get("/employees/{employee_id}/active-contract")
def get_active_contract(
    employee_id: uuid.UUID,
    period_start: date = Query(...),
    period_end: date = Query(...),
    db: Session = Depends(get_db),
):
    if period_end < period_start:
        return _error(
            400,
            "INVALID_PERIOD",
            "period_end cannot be before period_start.",
        )

    # Overlap condition: contract.start_date <= period_end
    # AND (contract.end_date IS NULL OR contract.end_date >= period_start)
    contract = (
        db.query(Contract)
        .filter(
            Contract.employee_id == employee_id,
            Contract.status == ContractStatus.ACTIVE,
            Contract.start_date <= period_end,
            or_(Contract.end_date.is_(None), Contract.end_date >= period_start),
        )
        .order_by(Contract.start_date.desc())
        .first()
    )

    if not contract:
        return _error(
            404,
            "NO_ACTIVE_CONTRACT",
            "No active contract found for the requested payroll period.",
        )

    return _success(ActiveContractOut.model_validate(contract))