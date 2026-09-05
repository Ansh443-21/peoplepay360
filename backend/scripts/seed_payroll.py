"""
Development-only seed script for PeoplePay360 payroll master data.

Creates/reuses:
- SalaryCategory: EARNING, DEDUCTION, PF
- SalaryStructure: "Standard" (active)
- SalaryRule set on "Standard":
  - HRA: 20% of BASIC
  - TRANSPORT: fixed 2000
  - PF: 12% of BASIC

Design notes:
- BASIC is intentionally NOT created as a SalaryRule. It is supplied at
  calculation time via CalculationInput.base_inputs from the contract wage.
- Gross salary is calculated by the payroll engine from BASIC plus earning
  rule lines.
- The obsolete GROSS rule from the previous seed version is removed when
  this script is rerun.
- Idempotent: existing categories, structure, and rules are reused/updated.
- Uses Decimal for monetary/percentage values.
- Does not modify models, migrations, database.py, config.py, or routes.
- Does not compute or hardcode payslip/payrun output.
"""

from decimal import Decimal

from app.database import SessionLocal
from app.payroll_models import (
    SalaryCategory,
    SalaryStructure,
    SalaryRule,
    ComputationType,
)


def get_or_create_category(
    db,
    *,
    name: str,
    code: str,
    description: str | None = None,
):
    category = (
        db.query(SalaryCategory)
        .filter(SalaryCategory.code == code)
        .first()
    )

    if category:
        changed = False

        if category.name != name:
            category.name = name
            changed = True

        if category.description != description:
            category.description = description
            changed = True

        return category, ("updated" if changed else "reused")

    category = SalaryCategory(
        name=name,
        code=code,
        description=description,
    )
    db.add(category)
    db.flush()

    return category, "created"


def get_or_create_structure(
    db,
    *,
    name: str,
    description: str | None = None,
    is_active: bool = True,
):
    structure = (
        db.query(SalaryStructure)
        .filter(SalaryStructure.name == name)
        .first()
    )

    if structure:
        changed = False

        if structure.description != description:
            structure.description = description
            changed = True

        if structure.is_active != is_active:
            structure.is_active = is_active
            changed = True

        return structure, ("updated" if changed else "reused")

    structure = SalaryStructure(
        name=name,
        description=description,
        is_active=is_active,
    )
    db.add(structure)
    db.flush()

    return structure, "created"


def get_or_create_rule(
    db,
    *,
    structure_id,
    category_id,
    name: str,
    code: str,
    sequence: int,
    computation_type,
    fixed_amount: Decimal | None = None,
    percentage: Decimal | None = None,
    formula: str | None = None,
    is_active: bool = True,
):
    rule = (
        db.query(SalaryRule)
        .filter(
            SalaryRule.structure_id == structure_id,
            SalaryRule.code == code,
        )
        .first()
    )

    if rule:
        changed = False

        for field, value in (
            ("name", name),
            ("category_id", category_id),
            ("sequence", sequence),
            ("computation_type", computation_type),
            ("fixed_amount", fixed_amount),
            ("percentage", percentage),
            ("formula", formula),
            ("is_active", is_active),
        ):
            if getattr(rule, field) != value:
                setattr(rule, field, value)
                changed = True

        return rule, ("updated" if changed else "reused")

    rule = SalaryRule(
        structure_id=structure_id,
        category_id=category_id,
        name=name,
        code=code,
        sequence=sequence,
        computation_type=computation_type,
        fixed_amount=fixed_amount,
        percentage=percentage,
        formula=formula,
        is_active=is_active,
    )
    db.add(rule)
    db.flush()

    return rule, "created"


def remove_obsolete_gross_rule(db, structure_id):
    """
    Remove the obsolete GROSS rule created by the previous seed version.

    GROSS was a formula containing BASIC + HRA + TRANSPORT but was classified
    as an earning, causing it to be counted again during gross aggregation.

    No commit is performed here. The main seed transaction commits once at
    the end.
    """
    db.query(SalaryRule).filter(
        SalaryRule.structure_id == structure_id,
        SalaryRule.code == "GROSS",
    ).delete(synchronize_session=False)


def seed():
    db = SessionLocal()
    summary = []

    try:
        # --- Categories ---------------------------------------------------

        earning_cat, s1 = get_or_create_category(
            db,
            name="Earnings",
            code="EARNING",
            description="Earning components",
        )

        deduction_cat, s2 = get_or_create_category(
            db,
            name="Deduction",
            code="DEDUCTION",
            description="General deduction components",
        )

        pf_cat, s3 = get_or_create_category(
            db,
            name="Provident Fund",
            code="PF",
            description="Provident fund deduction",
        )

        summary += [
            f"SalaryCategory EARNING: {s1}",
            f"SalaryCategory DEDUCTION: {s2}",
            f"SalaryCategory PF: {s3}",
        ]

        # --- Structure ---------------------------------------------------

        structure, s4 = get_or_create_structure(
            db,
            name="Standard",
            description="Standard development salary structure",
            is_active=True,
        )

        summary.append(f"SalaryStructure 'Standard': {s4}")

        # Remove GROSS created by the previous seed version.
        remove_obsolete_gross_rule(db, structure.id)
        summary.append("Obsolete SalaryRule GROSS: removed if present")

        # --- Rules ------------------------------------------------------

        # BASIC is supplied through CalculationInput.base_inputs.
        # It is intentionally not a SalaryRule.

        # PERCENTAGE earning: HRA = 20% of BASIC
        _, s5 = get_or_create_rule(
            db,
            structure_id=structure.id,
            category_id=earning_cat.id,
            name="House Rent Allowance",
            code="HRA",
            sequence=10,
            computation_type=ComputationType.PERCENTAGE,
            percentage=Decimal("20.00"),
            formula="BASIC",
        )

        summary.append(
            f"SalaryRule HRA (PERCENTAGE, 20% of BASIC): {s5}"
        )

        # FIXED earning: flat transport allowance
        _, s6 = get_or_create_rule(
            db,
            structure_id=structure.id,
            category_id=earning_cat.id,
            name="Transport Allowance",
            code="TRANSPORT",
            sequence=20,
            computation_type=ComputationType.FIXED,
            fixed_amount=Decimal("2000.00"),
        )

        summary.append(
            f"SalaryRule TRANSPORT (FIXED, 2000.00): {s6}"
        )

        # PERCENTAGE deduction: PF = 12% of BASIC
        _, s7 = get_or_create_rule(
            db,
            structure_id=structure.id,
            category_id=pf_cat.id,
            name="Provident Fund",
            code="PF",
            sequence=30,
            computation_type=ComputationType.PERCENTAGE,
            percentage=Decimal("12.00"),
            formula="BASIC",
        )

        summary.append(
            f"SalaryRule PF (PERCENTAGE, 12% of BASIC): {s7}"
        )

        db.commit()

        print("Payroll seed complete.")

        for line in summary:
            print(f"  - {line}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()