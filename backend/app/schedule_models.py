import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Time,
    Numeric,
    DateTime,
    ARRAY,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class Schedule(Base):
    __tablename__ = "schedules"
    __table_args__ = (
        UniqueConstraint("name", name="uq_schedules_name"),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    name = Column(String, nullable=False)

    # 0 = Monday ... 6 = Sunday
    working_days = Column(ARRAY(Integer), nullable=False)

    daily_working_hours = Column(Numeric(4, 2), nullable=False)

    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    is_active = Column(Boolean, nullable=False, default=True, server_default="true")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )