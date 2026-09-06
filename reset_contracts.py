from sqlalchemy import text

from backend.app.database import engine, Base

# Import models so SQLAlchemy registers their tables
from backend.app.employees.model import Employee
from backend.app.contracts.model import Contract

with engine.begin() as conn:
    conn.execute(text("DROP TABLE IF EXISTS payslips CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS contracts CASCADE"))

# Create the contracts table
Contract.__table__.create(engine, checkfirst=True)

print("Contracts table reset successfully!")