import uuid

from fastapi import APIRouter, Depends, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.schedule_models import Schedule
from app.schedule_schemas import ScheduleCreate, ScheduleUpdate, ScheduleOut

router = APIRouter(prefix="/api/v1", tags=["Schedules"])


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


@router.get("/schedules")
def list_schedules(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Schedule)
    if is_active is not None:
        query = query.filter(Schedule.is_active == is_active)

    total = query.count()
    schedules = (
        query.order_by(Schedule.name.asc()).offset(skip).limit(limit).all()
    )

    result = {
        "items": [ScheduleOut.model_validate(s) for s in schedules],
        "total": total,
        "skip": skip,
        "limit": limit,
    }
    return _success(result)


@router.post("/schedules")
def create_schedule(payload: ScheduleCreate, db: Session = Depends(get_db)):
    schedule = Schedule(**payload.model_dump())
    db.add(schedule)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return _error(
            409,
            "SCHEDULE_NAME_CONFLICT",
            "A schedule with this name already exists.",
        )
    except Exception as exc:
        db.rollback()
        return _error(400, "SCHEDULE_CREATE_FAILED", str(exc))

    db.refresh(schedule)
    return _success(ScheduleOut.model_validate(schedule))


@router.get("/schedules/{schedule_id}")
def get_schedule(schedule_id: uuid.UUID, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        return _error(404, "SCHEDULE_NOT_FOUND", "Schedule not found.")
    return _success(ScheduleOut.model_validate(schedule))


@router.patch("/schedules/{schedule_id}")
def update_schedule(
    schedule_id: uuid.UUID,
    payload: ScheduleUpdate,
    db: Session = Depends(get_db),
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        return _error(404, "SCHEDULE_NOT_FOUND", "Schedule not found.")

    update_data = payload.model_dump(exclude_unset=True)

    # Cross-field validation when only one of start/end time is being updated
    new_start = update_data.get("start_time", schedule.start_time)
    new_end = update_data.get("end_time", schedule.end_time)
    if new_start >= new_end:
        return _error(
            400,
            "INVALID_TIME_RANGE",
            "start_time must be before end_time.",
        )

    for field, value in update_data.items():
        setattr(schedule, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return _error(
            409,
            "SCHEDULE_NAME_CONFLICT",
            "A schedule with this name already exists.",
        )
    except Exception as exc:
        db.rollback()
        return _error(400, "SCHEDULE_UPDATE_FAILED", str(exc))

    db.refresh(schedule)
    return _success(ScheduleOut.model_validate(schedule))


@router.delete("/schedules/{schedule_id}")
def deactivate_schedule(schedule_id: uuid.UUID, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        return _error(404, "SCHEDULE_NOT_FOUND", "Schedule not found.")

    schedule.is_active = False
    db.commit()
    db.refresh(schedule)
    return _success(ScheduleOut.model_validate(schedule))