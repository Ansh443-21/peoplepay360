import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.time_off_models import LeaveType, TimeOffRequest, LeaveRequestStatus
from app.time_off_schemas import (
    LeaveTypeCreate,
    LeaveTypeUpdate,
    LeaveTypeOut,
    TimeOffCreate,
    TimeOffUpdate,
    TimeOffOut,
)
from app.auth_dependencies import get_current_user
from app.auth_models import User, UserRole


router = APIRouter(prefix="/api/v1", tags=["Time Off"])


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


ACTIVE_STATES = (
    LeaveRequestStatus.PENDING,
    LeaveRequestStatus.APPROVED,
)


_ALLOWED_TRANSITIONS = {
    LeaveRequestStatus.DRAFT: {
        LeaveRequestStatus.PENDING,
        LeaveRequestStatus.CANCELLED,
    },
    LeaveRequestStatus.PENDING: {
        LeaveRequestStatus.APPROVED,
        LeaveRequestStatus.REJECTED,
        LeaveRequestStatus.CANCELLED,
    },
    LeaveRequestStatus.APPROVED: {
        LeaveRequestStatus.CANCELLED,
    },
    LeaveRequestStatus.REJECTED: set(),
    LeaveRequestStatus.CANCELLED: set(),
}


def _has_overlap(
    db: Session,
    employee_id: uuid.UUID,
    start_date: date,
    end_date: date,
    exclude_id: uuid.UUID | None = None,
) -> bool:
    query = db.query(TimeOffRequest).filter(
        TimeOffRequest.employee_id == employee_id,
        TimeOffRequest.status.in_(ACTIVE_STATES),
        TimeOffRequest.start_date <= end_date,
        TimeOffRequest.end_date >= start_date,
    )

    if exclude_id is not None:
        query = query.filter(TimeOffRequest.id != exclude_id)

    return db.query(query.exists()).scalar()


def _is_admin_or_hr(user: User) -> bool:
    return user.role in {
        UserRole.ADMIN,
        UserRole.HR,
    }


def _is_employee(user: User) -> bool:
    return user.role == UserRole.EMPLOYEE


def _owns_request(user: User, record: TimeOffRequest) -> bool:
    return (
        user.role == UserRole.EMPLOYEE
        and user.employee_id is not None
        and record.employee_id == user.employee_id
    )


# ---------- Leave Types ----------


