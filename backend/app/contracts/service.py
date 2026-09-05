import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from backend.app.contracts.model import Contract
from backend.app.contracts.schema import ContractCreate, ContractUpdate
from backend.app.employees.model import Employee


def create_contract(db: Session, payload: ContractCreate) -> Contract:
    employee = db.execute(
        select(Employee).where(Employee.id == payload.employee_id)
    ).scalar_one_or_none()
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "EMPLOYEE_NOT_FOUND",
                "message": f"Employee with id '{payload.employee_id}' not found.",
            },
        )

    contract = Contract(**payload.model_dump())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


def get_contracts(db: Session, page: int = 1, page_size: int = 20) -> tuple[list[Contract], int]:
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 20

    total = db.execute(select(func.count()).select_from(Contract)).scalar_one()

    offset = (page - 1) * page_size
    contracts = db.execute(
        select(Contract).offset(offset).limit(page_size)
    ).scalars().all()

    return list(contracts), total


def get_contract_by_id(db: Session, contract_id: uuid.UUID) -> Contract:
    contract = db.execute(
        select(Contract).where(Contract.id == contract_id)
    ).scalar_one_or_none()

    if contract is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "CONTRACT_NOT_FOUND",
                "message": f"Contract with id '{contract_id}' not found.",
            },
        )
    return contract


def update_contract(db: Session, contract_id: uuid.UUID, payload: ContractUpdate) -> Contract:
    contract = get_contract_by_id(db, contract_id)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contract, field, value)

    db.commit()
    db.refresh(contract)
    return contract


def get_active_contract(
    db: Session,
    employee_id: uuid.UUID,
    period_start: date | None = None,
    period_end: date | None = None,
) -> Contract:
    employee = db.execute(
        select(Employee).where(Employee.id == employee_id)
    ).scalar_one_or_none()
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "EMPLOYEE_NOT_FOUND",
                "message": f"Employee with id '{employee_id}' not found.",
            },
        )

    reference_start = period_start or date.today()
    reference_end = period_end or reference_start

    contract = db.execute(
        select(Contract)
        .where(
            Contract.employee_id == employee_id,
            Contract.status == "ACTIVE",
            Contract.start_date <= reference_end,
            or_(Contract.end_date.is_(None), Contract.end_date >= reference_start),
        )
        .order_by(Contract.start_date.desc())
    ).scalars().first()

    if contract is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "ACTIVE_CONTRACT_NOT_FOUND",
                "message": f"No active contract found for employee '{employee_id}' in the given period.",
            },
        )
    return contract