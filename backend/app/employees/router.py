import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.employees import service
from backend.app.employees.schema import EmployeeCreate, EmployeeUpdate, EmployeeResponse

router = APIRouter(prefix="/api/v1/employees", tags=["employees"])


@router.post("/")
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    employee = service.create_employee(db, payload)
    return {
        "success": True,
        "data": EmployeeResponse.model_validate(employee),
    }


@router.get("/")
def list_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    employees, total = service.get_employees(db, page=page, page_size=page_size)
    return {
        "success": True,
        "data": [EmployeeResponse.model_validate(e) for e in employees],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
        },
    }


@router.get("/{employee_id}")
def get_employee(employee_id: uuid.UUID, db: Session = Depends(get_db)):
    employee = service.get_employee_by_id(db, employee_id)
    return {
        "success": True,
        "data": EmployeeResponse.model_validate(employee),
    }


@router.patch("/{employee_id}")
def update_employee(
    employee_id: uuid.UUID,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
):
    employee = service.update_employee(db, employee_id, payload)
    return {
        "success": True,
        "data": EmployeeResponse.model_validate(employee),
    }