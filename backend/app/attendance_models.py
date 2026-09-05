import uuid
import enum

from sqlalchemy import (
    Column,
    Date,
    Time,
    Numeric,
    String,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    HALF_DAY = "HALF_DAY"
    ON_LEAVE = "ON_LEAVE"
    HOLIDAY = "HOLIDAY"


class Attendance(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint(
            "employee_id", "attendance_date", name="uq_attendance_employee_date"
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    employee_id = Column(
        UUID(as_uuid=True),
        ForeignKey("employees.id"),
        nullable=False,
        index=True,
    )

    attendance_date = Column(Date, nullable=False, index=True)

    check_in = Column(Time, nullable=True)
    check_out = Column(Time, nullable=True)

    status = Column(
        SAEnum(AttendanceStatus, name="attendance_status"),
        nullable=False,
        default=AttendanceStatus.PRESENT,
        server_default=AttendanceStatus.PRESENT.value,
    )

    worked_hours = Column(Numeric(5, 2), nullable=True)

    remarks = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    employee = relationship("Employee", backref="attendance_records")