"""
Employee model for PeoplePay360 (person1/hr).

Uses the single canonical Base from app.database — no second Base,
engine, or session is created here. Table name is exactly "employees"
because backend/app/payroll_models.py already has:
    ForeignKey("employees.id")  (on Payslip.employee_id)
so this table must exist under that exact name for the payroll FK to
ever be satisfiable.

Only Employee is implemented here. Contract/Schedule/Attendance/TimeOff
are out of scope for this task and are not modeled or referenced.
"""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EmployeeStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ON_LEAVE = "ON_LEAVE"
    TERMINATED = "TERMINATED"


class EmployeeType(str, enum.Enum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"
    INTERN = "INTERN"


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    employee_code: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True, index=True
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)

    # Plain UUID columns, deliberately WITHOUT a ForeignKey constraint:
    # Department/Schedule tables don't exist yet. Adding a FK to a
    # nonexistent table here would reproduce the same NoReferencedTableError
    # already hit with payslips.contract_id -> contracts.id.
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    schedule_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # Self-referential FK is safe here — same table, no cross-module
    # dependency, so this one IS a real ForeignKey.
    manager_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True
    )

    job_position: Mapped[str | None] = mapped_column(String(120), nullable=True)

    employee_type: Mapped[EmployeeType] = mapped_column(
        Enum(EmployeeType, name="employee_type"),
        nullable=False,
        default=EmployeeType.FULL_TIME,
    )

    joining_date: Mapped[date] = mapped_column(Date, nullable=False)

    status: Mapped[EmployeeStatus] = mapped_column(
        Enum(EmployeeStatus, name="employee_status"),
        nullable=False,
        default=EmployeeStatus.ACTIVE,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    @property
    def full_name(self) -> str:
        """Computed, not stored — first_name + last_name."""
        return f"{self.first_name} {self.last_name}".strip()

    def __repr__(self) -> str:
        return f"<Employee {self.employee_code}>"