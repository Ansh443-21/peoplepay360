from decimal import Decimal
from pathlib import Path
import sys

# Allow running this script directly from backend/scripts/
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import select

from app.database import SessionLocal
from app.auth_models import User, UserRole
from app.auth_security import hash_password
from app.employee_models import Employee


DEMO_PASSWORD = "Demo@12345"


DEMO_USERS = [
    {
        "username": "admin",
        "email": "admin@peoplepay360.demo",
        "role": UserRole.ADMIN,
        "employee_code": None,
    },
    {
        "username": "hr",
        "email": "hr@peoplepay360.demo",
        "role": UserRole.HR,
        "employee_code": None,
    },
    {
        "username": "payroll",
        "email": "payroll@peoplepay360.demo",
        "role": UserRole.PAYROLL,
        "employee_code": None,
    },
    {
        "username": "rahul",
        "email": "rahul.patel@peoplepay360.demo",
        "role": UserRole.EMPLOYEE,
        "employee_code": "EMP001",
    },
    {
        "username": "priya",
        "email": "priya.shah@peoplepay360.demo",
        "role": UserRole.EMPLOYEE,
        "employee_code": "EMP002",
    },
    {
        "username": "amit",
        "email": "amit.mehta@peoplepay360.demo",
        "role": UserRole.EMPLOYEE,
        "employee_code": "EMP003",
    },
]


def get_employee(db, employee_code):
    if not employee_code:
        return None

    return db.scalar(
        select(Employee).where(
            Employee.employee_code == employee_code
        )
    )


def seed():
    db = SessionLocal()

    try:
        password_hash = hash_password(DEMO_PASSWORD)

        for data in DEMO_USERS:
            employee = get_employee(db, data["employee_code"])

            if data["role"] == UserRole.EMPLOYEE and employee is None:
                print(
                    f"ERROR: Employee {data['employee_code']} "
                    f"does not exist. Seed employees first."
                )
                continue

            user = db.scalar(
                select(User).where(
                    User.username == data["username"]
                )
            )

            if user is None:
                user = User(
                    username=data["username"],
                    email=data["email"],
                    password_hash=password_hash,
                    role=data["role"],
                    employee_id=employee.id if employee else None,
                    is_active=True,
                )
                db.add(user)
                print(f"CREATED: {data['username']}")
            else:
                user.email = data["email"]
                user.password_hash = password_hash
                user.role = data["role"]
                user.employee_id = employee.id if employee else None
                user.is_active = True
                print(f"UPDATED: {data['username']}")

        db.commit()

        print()
        print("========================================")
        print("PeoplePay360 demo authentication users")
        print("========================================")
        print("Password for all users:", DEMO_PASSWORD)
        print()
        print("admin   -> ADMIN")
        print("hr      -> HR")
        print("payroll -> PAYROLL")
        print("rahul   -> EMPLOYEE / EMP001")
        print("priya   -> EMPLOYEE / EMP002")
        print("amit    -> EMPLOYEE / EMP003")
        print("========================================")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()