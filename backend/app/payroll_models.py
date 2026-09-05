"""
Payroll domain models for PeoplePay360.

Owned by person2/payroll. Does NOT define Employee or Contract —
those are owned by Rishika's HR models (person1/hr) and are referenced
here only via raw ForeignKey columns (employees.id / contracts.id),
not via ORM relationship() objects, since those tables/classes do not
exist in this codebase yet.
"""

import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ComputationType(str, enum.Enum):
    FIXED = "FIXED"
    PERCENTAGE = "PERCENTAGE"
    FORMULA = "FORMULA"


class PayrunStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    COMPUTED = "COMPUTED"
    VALIDATED = "VALIDATED"
    PAID = "PAID"


# ---------------------------------------------------------------------------
# SalaryCategory
# ---------------------------------------------------------------------------

class SalaryCategory(Base):
    __tablename__ = "salary_categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    rules: Mapped[list["SalaryRule"]] = relationship(
        back_populates="category",
    )

    def __repr__(self) -> str:
        return f"<SalaryCategory {self.code}>"


# ---------------------------------------------------------------------------
# SalaryStructure
# ---------------------------------------------------------------------------

class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    rules: Mapped[list["SalaryRule"]] = relationship(
        back_populates="structure",
        cascade="all, delete-orphan",
    )
    payruns: Mapped[list["Payrun"]] = relationship(
        back_populates="salary_structure",
    )

    def __repr__(self) -> str:
        return f"<SalaryStructure {self.name}>"


# ---------------------------------------------------------------------------
# SalaryRule
# ---------------------------------------------------------------------------

class SalaryRule(Base):
    __tablename__ = "salary_rules"
    __table_args__ = (
        UniqueConstraint("structure_id", "code", name="uq_salary_rule_structure_code"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    structure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("salary_structures.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("salary_categories.id"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False, default=10)

    computation_type: Mapped[ComputationType] = mapped_column(
        Enum(ComputationType, name="computation_type"),
        nullable=False,
    )
    fixed_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    percentage: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    formula: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    structure: Mapped["SalaryStructure"] = relationship(back_populates="rules")
    category: Mapped["SalaryCategory"] = relationship(back_populates="rules")
    payslip_lines: Mapped[list["PayslipLine"]] = relationship(back_populates="rule")

    def __repr__(self) -> str:
        return f"<SalaryRule {self.code}>"


# ---------------------------------------------------------------------------
# Payrun
# ---------------------------------------------------------------------------

class Payrun(Base):
    __tablename__ = "payruns"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    salary_structure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("salary_structures.id"),
        nullable=False,
        index=True,
    )

    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)

    employee_ids: Mapped[list[str] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    
    status: Mapped[PayrunStatus] = mapped_column(
        Enum(PayrunStatus, name="payrun_status"),
        nullable=False,
        default=PayrunStatus.DRAFT,
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

    salary_structure: Mapped["SalaryStructure"] = relationship(back_populates="payruns")
    payslips: Mapped[list["Payslip"]] = relationship(
        back_populates="payrun",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Payrun {self.name}>"


# ---------------------------------------------------------------------------
# Payslip
# ---------------------------------------------------------------------------

class Payslip(Base):
    __tablename__ = "payslips"
    __table_args__ = (
        UniqueConstraint("payrun_id", "employee_id", name="uq_payslip_payrun_employee"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    payrun_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payruns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Owned by Rishika's HR models (person1/hr) — FK columns only, no
    # relationship() here since Employee/Contract are not mapped yet.
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False, index=True
    )
    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=False, index=True
    )

    salary_structure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("salary_structures.id"),
        nullable=False,
        index=True,
    )

    worked_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    gross_salary: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_deductions: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    net_salary: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    status: Mapped[PayrunStatus] = mapped_column(
        Enum(PayrunStatus, name="payrun_status"),
        nullable=False,
        default=PayrunStatus.DRAFT,
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

    payrun: Mapped["Payrun"] = relationship(back_populates="payslips")
    salary_structure: Mapped["SalaryStructure"] = relationship()
    lines: Mapped[list["PayslipLine"]] = relationship(
        back_populates="payslip",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Payslip payrun={self.payrun_id} employee={self.employee_id}>"


# ---------------------------------------------------------------------------
# PayslipLine
# ---------------------------------------------------------------------------

class PayslipLine(Base):
    __tablename__ = "payslip_lines"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    payslip_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payslips.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("salary_rules.id"),
        nullable=False,
        index=True,
    )

    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    payslip: Mapped["Payslip"] = relationship(back_populates="lines")
    rule: Mapped["SalaryRule"] = relationship(back_populates="payslip_lines")

    def __repr__(self) -> str:
        return f"<PayslipLine {self.code} amount={self.amount}>"