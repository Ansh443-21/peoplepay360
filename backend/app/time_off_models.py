import uuid
import enum

from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    Date,
    Numeric,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class LeaveRequestStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class LeaveType(Base):
    __tablename__ = "leave_types"
    __table_args__ = (
        UniqueConstraint("code", name="uq_leave_types_code"),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    default_days = Column(Numeric(5, 2), nullable=True)

    is_paid = Column(Boolean, nullable=False, default=True, server_default="true")
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class TimeOffRequest(Base):
    __tablename__ = "time_off_requests"

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

    leave_type_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leave_types.id"),
        nullable=False,
        index=True,
    )

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    number_of_days = Column(Numeric(5, 2), nullable=False)

    reason = Column(Text, nullable=True)

    status = Column(
        SAEnum(LeaveRequestStatus, name="leave_request_status"),
        nullable=False,
        default=LeaveRequestStatus.DRAFT,
        server_default=LeaveRequestStatus.DRAFT.value,
        index=True,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    employee = relationship("Employee", backref="time_off_requests")
    leave_type = relationship("LeaveType", backref="requests")