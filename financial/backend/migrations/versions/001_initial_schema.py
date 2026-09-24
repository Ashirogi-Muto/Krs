"""001_initial_schema

Revision ID: 001_initial
Revises: 
Create Date: 2026-09-20 21:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), server_default='VIEWER', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. categories
    op.create_table(
        'categories',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. payment_methods
    op.create_table(
        'payment_methods',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # 4. income
    op.create_table(
        'income',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('transaction_id', sa.String(length=30), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('source', sa.String(length=200), nullable=False),
        sa.Column('category_id', sa.String(length=36), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('payment_method_id', sa.String(length=36), nullable=False),
        sa.Column('received_by', sa.String(length=100), nullable=False),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='CLEARED', nullable=False),
        sa.Column('created_by', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id']),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['payment_method_id'], ['payment_methods.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_income_transaction_id', 'income', ['transaction_id'], unique=True)
    op.create_index('ix_income_date', 'income', ['date'])
    op.create_index('ix_income_source', 'income', ['source'])
    op.create_index('ix_income_category_id', 'income', ['category_id'])
    op.create_index('ix_income_status', 'income', ['status'])

    # 5. expenses
    op.create_table(
        'expenses',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('transaction_id', sa.String(length=30), nullable=False),
        sa.Column('bill_date', sa.Date(), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.Column('category_id', sa.String(length=36), nullable=False),
        sa.Column('vendor', sa.String(length=200), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('amount_paid', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('status', sa.String(length=20), server_default='PENDING', nullable=False),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('payment_date', sa.Date(), nullable=True),
        sa.Column('payment_method_id', sa.String(length=36), nullable=True),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id']),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['payment_method_id'], ['payment_methods.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_expenses_transaction_id', 'expenses', ['transaction_id'], unique=True)
    op.create_index('ix_expenses_bill_date', 'expenses', ['bill_date'])
    op.create_index('ix_expenses_vendor', 'expenses', ['vendor'])
    op.create_index('ix_expenses_category_id', 'expenses', ['category_id'])
    op.create_index('ix_expenses_status', 'expenses', ['status'])
    op.create_index('ix_expenses_due_date', 'expenses', ['due_date'])

    # 6. documents
    op.create_table(
        'documents',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('storage_key', sa.String(length=500), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('checksum_sha256', sa.String(length=64), nullable=False),
        sa.Column('uploaded_by', sa.String(length=36), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('storage_key')
    )

    # 7. document_links
    op.create_table(
        'document_links',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('document_id', sa.String(length=36), nullable=False),
        sa.Column('entity_type', sa.String(length=20), nullable=False),
        sa.Column('entity_id', sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('document_id', 'entity_type', 'entity_id', name='uq_doc_entity_link')
    )
    op.create_index('ix_document_links_entity_id', 'document_links', ['entity_id'])

    # 8. audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('user_name', sa.String(length=100), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.String(length=100), nullable=False),
        sa.Column('before_data', sa.JSON(), nullable=True),
        sa.Column('after_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_audit_logs_entity_id', 'audit_logs', ['entity_id'])
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('document_links')
    op.drop_table('documents')
    op.drop_table('expenses')
    op.drop_table('income')
    op.drop_table('payment_methods')
    op.drop_table('categories')
    op.drop_table('users')
