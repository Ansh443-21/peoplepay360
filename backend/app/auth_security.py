"""
Security primitives for PeoplePay360 authentication: password hashing,
JWT creation/validation, and password-reset token generation/hashing.

No database access, no SQLAlchemy models, no FastAPI dependencies belong
here. The JWT's `role` claim is informational only — the dependency
layer must load the User from the database and treat the DB role as
authoritative, never the token's role claim.
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError

from app.auth_models import UserRole
from app.config import get_settings

_password_hasher = PasswordHasher()


# ---------------------------------------------------------------------------
# Local exceptions
# ---------------------------------------------------------------------------

class TokenError(Exception):
    """Base exception for JWT decode/validation failures."""


class TokenExpiredError(TokenError):
    """Raised when a JWT's expiration has passed."""


class InvalidTokenError(TokenError):
    """Raised for a malformed JWT, bad signature, or any other invalid token."""


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """
    Returns True only on a genuine match. Safely returns False for a
    normal password mismatch or a malformed/unrecognized hash — never
    raises for these ordinary failure cases.
    """
    try:
        return _password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

def create_access_token(user_id: UUID, role: UserRole) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),
        "role": role.value,
        "iat": now,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decodes and validates the JWT's signature and expiration.
    Raises TokenExpiredError or InvalidTokenError for any problem —
    never returns a payload for a token that failed validation.

    Note: the returned "role" claim is informational only. Callers
    (the auth dependency layer) must load the User from the database
    and use the DB's role as the authoritative value for authorization
    decisions, not this claim.
    """
    settings = get_settings()
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError as exc:
        raise TokenExpiredError("Access token has expired") from exc
    except jwt.InvalidTokenError as exc:
        raise InvalidTokenError("Access token is invalid") from exc


# ---------------------------------------------------------------------------
# Password reset tokens
# ---------------------------------------------------------------------------

def generate_password_reset_token() -> str:
    """Cryptographically random, URL-safe token with sufficient entropy.
    The raw value returned here must never be persisted — only its hash
    (see hash_password_reset_token) should be stored."""
    return secrets.token_urlsafe(32)


def hash_password_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def password_reset_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=30)