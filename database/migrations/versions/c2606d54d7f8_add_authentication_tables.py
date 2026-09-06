"""add authentication tables

Revision ID: c2606d54d7f8
Revises: b9cf01dcfd2b
Create Date: 2026-09-05 23:08:08.567177

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c2606d54d7f8"
down_revision: Union[str, Sequence[str], None] = "b9cf01dcfd2b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create authentication tables."""

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            sa.Enum(
                "ADMIN",
                "HR",
                "PAYROLL",
                "EMPLOYEE",
                name="user_role",
            ),
            nullable=False,
        ),
        sa.Column("employee_id", sa.UUID(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.CheckConstraint(
            "(role != 'EMPLOYEE') OR (employee_id IS NOT NULL)",
            name="ck_users_employee_role_requires_employee_id",
        ),
        sa.ForeignKeyConstraint(
            ["employee_id"],
            ["employees.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=True,
    )

    op.create_index(
        "ix_users_username",
        "users",
        ["username"],
        unique=True,
    )

    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "used_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_password_reset_tokens_token_hash",
        "password_reset_tokens",
        ["token_hash"],
        unique=False,
    )

    op.create_index(
        "ix_password_reset_tokens_user_id",
        "password_reset_tokens",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove authentication tables."""

    op.drop_index(
        "ix_password_reset_tokens_user_id",
        table_name="password_reset_tokens",
    )

    op.drop_index(
        "ix_password_reset_tokens_token_hash",
        table_name="password_reset_tokens",
    )

    op.drop_table("password_reset_tokens")

    op.drop_index(
        "ix_users_username",
        table_name="users",
    )

    op.drop_index(
        "ix_users_email",
        table_name="users",
    )

    op.drop_table("users")

    # Explicitly remove the PostgreSQL enum created for users.role.
    sa.Enum(
        "ADMIN",
        "HR",
        "PAYROLL",
        "EMPLOYEE",
        name="user_role",
    ).drop(op.get_bind(), checkfirst=True)