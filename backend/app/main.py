from app.payroll_routes import router as payroll_router

from fastapi import FastAPI

app = FastAPI(
    title="PeoplePay360 API",
    version="1.0.0"
)

app.include_router(payroll_router)

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
