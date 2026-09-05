"""
FastAPI authentication and authorization dependencies for PeoplePay360.

Authentication (get_current_user) validates the JWT and loads the User
from the database — the DB row is authoritative for role and
employee_id; the JWT's role claim is never trusted for authorization.

No models, no login logic, no password-reset logic, and no route files
are touched here.
"""

from uuid import UUID

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth_models import User, UserRole
from app.auth_security import InvalidTokenError, TokenExpiredError, decode_access_token
from app.database import get_db

security = HTTPBearer()

_INSUFFICIENT_PERMISSIONS = "Insufficient permissions"


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None or not credentials.credentials:
        raise unauthorized

    try:
        payload = decode_access_token(credentials.credentials)
    except (TokenExpiredError, InvalidTokenError):
        raise unauthorized

    raw_sub = payload.get("sub")
    if raw_sub is None:
        raise unauthorized

    try:
        user_id = UUID(str(raw_sub))
    except (ValueError, TypeError):
        raise unauthorized

    # The authenticated identity comes only from the validated JWT's
    # "sub" claim — never from request parameters or body.
    user = db.get(User, user_id)
    if user is None:
        raise unauthorized
    if not user.is_active:
        raise unauthorized

    return user


# ---------------------------------------------------------------------------
# Role-based authorization
# ---------------------------------------------------------------------------

def require_roles(*roles: UserRole):
    def _dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=_INSUFFICIENT_PERMISSIONS,
            )
        return current_user

    return _dependency


def require_employee_self_or_roles(*elevated_roles: UserRole):
    def _dependency(
        employee_id: UUID,
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role in elevated_roles:
            return current_user
        if current_user.role == UserRole.EMPLOYEE and current_user.employee_id == employee_id:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_INSUFFICIENT_PERMISSIONS,
        )

    return _dependency


def check_ownership_or_roles(
    current_user: User,
    record_employee_id,
    *elevated_roles: UserRole,
) -> None:
    """
    Use after fetching a record (contract, payslip, time-off request,
    etc.) whose owning employee_id is only known post-fetch.
    """
    if current_user.role in elevated_roles:
        return
    if current_user.role == UserRole.EMPLOYEE and current_user.employee_id == record_employee_id:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=_INSUFFICIENT_PERMISSIONS,
    )


# ---------------------------------------------------------------------------
# Time-off employee filter
# ---------------------------------------------------------------------------

def resolve_time_off_employee_filter(
    employee_id: UUID | None = Query(default=None),
    current_user: User = Depends(get_current_user),
) -> UUID | None:
    """
    For GET /api/v1/time-off.
    - ADMIN/HR: pass through whatever employee_id was supplied (including
      None, meaning "all employees").
    - EMPLOYEE: if employee_id is supplied and differs from their own,
      403. Otherwise auto-scope to current_user.employee_id.
    - PAYROLL and any other role: denied outright — PAYROLL is never
      silently granted access to time-off data.
    """
    if current_user.role in (UserRole.ADMIN, UserRole.HR):
        return employee_id

    if current_user.role == UserRole.EMPLOYEE:
        if employee_id is not None and employee_id != current_user.employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=_INSUFFICIENT_PERMISSIONS,
            )
        return current_user.employee_id

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=_INSUFFICIENT_PERMISSIONS,
    )