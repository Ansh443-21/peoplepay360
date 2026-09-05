import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import String, Date, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database import Base


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id"),
        nullable=False,
    )

    salary_structure_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("salary_structures.id"),
        nullable=False,
    )

    wage: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    contract_type: Mapped[str] = mapped_column(String(50), nullable=False)

    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    status: Mapped[str] = mapped_column(
        String(30), default="ACTIVE", nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )