import uuid

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth_dependencies import (
    check_ownership_or_roles,
    get_current_user,
    require_roles,
)
from app.auth_models import User, UserRole
from app.database import get_db
from app.employee_models import Employee
from app.employee_schemas import EmployeeCreate, EmployeeResponse, EmployeeUpdate


router = APIRouter(
    prefix="/api/v1/employees",
    tags=["Employees"],
)


def _ok(data) -> dict:
    return {"success": True, "data": data}


def _error(code: str, message: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message,
            },
        },
    )


@router.get("")
def list_employees(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in (
        UserRole.ADMIN,
        UserRole.HR,
        UserRole.PAYROLL,
    ):
        return _error(
            "FORBIDDEN",
            "You do not have permission to list employees.",
            403,
        )

    total = db.scalar(
        select(func.count()).select_from(Employee)
    ) or 0

    employees = db.scalars(
        select(Employee)
        .order_by(Employee.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    items = [
        EmployeeResponse.model_validate(e).model_dump(mode="json")
        for e in employees
    ]

    return _ok(
        {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    )


@router.post("")
def create_employee(
    payload: EmployeeCreate,
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.HR)
    ),
    db: Session = Depends(get_db),
):
    employee = Employee(**payload.model_dump())
    db.add(employee)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return _error(
            "DUPLICATE_EMPLOYEE",
            "An employee with this employee_code or email already exists.",
            409,
        )

    db.refresh(employee)

    return _ok(
        EmployeeResponse.model_validate(employee).model_dump(
            mode="json"
        )
    )


@router.get("/{employee_id}")
def get_employee(
    employee_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == UserRole.EMPLOYEE:
        if current_user.employee_id != employee_id:
            return _error(
                "FORBIDDEN",
                "You can only access your own employee profile.",
                403,
            )

    elif current_user.role not in (
        UserRole.ADMIN,
        UserRole.HR,
        UserRole.PAYROLL,
    ):
        return _error(
            "FORBIDDEN",
            "You do not have permission to access this employee.",
            403,
        )

    employee = db.get(Employee, employee_id)

    if employee is None:
        return _error(
            "EMPLOYEE_NOT_FOUND",
            f"Employee {employee_id} not found",
            404,
        )

    return _ok(
        EmployeeResponse.model_validate(employee).model_dump(
            mode="json"
        )
    )


@router.patch("/{employee_id}")
def update_employee(
    employee_id: uuid.UUID,
    payload: EmployeeUpdate,
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.HR)
    ),
    db: Session = Depends(get_db),
):
    employee = db.get(Employee, employee_id)

    if employee is None:
        return _error(
            "EMPLOYEE_NOT_FOUND",
            f"Employee {employee_id} not found",
            404,
        )

    updates = payload.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(employee, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return _error(
            "DUPLICATE_EMPLOYEE",
            "An employee with this employee_code or email already exists.",
            409,
        )

    db.refresh(employee)

    return _ok(
        EmployeeResponse.model_validate(employee).model_dump(
            mode="json"
        )
    )