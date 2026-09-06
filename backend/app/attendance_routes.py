import uuid
from datetime import date, datetime, time
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.attendance_models import Attendance, AttendanceStatus
from app.attendance_schemas import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceOut,
)
from app.auth_dependencies import (
    get_current_user,
    require_roles,
    check_ownership_or_roles,
)
from app.auth_models import User, UserRole


router = APIRouter(prefix="/api/v1", tags=["Attendance"])


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


def _compute_worked_hours(check_in: time, check_out: time) -> Decimal:
    today = date.today()
    delta = datetime.combine(today, check_out) - datetime.combine(today, check_in)
    hours = Decimal(delta.total_seconds()) / Decimal(3600)
    return hours.quantize(Decimal("0.01"))


@router.get("/attendance")
def list_attendance(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    employee_id: uuid.UUID | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    status: AttendanceStatus | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if date_from is not None and date_to is not None and date_to < date_from:
        return _error(
            400,
            "INVALID_DATE_RANGE",
            "date_to cannot be before date_from.",
        )

    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id:
            return _error(
                403,
                "EMPLOYEE_NOT_LINKED",
                "Employee account is not linked to an employee record.",
            )

        if employee_id is not None and employee_id != current_user.employee_id:
            return _error(
                403,
                "FORBIDDEN",
                "Employees can only access their own attendance.",
            )

        employee_id = current_user.employee_id

    elif current_user.role not in {
        UserRole.ADMIN,
        UserRole.HR,
        UserRole.PAYROLL,
    }:
        return _error(403, "FORBIDDEN", "You do not have access to attendance.")

    query = db.query(Attendance)

    if employee_id is not None:
        query = query.filter(Attendance.employee_id == employee_id)
    if date_from is not None:
        query = query.filter(Attendance.attendance_date >= date_from)
    if date_to is not None:
        query = query.filter(Attendance.attendance_date <= date_to)
    if status is not None:
        query = query.filter(Attendance.status == status)

    total = query.count()
    records = (
        query.order_by(Attendance.attendance_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = {
        "items": [AttendanceOut.model_validate(r) for r in records],
        "total": total,
        "skip": skip,
        "limit": limit,
    }

    return _success(result)


@router.post("/attendance")
def create_attendance(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id:
            return _error(
                403,
                "EMPLOYEE_NOT_LINKED",
                "Employee account is not linked to an employee record.",
            )

        if payload.employee_id != current_user.employee_id:
            return _error(
                403,
                "FORBIDDEN",
                "Employees can only create attendance for themselves.",
            )

    elif current_user.role not in {
        UserRole.ADMIN,
        UserRole.HR,
    }:
        return _error(
            403,
            "FORBIDDEN",
            "You do not have permission to create attendance.",
        )

    record = Attendance(**payload.model_dump())
    db.add(record)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return _error(
            409,
            "ATTENDANCE_ALREADY_EXISTS",
            "An attendance record already exists for this employee on this date.",
        )
    except Exception:
        db.rollback()
        return _error(
            400,
            "ATTENDANCE_CREATE_FAILED",
            "Could not create attendance record.",
        )

    db.refresh(record)
    return _success(AttendanceOut.model_validate(record))


@router.get("/attendance/{attendance_id}")
def get_attendance(
    attendance_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(Attendance)
        .filter(Attendance.id == attendance_id)
        .first()
    )

    if not record:
        return _error(
            404,
            "ATTENDANCE_NOT_FOUND",
            "Attendance record not found.",
        )

    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id:
            return _error(
                403,
                "EMPLOYEE_NOT_LINKED",
                "Employee account is not linked to an employee record.",
            )

        if record.employee_id != current_user.employee_id:
            return _error(
                403,
                "FORBIDDEN",
                "Employees can only access their own attendance.",
            )

    elif current_user.role not in {
        UserRole.ADMIN,
        UserRole.HR,
        UserRole.PAYROLL,
    }:
        return _error(403, "FORBIDDEN", "You do not have access to attendance.")

    return _success(AttendanceOut.model_validate(record))


@router.patch("/attendance/{attendance_id}")
def update_attendance(
    attendance_id: uuid.UUID,
    payload: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(Attendance)
        .filter(Attendance.id == attendance_id)
        .first()
    )

    if not record:
        return _error(
            404,
            "ATTENDANCE_NOT_FOUND",
            "Attendance record not found.",
        )

    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id:
            return _error(
                403,
                "EMPLOYEE_NOT_LINKED",
                "Employee account is not linked to an employee record.",
            )

        if record.employee_id != current_user.employee_id:
            return _error(
                403,
                "FORBIDDEN",
                "Employees can only update their own attendance.",
            )

    elif current_user.role not in {
        UserRole.ADMIN,
        UserRole.HR,
    }:
        return _error(
            403,
            "FORBIDDEN",
            "You do not have permission to update attendance.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    new_check_in = update_data.get("check_in", record.check_in)
    new_check_out = update_data.get("check_out", record.check_out)

    if new_check_in is not None and new_check_out is not None:
        if new_check_out < new_check_in:
            return _error(
                400,
                "INVALID_TIME_RANGE",
                "check_out must not be earlier than check_in.",
            )

        derived = _compute_worked_hours(
            new_check_in,
            new_check_out,
        )

        if (
            "worked_hours" in update_data
            and update_data["worked_hours"] is not None
        ):
            if abs(update_data["worked_hours"] - derived) > Decimal("0.05"):
                return _error(
                    400,
                    "INCONSISTENT_WORKED_HOURS",
                    "worked_hours does not match check_in/check_out interval.",
                )
        else:
            update_data["worked_hours"] = derived

    # Employees must never be able to change ownership.
    if current_user.role == UserRole.EMPLOYEE:
        update_data.pop("employee_id", None)

    for field, value in update_data.items():
        setattr(record, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return _error(
            409,
            "ATTENDANCE_ALREADY_EXISTS",
            "An attendance record already exists for this employee on this date.",
        )
    except Exception:
        db.rollback()
        return _error(
            400,
            "ATTENDANCE_UPDATE_FAILED",
            "Could not update attendance record.",
        )

    db.refresh(record)
    return _success(AttendanceOut.model_validate(record))


@router.get("/employees/{employee_id}/attendance")
def list_employee_attendance(
    employee_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    status: AttendanceStatus | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if date_from is not None and date_to is not None and date_to < date_from:
        return _error(
            400,
            "INVALID_DATE_RANGE",
            "date_to cannot be before date_from.",
        )

    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id:
            return _error(
                403,
                "EMPLOYEE_NOT_LINKED",
                "Employee account is not linked to an employee record.",
            )

        if employee_id != current_user.employee_id:
            return _error(
                403,
                "FORBIDDEN",
                "Employees can only access their own attendance.",
            )

    elif current_user.role not in {
        UserRole.ADMIN,
        UserRole.HR,
        UserRole.PAYROLL,
    }:
        return _error(403, "FORBIDDEN", "You do not have access to attendance.")

    query = db.query(Attendance).filter(
        Attendance.employee_id == employee_id
    )

    if date_from is not None:
        query = query.filter(Attendance.attendance_date >= date_from)
    if date_to is not None:
        query = query.filter(Attendance.attendance_date <= date_to)
    if status is not None:
        query = query.filter(Attendance.status == status)

    total = query.count()

    records = (
        query.order_by(Attendance.attendance_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = {
        "items": [AttendanceOut.model_validate(r) for r in records],
        "total": total,
        "skip": skip,
        "limit": limit,
    }

    return _success(result)