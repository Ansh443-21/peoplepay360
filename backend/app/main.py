from fastapi import FastAPI

from backend.app.database import Base, engine

from backend.app.employees.model import Employee
from backend.app.employees.router import router as employees_router

from backend.app.schedules.router import router as schedules_router

from backend.app.contracts.router import (
    router as contracts_router,
    active_contract_router,
)

from backend.app.payroll_routes import router as payroll_router


app = FastAPI(
    title="PeoplePay360 API",
    version="1.0.0",
)


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "success": True,
        "data": {
            "message": "PeoplePay360 API is running"
        }
    }


@app.get("/api/v1/health")
def health_check():
    return {
        "success": True,
        "data": {
            "status": "healthy"
        }
    }


app.include_router(employees_router)
app.include_router(schedules_router)
app.include_router(contracts_router)
app.include_router(active_contract_router)
app.include_router(payroll_router)