from backend.app.database import SessionLocal
from backend.app.payroll_models import SalaryStructure

db = SessionLocal()

try:
    salary_structure = SalaryStructure(
        name="Standard Salary Structure",
        description="Default salary structure for testing",
        is_active=True
    )

    db.add(salary_structure)
    db.commit()
    db.refresh(salary_structure)

    print("Salary Structure created successfully!")
    print("ID:", salary_structure.id)

finally:
    db.close()