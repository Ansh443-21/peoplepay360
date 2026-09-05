from fastapi import FastAPI

from backend.app.employees.router import router as employees_router

app = FastAPI(title="PeoplePay360 API")


@app.get("/")
def root():
    return {"message": "PeoplePay360 API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(employees_router)