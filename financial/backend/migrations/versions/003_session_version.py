"""003_session_version: per-user session counter (sign-out / password reset ends all of a user's sessions)

Revision ID: 003_session_version
Revises: 002_v1_features
Create Date: 2026-10-02 14:45:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_session_version'
down_revision: Union[str, None] = '002_v1_features'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('session_version', sa.Integer(), server_default='0', nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'session_version')
