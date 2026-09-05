import uuid
import enum
from datetime import date, datetime

from sqlalchemy import (
    Column,
    String,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ContractStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class Contract(Base):
    __tablename__ = "contracts"

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

    # No FK yet: department table does not exist in this branch.
    department_id = Column(UUID(as_uuid=True), nullable=True)

    job_position = Column(String, nullable=True)

    salary_structure_id = Column(
        UUID(as_uuid=True),
        ForeignKey("salary_structures.id"),
        nullable=False,
    )

    wage = Column(Numeric(12, 2), nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    status = Column(
        SAEnum(ContractStatus, name="contract_status"),
        nullable=False,
        default=ContractStatus.ACTIVE,
        server_default=ContractStatus.ACTIVE.value,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    employee = relationship("Employee", backref="contracts")