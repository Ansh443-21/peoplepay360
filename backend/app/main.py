from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

from app.employees.model import Employee
from app.employees.router import router as employees_router

from app.schedules.router import router as schedules_router

from app.contracts.router import (
    router as contracts_router,
    active_contract_router,
)

from app.payroll_routes import router as payroll_router

from app.attendance_routes import router as attendance_router
from app.time_off_routes import router as time_off_router
from app.auth_routes import router as auth_router


app = FastAPI(
    title="PeoplePay360 API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://peoplepay360-frontend.vercel.app",
        "https://peoplepay360-frontend-ic5daiq2t-ansh443-21.vercel.app",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["*"],
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
app.include_router(attendance_router)
app.include_router(time_off_router)
app.include_router(auth_router)