@router.get("/leave-types")
def list_leave_types(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # All authenticated users may read leave types.
    query = db.query(LeaveType)

    if is_active is not None:
        query = query.filter(LeaveType.is_active == is_active)

    total = query.count()

    items = (
        query.order_by(LeaveType.name.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = {
        "items": [LeaveTypeOut.model_validate(i) for i in items],
        "total": total,
        "skip": skip,
        "limit": limit,
    }

    return _success(result)


@router.post("/leave-types")
def create_leave_type(
    payload: LeaveTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _is_admin_or_hr(current_user):
        return _error(
            403,
            "FORBIDDEN",
            "Only ADMIN or HR can create leave types.",
        )

    leave_type = LeaveType(**payload.model_dump())
    db.add(leave_type)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return _error(
            409,
            "LEAVE_TYPE_CODE_CONFLICT",
            "A leave type with this code already exists.",
        )
    except Exception:
        db.rollback()
        return _error(
            400,
            "LEAVE_TYPE_CREATE_FAILED",
            "Could not create leave type.",
        )

    db.refresh(leave_type)

    return _success(LeaveTypeOut.model_validate(leave_type))


@router.get("/leave-types/{leave_type_id}")
def get_leave_type(
    leave_type_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    leave_type = (
        db.query(LeaveType)
        .filter(LeaveType.id == leave_type_id)
        .first()
    )

    if not leave_type:
        return _error(
            404,
            "LEAVE_TYPE_NOT_FOUND",
            "Leave type not found.",
        )

    return _success(LeaveTypeOut.model_validate(leave_type))


@router.patch("/leave-types/{leave_type_id}")
def update_leave_type(
    leave_type_id: uuid.UUID,
    payload: LeaveTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _is_admin_or_hr(current_user):
        return _error(
            403,
            "FORBIDDEN",
            "Only ADMIN or HR can update leave types.",
        )

    leave_type = (
        db.query(LeaveType)
        .filter(LeaveType.id == leave_type_id)
        .first()
    )

    if not leave_type:
        return _error(
            404,
            "LEAVE_TYPE_NOT_FOUND",
            "Leave type not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(leave_type, field, value)

    try:
        db.commit()
    except Exception:
        db.rollback()
        return _error(
            400,
            "LEAVE_TYPE_UPDATE_FAILED",
            "Could not update leave type.",
        )

    db.refresh(leave_type)

    return _success(LeaveTypeOut.model_validate(leave_type))


# ---------- Time Off Requests ----------


@router.get("/time-off")
def list_time_off(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    employee_id: uuid.UUID | None = Query(None),
    leave_type_id: uuid.UUID | None = Query(None),
    status: LeaveRequestStatus | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
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

        if (
            employee_id is not None
            and employee_id != current_user.employee_id
        ):
            return _error(
                403,
                "FORBIDDEN",
                "Employees can only access their own time-off requests.",
            )

        employee_id = current_user.employee_id

    elif current_user.role not in {
        UserRole.ADMIN,
        UserRole.HR,
    }:
        return _error(
            403,
            "FORBIDDEN",
            "You do not have access to time-off requests.",
        )

    query = db.query(TimeOffRequest)

    if employee_id is not None:
        query = query.filter(
            TimeOffRequest.employee_id == employee_id
        )

    if leave_type_id is not None:
        query = query.filter(
            TimeOffRequest.leave_type_id == leave_type_id
        )

    if status is not None:
        query = query.filter(
            TimeOffRequest.status == status
        )

    if date_from is not None:
        query = query.filter(
            TimeOffRequest.end_date >= date_from
        )

    if date_to is not None:
        query = query.filter(
            TimeOffRequest.start_date <= date_to
        )

    total = query.count()

    items = (
        query.order_by(TimeOffRequest.start_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = {
        "items": [TimeOffOut.model_validate(i) for i in items],
        "total": total,
        "skip": skip,
        "limit": limit,
    }

    return _success(result)


@router.post("/time-off")
def create_time_off(
    payload: TimeOffCreate,
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
                "Employees can only create time-off requests for themselves.",
            )

    elif current_user.role not in {
        UserRole.ADMIN,
        UserRole.HR,
    }:
        return _error(
            403,
            "FORBIDDEN",
            "You do not have permission to create time-off requests.",
        )

    leave_type = (
        db.query(LeaveType)
        .filter(LeaveType.id == payload.leave_type_id)
        .first()
    )

    if not leave_type:
        return _error(
            400,
            "INVALID_LEAVE_TYPE",
            "leave_type_id does not reference an existing leave type.",
        )

    if not leave_type.is_active:
        return _error(
            400,
            "LEAVE_TYPE_INACTIVE",
            "This leave type is not active.",
        )

    if _has_overlap(
        db,
        payload.employee_id,
        payload.start_date,
        payload.end_date,
    ):
        return _error(
            409,
            "OVERLAPPING_LEAVE_REQUEST",
            "This employee already has a pending or approved leave request overlapping these dates.",
        )

    record = TimeOffRequest(
        employee_id=payload.employee_id,
        leave_type_id=payload.leave_type_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        number_of_days=payload.number_of_days,
        reason=payload.reason,
        status=LeaveRequestStatus.DRAFT,
    )

    db.add(record)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return _error(
            400,
            "TIME_OFF_CREATE_FAILED",
            "Could not create time off request.",
        )
    except Exception:
        db.rollback()
        return _error(
            400,
            "TIME_OFF_CREATE_FAILED",
            "Could not create time off request.",
        )

    db.refresh(record)

    return _success(TimeOffOut.model_validate(record))


@router.get("/time-off/{request_id}")
def get_time_off(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(TimeOffRequest)
        .filter(TimeOffRequest.id == request_id)
        .first()
    )

    if not record:
        return _error(
            404,
            "TIME_OFF_NOT_FOUND",
            "Time off request not found.",
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
                "Employees can only access their own time-off requests.",
            )

    elif current_user.role not in {
        UserRole.ADMIN,
        UserRole.HR,
    }:
        return _error(
            403,
            "FORBIDDEN",
            "You do not have access to this time-off request.",
        )

    return _success(TimeOffOut.model_validate(record))


@router.patch("/time-off/{request_id}")
def update_time_off(
    request_id: uuid.UUID,
    payload: TimeOffUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(TimeOffRequest)
        .filter(TimeOffRequest.id == request_id)
        .first()
    )

    if not record:
        return _error(
            404,
            "TIME_OFF_NOT_FOUND",
            "Time off request not found.",
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
                "Employees can only update their own time-off requests.",
            )

    elif current_user.role not in {
        UserRole.ADMIN,
        UserRole.HR,
    }:
        return _error(
            403,
            "FORBIDDEN",
            "You do not have permission to update time-off requests.",
        )

    if record.status not in (
        LeaveRequestStatus.DRAFT,
        LeaveRequestStatus.PENDING,
    ):
        return _error(
            409,
            "TIME_OFF_NOT_EDITABLE",
            f"Cannot edit a request in status {record.status.value}.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    # Prevent an employee from changing ownership.
    if current_user.role == UserRole.EMPLOYEE:
        update_data.pop("employee_id", None)

    new_start = update_data.get(
        "start_date",
        record.start_date,
    )

    new_end = update_data.get(
        "end_date",
        record.end_date,
    )

    if new_end < new_start:
        return _error(
            400,
            "INVALID_DATE_RANGE",
            "end_date must not be before start_date.",
        )

    derived_days = (
        Decimal((new_end - new_start).days + 1)
        if ("start_date" in update_data or "end_date" in update_data)
        else None
    )

    if (
        "number_of_days" in update_data
        and update_data["number_of_days"] is not None
    ):
        if (
            derived_days is not None
            and update_data["number_of_days"] > derived_days
        ):
            return _error(
                400,
                "INVALID_NUMBER_OF_DAYS",
                "number_of_days cannot exceed the number of calendar days in the date range.",
            )

    elif derived_days is not None:
        update_data["number_of_days"] = derived_days

    if "start_date" in update_data or "end_date" in update_data:
        if _has_overlap(
            db,
            record.employee_id,
            new_start,
            new_end,
            exclude_id=record.id,
        ):
            return _error(
                409,
                "OVERLAPPING_LEAVE_REQUEST",
                "These dates overlap another pending or approved leave request for this employee.",
            )

    for field, value in update_data.items():
        setattr(record, field, value)

    try:
        db.commit()
    except Exception:
        db.rollback()
        return _error(
            400,
            "TIME_OFF_UPDATE_FAILED",
            "Could not update time off request.",
        )

    db.refresh(record)

    return _success(TimeOffOut.model_validate(record))


def _transition(
    record: TimeOffRequest,
    target: LeaveRequestStatus,
    db: Session,
):
    allowed = _ALLOWED_TRANSITIONS.get(
        record.status,
        set(),
    )

    if target not in allowed:
        return _error(
            409,
            "INVALID_STATUS_TRANSITION",
            f"Cannot move a request from {record.status.value} to {target.value}.",
        )

    if target == LeaveRequestStatus.APPROVED:
        if _has_overlap(
            db,
            record.employee_id,
            record.start_date,
            record.end_date,
            exclude_id=record.id,
        ):
            return _error(
                409,
                "OVERLAPPING_LEAVE_REQUEST",
                "Cannot approve: overlaps another pending or approved leave request for this employee.",
            )

    record.status = target

    try:
        db.commit()
    except Exception:
        db.rollback()
        return _error(
            400,
            "TIME_OFF_TRANSITION_FAILED",
            "Could not update request status.",
        )

    db.refresh(record)

    return _success(TimeOffOut.model_validate(record))


@router.post("/time-off/{request_id}/submit")
def submit_time_off(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(TimeOffRequest)
        .filter(TimeOffRequest.id == request_id)
        .first()
    )

    if not record:
        return _error(
            404,
            "TIME_OFF_NOT_FOUND",
            "Time off request not found.",
        )

    if not _owns_request(current_user, record) and not _is_admin_or_hr(current_user):
        return _error(
            403,
            "FORBIDDEN",
            "Only the employee who owns the request, ADMIN, or HR can submit it.",
        )

    return _transition(
        record,
        LeaveRequestStatus.PENDING,
        db,
    )


@router.post("/time-off/{request_id}/approve")
def approve_time_off(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _is_admin_or_hr(current_user):
        return _error(
            403,
            "FORBIDDEN",
            "Only ADMIN or HR can approve time-off requests.",
        )

    record = (
        db.query(TimeOffRequest)
        .filter(TimeOffRequest.id == request_id)
        .first()
    )

    if not record:
        return _error(
            404,
            "TIME_OFF_NOT_FOUND",
            "Time off request not found.",
        )

    return _transition(
        record,
        LeaveRequestStatus.APPROVED,
        db,
    )


@router.post("/time-off/{request_id}/reject")
def reject_time_off(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _is_admin_or_hr(current_user):
        return _error(
            403,
            "FORBIDDEN",
            "Only ADMIN or HR can reject time-off requests.",
        )

    record = (
        db.query(TimeOffRequest)
        .filter(TimeOffRequest.id == request_id)
        .first()
    )

    if not record:
        return _error(
            404,
            "TIME_OFF_NOT_FOUND",
            "Time off request not found.",
        )

    return _transition(
        record,
        LeaveRequestStatus.REJECTED,
        db,
    )


@router.post("/time-off/{request_id}/cancel")
def cancel_time_off(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(TimeOffRequest)
        .filter(TimeOffRequest.id == request_id)
        .first()
    )

    if not record:
        return _error(
            404,
            "TIME_OFF_NOT_FOUND",
            "Time off request not found.",
        )

    if not _owns_request(current_user, record) and not _is_admin_or_hr(current_user):
        return _error(
            403,
            "FORBIDDEN",
            "Only the employee who owns the request, ADMIN, or HR can cancel it.",
        )

    return _transition(
        record,
        LeaveRequestStatus.CANCELLED,
        db,
    )