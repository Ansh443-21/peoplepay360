import uuid

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.employees.model import Employee
from app.employees.schema import EmployeeCreate, EmployeeUpdate


# ---------------------------------------------------------
# CREATE EMPLOYEE
# ---------------------------------------------------------

def create_employee(
    db: Session,
    payload: EmployeeCreate
) -> Employee:

    # Check duplicate employee code
    existing_code = db.execute(
        select(Employee).where(
            Employee.employee_code == payload.employee_code
        )
    ).scalar_one_or_none()

    if existing_code is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_EMPLOYEE_CODE",
                "message": (
                    f"Employee code '{payload.employee_code}' "
                    "already exists."
                ),
            },
        )

    # Check duplicate email
    existing_email = db.execute(
        select(Employee).where(
            Employee.email == payload.email
        )
    ).scalar_one_or_none()

    if existing_email is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_EMAIL",
                "message": (
                    f"Email '{payload.email}' "
                    "is already registered."
                ),
            },
        )

    # Create employee
    employee = Employee(
        **payload.model_dump()
    )

    db.add(employee)

    db.commit()

    db.refresh(employee)

    return employee


# ---------------------------------------------------------
# GET ALL EMPLOYEES
# ---------------------------------------------------------

def get_employees(
    db: Session,
    page: int = 1,
    page_size: int = 20
) -> tuple[list[Employee], int]:

    if page < 1:
        page = 1

    if page_size < 1:
        page_size = 20

    # Total employees
    total = db.execute(
        select(func.count())
        .select_from(Employee)
    ).scalar_one()

    # Pagination
    offset = (page - 1) * page_size

    employees = db.execute(
        select(Employee)
        .offset(offset)
        .limit(page_size)
    ).scalars().all()

    return list(employees), total


# ---------------------------------------------------------
# GET EMPLOYEE BY ID
# ---------------------------------------------------------

def get_employee_by_id(
    db: Session,
    employee_id: uuid.UUID
) -> Employee:

    employee = db.execute(
        select(Employee).where(
            Employee.id == employee_id
        )
    ).scalar_one_or_none()

    if employee is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "EMPLOYEE_NOT_FOUND",
                "message": (
                    f"Employee with id "
                    f"'{employee_id}' not found."
                ),
            },
        )

    return employee


# ---------------------------------------------------------
# UPDATE EMPLOYEE
# ---------------------------------------------------------

def update_employee(
    db: Session,
    employee_id: uuid.UUID,
    payload: EmployeeUpdate
) -> Employee:

    employee = get_employee_by_id(
        db,
        employee_id
    )

    # Get only provided fields
    update_data = payload.model_dump(
        exclude_unset=True
    )

    # Check duplicate employee code
    if "employee_code" in update_data:

        existing_code = db.execute(
            select(Employee).where(
                Employee.employee_code
                == update_data["employee_code"],

                Employee.id
                != employee_id,
            )
        ).scalar_one_or_none()

        if existing_code is not None:

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "DUPLICATE_EMPLOYEE_CODE",
                    "message": (
                        f"Employee code "
                        f"'{update_data['employee_code']}' "
                        "already exists."
                    ),
                },
            )

    # Check duplicate email
    if "email" in update_data:

        existing_email = db.execute(
            select(Employee).where(
                Employee.email
                == update_data["email"],

                Employee.id
                != employee_id,
            )
        ).scalar_one_or_none()

        if existing_email is not None:

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "DUPLICATE_EMAIL",
                    "message": (
                        f"Email "
                        f"'{update_data['email']}' "
                        "is already registered."
                    ),
                },
            )

    # Update fields
    for field, value in update_data.items():

        setattr(
            employee,
            field,
            value
        )

    db.commit()

    db.refresh(employee)

    return employee