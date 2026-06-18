"""split customer phone into country_code and phone_number

Revision ID: 002
Revises: 001
Create Date: 2025-06-18

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("customers", sa.Column("country_code", sa.String(length=5), nullable=True))
    op.add_column("customers", sa.Column("phone_number", sa.String(length=20), nullable=True))
    op.add_column("customers", sa.Column("phone_e164", sa.String(length=20), nullable=True))

    op.execute(
        """
        UPDATE customers
        SET country_code = '+1',
            phone_number = regexp_replace(phone, '[^0-9]', '', 'g'),
            phone_e164 = '+1' || regexp_replace(phone, '[^0-9]', '', 'g')
        WHERE phone IS NOT NULL
        """
    )

    op.alter_column("customers", "country_code", nullable=False)
    op.alter_column("customers", "phone_number", nullable=False)
    op.alter_column("customers", "phone_e164", nullable=False)

    op.drop_column("customers", "phone")
    op.create_unique_constraint("uq_customers_phone_e164", "customers", ["phone_e164"])


def downgrade() -> None:
    op.add_column("customers", sa.Column("phone", sa.String(length=50), nullable=True))
    op.execute(
        """
        UPDATE customers
        SET phone = country_code || '-' || phone_number
        """
    )
    op.alter_column("customers", "phone", nullable=False)
    op.drop_constraint("uq_customers_phone_e164", "customers", type_="unique")
    op.drop_column("customers", "phone_e164")
    op.drop_column("customers", "phone_number")
    op.drop_column("customers", "country_code")
