"""simplify customer phone to single phone field

Revision ID: 004
Revises: 003
Create Date: 2025-06-18

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("customers", sa.Column("phone_new", sa.String(length=25), nullable=True))

    op.execute(
        """
        UPDATE customers
        SET phone_new = country_code || '-' || phone_number
        """
    )

    op.drop_constraint("uq_customers_phone_e164", "customers", type_="unique")
    op.drop_column("customers", "phone_e164")
    op.drop_column("customers", "phone_number")
    op.drop_column("customers", "country_code")

    op.alter_column("customers", "phone_new", new_column_name="phone", nullable=False)
    op.create_unique_constraint("uq_customers_phone", "customers", ["phone"])


def downgrade() -> None:
    op.add_column("customers", sa.Column("country_code", sa.String(length=5), nullable=True))
    op.add_column("customers", sa.Column("phone_number", sa.String(length=20), nullable=True))
    op.add_column("customers", sa.Column("phone_e164", sa.String(length=20), nullable=True))

    op.execute(
        """
        UPDATE customers
        SET country_code = split_part(phone, '-', 1),
            phone_number = split_part(phone, '-', 2),
            phone_e164 = replace(phone, '-', '')
        """
    )

    op.drop_constraint("uq_customers_phone", "customers", type_="unique")
    op.drop_column("customers", "phone")

    op.alter_column("customers", "country_code", nullable=False)
    op.alter_column("customers", "phone_number", nullable=False)
    op.alter_column("customers", "phone_e164", nullable=False)
    op.create_unique_constraint("uq_customers_phone_e164", "customers", ["phone_e164"])
