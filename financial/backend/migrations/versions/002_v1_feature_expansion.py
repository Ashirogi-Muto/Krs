"""002_v1_feature_expansion

Revision ID: 002_v1_features
Revises: 001_initial
Create Date: 2026-09-20 22:15:00.000000

"""
from typing import Sequence, Union
import uuid
from datetime import datetime, timezone
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

revision: str = '002_v1_features'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('code', sa.String(length=30), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='PLANNED', nullable=False),
        sa.Column('budget_amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('created_by', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index('ix_projects_code', 'projects', ['code'], unique=True)
    op.create_index('ix_projects_status', 'projects', ['status'], unique=False)

    # 2. Add project_id to income (batch mode for SQLite compatibility)
    with op.batch_alter_table('income') as batch_op:
        batch_op.add_column(sa.Column('project_id', sa.String(length=36), nullable=True))
        batch_op.create_foreign_key('fk_income_project_id', 'projects', ['project_id'], ['id'])
        batch_op.create_index('ix_income_project_id', ['project_id'], unique=False)

    # 3. Add project_id to expenses (batch mode for SQLite compatibility)
    with op.batch_alter_table('expenses') as batch_op:
        batch_op.add_column(sa.Column('project_id', sa.String(length=36), nullable=True))
        batch_op.create_foreign_key('fk_expenses_project_id', 'projects', ['project_id'], ['id'])
        batch_op.create_index('ix_expenses_project_id', ['project_id'], unique=False)

    # 4. expense_payments table
    op.create_table(
        'expense_payments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('expense_id', sa.String(length=36), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=False),
        sa.Column('payment_method_id', sa.String(length=36), nullable=True),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['payment_method_id'], ['payment_methods.id']),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_expense_payments_expense_id', 'expense_payments', ['expense_id'], unique=False)
    op.create_index('ix_expense_payments_payment_date', 'expense_payments', ['payment_date'], unique=False)

    # 5. budgets table
    op.create_table(
        'budgets',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=True),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('total_budget', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='ACTIVE', nullable=False),
        sa.Column('created_by', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id']),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_budgets_project_id', 'budgets', ['project_id'], unique=False)
    op.create_index('ix_budgets_status', 'budgets', ['status'], unique=False)

    # 6. budget_items table
    op.create_table(
        'budget_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('budget_id', sa.String(length=36), nullable=False),
        sa.Column('category_id', sa.String(length=36), nullable=False),
        sa.Column('allocated_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['budget_id'], ['budgets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_budget_items_budget_id', 'budget_items', ['budget_id'], unique=False)
    op.create_index('ix_budget_items_category_id', 'budget_items', ['category_id'], unique=False)

    # 7. Add document_type to documents table
    with op.batch_alter_table('documents') as batch_op:
        batch_op.add_column(sa.Column('document_type', sa.String(length=30), server_default='OTHER', nullable=False))
        batch_op.create_index('ix_documents_document_type', ['document_type'], unique=False)

    # 8. notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('type', sa.String(length=30), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('entity_type', sa.String(length=30), nullable=True),
        sa.Column('entity_id', sa.String(length=100), nullable=True),
        sa.Column('is_read', sa.Boolean(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'], unique=False)
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'], unique=False)

    # 9. Data Migration: Create initial expense_payments for expenses where amount_paid > 0
    bind = op.get_bind()
    expenses_tbl = table(
        'expenses',
        column('id', sa.String),
        column('amount_paid', sa.Numeric),
        column('payment_date', sa.Date),
        column('payment_method_id', sa.String),
        column('reference_number', sa.String),
        column('notes', sa.Text),
        column('created_by', sa.String),
        column('created_at', sa.DateTime)
    )
    payments_tbl = table(
        'expense_payments',
        column('id', sa.String),
        column('expense_id', sa.String),
        column('amount', sa.Numeric),
        column('payment_date', sa.Date),
        column('payment_method_id', sa.String),
        column('reference_number', sa.String),
        column('notes', sa.Text),
        column('created_by', sa.String),
        column('created_at', sa.DateTime),
        column('updated_at', sa.DateTime)
    )

    results = bind.execute(sa.select(
        expenses_tbl.c.id,
        expenses_tbl.c.amount_paid,
        expenses_tbl.c.payment_date,
        expenses_tbl.c.payment_method_id,
        expenses_tbl.c.reference_number,
        expenses_tbl.c.notes,
        expenses_tbl.c.created_by,
        expenses_tbl.c.created_at
    ).where(expenses_tbl.c.amount_paid > 0)).fetchall()

    for row in results:
        bind.execute(payments_tbl.insert().values(
            id=str(uuid.uuid4()),
            expense_id=row.id,
            amount=row.amount_paid,
            payment_date=row.payment_date or datetime.now(timezone.utc).date(),
            payment_method_id=row.payment_method_id,
            reference_number=row.reference_number,
            notes=row.notes or "Initial clearance payment",
            created_by=row.created_by,
            created_at=row.created_at or datetime.now(timezone.utc),
            updated_at=row.created_at or datetime.now(timezone.utc)
        ))

def downgrade() -> None:
    op.drop_table('notifications')
    with op.batch_alter_table('documents') as batch_op:
        batch_op.drop_index('ix_documents_document_type')
        batch_op.drop_column('document_type')
    op.drop_table('budget_items')
    op.drop_table('budgets')
    op.drop_table('expense_payments')
    with op.batch_alter_table('expenses') as batch_op:
        batch_op.drop_index('ix_expenses_project_id')
        batch_op.drop_constraint('fk_expenses_project_id', type_='foreignkey')
        batch_op.drop_column('project_id')
    with op.batch_alter_table('income') as batch_op:
        batch_op.drop_index('ix_income_project_id')
        batch_op.drop_constraint('fk_income_project_id', type_='foreignkey')
        batch_op.drop_column('project_id')
    op.drop_table('projects')
