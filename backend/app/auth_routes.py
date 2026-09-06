"""
PeoplePay360 authentication API routes.

Handles:
- Login
- Current user
- Password reset OTP request
- Password reset using OTP
"""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth_dependencies import get_current_user
from app.auth_models import PasswordResetToken, User
from app.auth_schemas import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetResponse,
    UserResponse,
)
from app.auth_security import (
    create_access_token,
    hash_password,
    hash_password_reset_token,
    verify_password,
)
from app.config import get_settings
from app.database import get_db
from app.email_service import send_otp_email

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

_GENERIC_LOGIN_ERROR = "Invalid credentials"
_GENERIC_RESET_TOKEN_ERROR = "Invalid or expired password reset OTP"
_GENERIC_RESET_REQUEST_MESSAGE = "If the account exists, a password reset OTP has been sent."


def _find_user_by_identifier(db: Session, identifier: str) -> User | None:
    return db.scalar(
        select(User).where(
            (User.username == identifier) | (User.email == identifier)
        )
    )


def _generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


# ---------------------------------------------------------------------------
# 1. Login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> LoginResponse:
    user = _find_user_by_identifier(db, payload.identifier)

    if (
        user is None
        or not user.is_active
        or not verify_password(payload.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_GENERIC_LOGIN_ERROR,
        )

    access_token = create_access_token(user.id, user.role)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


# ---------------------------------------------------------------------------
# 2. Current user
# ---------------------------------------------------------------------------

@router.get("/me", response_model=MeResponse)
def get_me(
    current_user: User = Depends(get_current_user),
) -> MeResponse:
    return MeResponse.model_validate(current_user)


# ---------------------------------------------------------------------------
# 3. Password reset request - send OTP
# ---------------------------------------------------------------------------

@router.post(
    "/password-reset/request",
    response_model=PasswordResetResponse,
)
def request_password_reset(
    payload: PasswordResetRequest,
    db: Session = Depends(get_db),
) -> PasswordResetResponse:
    settings = get_settings()
    user = _find_user_by_identifier(db, payload.identifier)

    if user is not None and user.is_active:
        otp = _generate_otp()

        otp_hash = hash_password_reset_token(otp)

        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        reset_row = PasswordResetToken(
            user_id=user.id,
            token_hash=otp_hash,
            expires_at=expires_at,
        )

        db.add(reset_row)
        db.commit()

        try:
            send_otp_email(user.email, otp)
        except Exception as exc:
            reset_row.used_at = datetime.now(timezone.utc)
            db.commit()

            print(f"RESEND ERROR: {type(exc).__name__}: {exc}")

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to send password reset email.",
            )

        return PasswordResetResponse(
            message=_GENERIC_RESET_REQUEST_MESSAGE,
            reset_token=(
                otp
                if settings.AUTH_DEV_EXPOSE_RESET_TOKEN
                else None
            ),
        )

    return PasswordResetResponse(
        message=_GENERIC_RESET_REQUEST_MESSAGE,
        reset_token=None,
    )


# ---------------------------------------------------------------------------
# 4. Password reset confirm - verify OTP and set password
# ---------------------------------------------------------------------------

@router.post("/password-reset")
def confirm_password_reset(
    payload: PasswordResetConfirm,
    db: Session = Depends(get_db),
) -> dict:
    otp_hash = hash_password_reset_token(payload.token)

    reset_row = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == otp_hash
        )
    )

    now = datetime.now(timezone.utc)

    reset_error = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=_GENERIC_RESET_TOKEN_ERROR,
    )

    if reset_row is None:
        raise reset_error

    if reset_row.used_at is not None:
        raise reset_error

    if reset_row.expires_at < now:
        raise reset_error

    user = db.get(User, reset_row.user_id)

    if user is None or not user.is_active:
        raise reset_error

    user.password_hash = hash_password(payload.new_password)
    reset_row.used_at = now

    # Invalidate any other unused OTPs for this user.
    other_active_tokens = db.scalars(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.id != reset_row.id,
            PasswordResetToken.used_at.is_(None),
        )
    ).all()

    for token_row in other_active_tokens:
        token_row.used_at = now

    db.commit()

    return {
        "success": True,
        "data": {
            "message": "Password has been reset successfully."
        },
    }