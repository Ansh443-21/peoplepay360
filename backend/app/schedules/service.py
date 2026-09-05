import uuid

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from backend.app.schedules.model import Schedule
from backend.app.schedules.schema import ScheduleCreate, ScheduleUpdate


def create_schedule(db: Session, payload: ScheduleCreate) -> Schedule:
    schedule = Schedule(**payload.model_dump())

    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return schedule


def get_schedules(
    db: Session,
    page: int = 1,
    page_size: int = 20
) -> tuple[list[Schedule], int]:

    if page < 1:
        page = 1

    if page_size < 1:
        page_size = 20

    total = db.execute(
        select(func.count()).select_from(Schedule)
    ).scalar_one()

    offset = (page - 1) * page_size

    schedules = db.execute(
        select(Schedule)
        .offset(offset)
        .limit(page_size)
    ).scalars().all()

    return list(schedules), total


def get_schedule_by_id(
    db: Session,
    schedule_id: uuid.UUID
) -> Schedule:

    schedule = db.execute(
        select(Schedule).where(
            Schedule.id == schedule_id
        )
    ).scalar_one_or_none()

    if schedule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "SCHEDULE_NOT_FOUND",
                "message": f"Schedule with id '{schedule_id}' not found."
            }
        )

    return schedule


def update_schedule(
    db: Session,
    schedule_id: uuid.UUID,
    payload: ScheduleUpdate
) -> Schedule:

    schedule = get_schedule_by_id(
        db,
        schedule_id
    )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)

    return schedule


def delete_schedule(
    db: Session,
    schedule_id: uuid.UUID
) -> None:

    schedule = get_schedule_by_id(
        db,
        schedule_id
    )

    db.delete(schedule)
    db.commit()