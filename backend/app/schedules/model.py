import uuid

from sqlalchemy import Column, String, Boolean, Time
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from app.database import Base


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False
    )

    name = Column(
        String(100),
        nullable=False
    )

    start_time = Column(
        Time,
        nullable=False
    )

    end_time = Column(
        Time,
        nullable=False
    )

    working_days = Column(
        ARRAY(String),
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )