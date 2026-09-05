"""
Pydantic request/response schemas for the PeoplePay360 authentication system.

Schemas only — no database access, password hashing, JWT logic, or
FastAPI dependencies belong in this file.
"""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.auth_models import UserRole


class LoginRequest(BaseModel):
    identifier: str  # accepts either username or email
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    email: str
    role: UserRole
    employee_id: UUID | None
    is_active: bool


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class MeResponse(UserResponse):
    """Identical identity fields to UserResponse; kept as a distinct
    schema so /auth/me's response shape can evolve independently of
    the login response's embedded user object."""


class PasswordResetRequest(BaseModel):
    identifier: str  # accepts either username or email


class PasswordResetResponse(BaseModel):
    message: str
    reset_token: str | None = None  # populated only in dev-safe mode; never a real token by default


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8)