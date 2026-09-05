import uuid
from datetime import date, datetime

from sqlalchemy import String, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database.base import Base


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )

    employee_code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    department_id: Mapped[uuid.UUID | None] = mapped_column(
        nullable=True
    )

    manager_id: Mapped[uuid.UUID | None] = mapped_column(
        nullable=True
    )

    job_position: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    employee_type: Mapped[str] = mapped_column(
        String(50),
        default="FULL_TIME",
        nullable=False
    )

    joining_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="ACTIVE",
        nullable=False
    )

    schedule_id: Mapped[uuid.UUID | None] = mapped_column(
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()