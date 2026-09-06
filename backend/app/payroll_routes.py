"""
FastAPI routes for the Payrun/Payslip workflow.
"""

from uuid import UUID

from fastapi import APIRouter, Body, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth_dependencies import get_current_user
from app.auth_models import User, UserRole

from app.payroll_hr_client import ActiveContractProvider, get_hr_client, HRClientError
from app.payroll_models import SalaryStructure
from app.payroll_schemas import (
    ComputePayrunRequest,
    ComputePayrunResponse,
    CreatePayrunRequest,
    EmployeeStub,
    PayrunResponse,
    PayrunStub,
    PayslipDetailResponse,
    PayslipLineResponse,
    PayslipSummaryResponse,
    SalaryStructureStub,
)
from app.payroll_service import (
    EmptyEmployeeListError,
    InvalidPayrunStateError,
    InvalidPeriodError,
    PayrollServiceError,
    PayrunNotFoundError,
    PayslipNotFoundError,
    SalaryStructureInactiveError,
    SalaryStructureNotFoundError,
    compute_payrun,
    create_payrun,
    get_payrun,
    get_payslip,
    get_payslip_lines,
    list_payruns,
    list_payslips_for_payrun,
    mark_payrun_paid,
    validate_payrun,
)

router = APIRouter(
    prefix="/api/v1/payroll",
    tags=["payroll"],
)


_STATUS_MAP: dict[type[Exception], int] = {
    PayrunNotFoundError: 404,
    PayslipNotFoundError: 404,
    SalaryStructureNotFoundError: 404,
    SalaryStructureInactiveError: 409,
    InvalidPeriodError: 422,
    InvalidPayrunStateError: 409,
    EmptyEmployeeListError: 422,
    HRClientError: 502,
}


def _ok(data) -> dict:
    return {"success": True, "data": data}


def _error(exc: Exception) -> JSONResponse:
    status_code = _STATUS_MAP.get(type(exc), 500)

    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": type(exc).__name__,
                "message": str(exc),
            },
        },
    )


def _payroll_user(user: User) -> bool:
    return user.role in {
        UserRole.ADMIN,
        UserRole.PAYROLL,
    }


def _can_view_payslip(user: User, employee_id: UUID) -> bool:
    if user.role in {
        UserRole.ADMIN,
        UserRole.PAYROLL,
    }:
        return True

    return (
        user.role == UserRole.EMPLOYEE
        and user.employee_id is not None
        and user.employee_id == employee_id
    )


@router.get("/payruns")
def api_list_payruns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _payroll_user(current_user):
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only ADMIN or PAYROLL can access payruns.",
                },
            },
        )

    payruns = list_payruns(db)

    return _ok(
        [
            PayrunResponse.model_validate(p).model_dump(mode="json")
            for p in payruns
        ]
    )


@router.post("/payruns")
def api_create_payrun(
    payload: CreatePayrunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _payroll_user(current_user):
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only ADMIN or PAYROLL can create payruns.",
                },
            },
        )

    try:
        payrun = create_payrun(db, payload)
    except PayrollServiceError as exc:
        return _error(exc)

    return _ok(
        PayrunResponse.model_validate(payrun).model_dump(mode="json")
    )


@router.post("/payruns/{payrun_id}/compute")
def api_compute_payrun(
    payrun_id: UUID,
    payload: ComputePayrunRequest | None = Body(default=None),
    db: Session = Depends(get_db),
    hr_client: ActiveContractProvider = Depends(get_hr_client),
    current_user: User = Depends(get_current_user),
):
    if not _payroll_user(current_user):
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only ADMIN or PAYROLL can compute payruns.",
                },
            },
        )

    employee_ids = payload.employee_ids if payload else None
    worked_days_overrides = (
        payload.worked_days_overrides if payload else None
    )

    try:
        payrun, payslip_count, warnings = compute_payrun(
            db=db,
            payrun_id=payrun_id,
            hr_client=hr_client,
            employee_ids=employee_ids,
            worked_days_overrides=worked_days_overrides,
        )
    except PayrollServiceError as exc:
        return _error(exc)

    return _ok(
        ComputePayrunResponse(
            id=payrun.id,
            status=payrun.status,
            payslip_count=payslip_count,
            warnings=warnings,
        ).model_dump(mode="json")
    )


@router.post("/payruns/{payrun_id}/validate")
def api_validate_payrun(
    payrun_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _payroll_user(current_user):
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only ADMIN or PAYROLL can validate payruns.",
                },
            },
        )

    try:
        payrun = validate_payrun(db, payrun_id)
    except PayrollServiceError as exc:
        return _error(exc)

    return _ok(
        PayrunResponse.model_validate(payrun).model_dump(mode="json")
    )


@router.post("/payruns/{payrun_id}/mark-paid")
def api_mark_payrun_paid(
    payrun_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _payroll_user(current_user):
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only ADMIN or PAYROLL can mark payruns as paid.",
                },
            },
        )

    try:
        payrun = mark_payrun_paid(db, payrun_id)
    except PayrollServiceError as exc:
        return _error(exc)

    return _ok(
        PayrunResponse.model_validate(payrun).model_dump(mode="json")
    )


@router.get("/payslips/{payslip_id}")
def api_get_payslip(
    payslip_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        payslip = get_payslip(db, payslip_id)

        if not _can_view_payslip(
            current_user,
            payslip.employee_id,
        ):
            return JSONResponse(
                status_code=403,
                content={
                    "success": False,
                    "error": {
                        "code": "FORBIDDEN",
                        "message": "You can only access your own payslips.",
                    },
                },
            )

        lines = get_payslip_lines(db, payslip_id)
        payrun = payslip.payrun
        structure = db.get(
            SalaryStructure,
            payslip.salary_structure_id,
        )

    except PayrollServiceError as exc:
        return _error(exc)

    detail = PayslipDetailResponse(
        id=payslip.id,
        employee=EmployeeStub(id=payslip.employee_id),
        payrun=PayrunStub(
            id=payrun.id,
            name=payrun.name,
            status=payrun.status,
        ),
        salary_structure=SalaryStructureStub(
            id=structure.id,
            name=structure.name,
        ),
        period_start=payrun.period_start,
        period_end=payrun.period_end,
        worked_days=payslip.worked_days,
        status=payslip.status,
        salary_breakdown=[
            PayslipLineResponse.model_validate(l)
            for l in lines
        ],
        gross_salary=payslip.gross_salary,
        total_deductions=payslip.total_deductions,
        net_salary=payslip.net_salary,
        warnings=[],
    )

    return _ok(detail.model_dump(mode="json"))


@router.get("/payslips")
def api_list_payslips(
    payrun_id: UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _payroll_user(current_user):
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only ADMIN or PAYROLL can list payslips.",
                },
            },
        )

    payslips = list_payslips_for_payrun(
        db,
        payrun_id,
    )

    return _ok(
        [
            PayslipSummaryResponse.model_validate(p).model_dump(mode="json")
            for p in payslips
        ]
    )