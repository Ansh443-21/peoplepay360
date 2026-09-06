import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schedules import service
from app.schedules.schema import (
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleResponse,
)
from app.auth_dependencies import get_current_user, require_roles
from app.auth_models import User, UserRole


router = APIRouter(
    prefix="/api/v1/schedules",
    tags=["schedules"],
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_schedule(
    payload: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.HR)
    ),
):
    schedule = service.create_schedule(db, payload)

    return {
        "success": True,
        "data": ScheduleResponse.model_validate(schedule),
    }


@router.get("/")
def list_schedules(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.HR,
            UserRole.PAYROLL,
        )
    ),
):
    schedules, total = service.get_schedules(
        db,
        page=page,
        page_size=page_size,
    )

    return {
        "success": True,
        "data": [
            ScheduleResponse.model_validate(schedule)
            for schedule in schedules
        ],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
        },
    }


@router.get("/{schedule_id}")
def get_schedule(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.HR,
            UserRole.PAYROLL,
        )
    ),
):
    schedule = service.get_schedule_by_id(
        db,
        schedule_id,
    )

    return {
        "success": True,
        "data": ScheduleResponse.model_validate(schedule),
    }


@router.patch("/{schedule_id}")
def update_schedule(
    schedule_id: uuid.UUID,
    payload: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.HR)
    ),
):
    schedule = service.update_schedule(
        db,
        schedule_id,
        payload,
    )

    return {
        "success": True,
        "data": ScheduleResponse.model_validate(schedule),
    }


@router.delete(
    "/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_schedule(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.HR)
    ),
):
    service.delete_schedule(
        db,
        schedule_id,
    )

    return None