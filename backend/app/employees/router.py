import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.employees import service
from app.employees.schema import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeSingleResponse,
    EmployeeListResponse,
)


router = APIRouter(
    prefix="/api/v1/employees",
    tags=["employees"],
)


# ---------------------------------------------------------
# CREATE EMPLOYEE
# ---------------------------------------------------------

@router.post("/", response_model=EmployeeSingleResponse)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
):
    employee = service.create_employee(
        db,
        payload,
    )

    return {
        "success": True,
        "data": EmployeeResponse.model_validate(employee),
    }


# ---------------------------------------------------------
# LIST EMPLOYEES
# ---------------------------------------------------------

@router.get("/", response_model=EmployeeListResponse)
def list_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    employees, total = service.get_employees(
        db,
        page=page,
        page_size=page_size,
    )

    return {
        "success": True,
        "data": [
            EmployeeResponse.model_validate(employee)
            for employee in employees
        ],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
        },
    }


# ---------------------------------------------------------
# GET EMPLOYEE BY ID
# ---------------------------------------------------------

@router.get(
    "/{employee_id}",
    response_model=EmployeeSingleResponse,
)
def get_employee(
    employee_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    employee = service.get_employee_by_id(
        db,
        employee_id,
    )

    return {
        "success": True,
        "data": EmployeeResponse.model_validate(employee),
    }


# ---------------------------------------------------------
# UPDATE EMPLOYEE
# ---------------------------------------------------------

@router.patch(
    "/{employee_id}",
    response_model=EmployeeSingleResponse,
)
def update_employee(
    employee_id: uuid.UUID,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
):
    employee = service.update_employee(
        db,
        employee_id,
        payload,
    )

    return {
        "success": True,
        "data": EmployeeResponse.model_validate(employee),
    }

