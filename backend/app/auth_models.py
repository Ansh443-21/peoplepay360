"""
Auth-related SQLAlchemy models for PeoplePay360.

Defines User and PasswordResetToken. Uses the existing app.database.Base —
no second Base, engine, or SessionLocal is created here. No hashing, JWT,
or FastAPI dependency logic belongs in this file; those live elsewhere in
the auth foundation.
"""

import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    # Avoids a circular import at module load time; only needed for
    # static type-checking of the relationship() annotation below.
    from app.employee_models import Employee


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    HR = "HR"
    PAYROLL = "PAYROLL"
    EMPLOYEE = "EMPLOYEE"


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "(role != 'EMPLOYEE') OR (employee_id IS NOT NULL)",
            name="ck_users_employee_role_requires_employee_id",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    username: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True, index=True
    )
    email: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False
    )

    employee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True
    )

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    employee: Mapped["Employee | None"] = relationship()
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User {self.username} ({self.role.value})>"


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Only the hash is ever stored — the raw token is never persisted.
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="password_reset_tokens")

    def __repr__(self) -> str:
        return f"<PasswordResetToken user_id={self.user_id}>"