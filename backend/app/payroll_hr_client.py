"""
Isolation boundary for HR contract data.

Payroll must never duplicate Employee/Contract models or logic. This
module defines a small protocol the service layer depends on, plus one
concrete implementation that calls the shared HR API endpoint:

    GET /api/v1/employees/{employee_id}/active-contract
        ?period_start=YYYY-MM-DD&period_end=YYYY-MM-DD

Uses only the standard library (urllib) so no new dependency needs to
be added to requirements.txt for this hackathon. Swap for httpx/requests
later if desired — nothing outside this file needs to change.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Protocol
from uuid import UUID


@dataclass
class ActiveContractDTO:
    id: UUID
    employee_id: UUID
    salary_structure_id: UUID
    wage: Decimal
    start_date: date
    end_date: date | None
    status: str


class HRClientError(Exception):
    """Raised when the HR service call itself fails (network/parse error),
    as distinct from a legitimate 'no active contract' result."""


class ActiveContractProvider(Protocol):
    def get_active_contract(
        self, employee_id: UUID, period_start: date, period_end: date
    ) -> ActiveContractDTO | None:
        ...


class HTTPHRClient:
    """Default ActiveContractProvider — calls the shared HR API over HTTP."""

    def __init__(self, base_url: str, timeout_seconds: float = 5.0):
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout_seconds

    def get_active_contract(
        self, employee_id: UUID, period_start: date, period_end: date
    ) -> ActiveContractDTO | None:
        url = (
            f"{self._base_url}/api/v1/employees/{employee_id}/active-contract"
            f"?period_start={period_start.isoformat()}&period_end={period_end.isoformat()}"
        )
        try:
            with urllib.request.urlopen(url, timeout=self._timeout) as response:
                raw = response.read().decode("utf-8")
                payload = json.loads(raw)
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return None
            raise HRClientError(
                f"HR API returned HTTP {exc.code} for employee {employee_id}"
            ) from exc
        except (urllib.error.URLError, json.JSONDecodeError, TimeoutError) as exc:
            raise HRClientError(
                f"HR API call failed for employee {employee_id}: {exc}"
            ) from exc

        body = payload.get("data", payload) if isinstance(payload, dict) else None
        if not body:
            return None

        try:
            return ActiveContractDTO(
                id=UUID(str(body["id"])),
                employee_id=UUID(str(body["employee_id"])),
                salary_structure_id=UUID(str(body["salary_structure_id"])),
                wage=Decimal(str(body["wage"])),
                start_date=date.fromisoformat(body["start_date"]),
                end_date=date.fromisoformat(body["end_date"]) if body.get("end_date") else None,
                status=body["status"],
            )
        except (KeyError, ValueError, TypeError) as exc:
            raise HRClientError(
                f"HR API returned malformed contract for employee {employee_id}: {exc}"
            ) from exc


def get_hr_client() -> ActiveContractProvider:
    """
    FastAPI dependency. Reads HR_API_BASE_URL from the environment
    directly (via os.getenv) rather than adding a field to Settings,
    since config.py is intentionally left untouched here. If you'd
    rather have it in Settings, that's a one-line addition — flagging
    since I was asked not to touch config.py without good reason.
    """
    base_url = os.getenv("HR_API_BASE_URL", "http://localhost:8000")
    return HTTPHRClient(base_url=base_url)