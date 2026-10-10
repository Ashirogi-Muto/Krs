"""004_audit_append_only: the audit trail can only be added to (Postgres trigger rejects UPDATE/DELETE)

The app never edits or deletes audit rows; this makes that a database rule, so a bug or a stolen app session can't
rewrite history. Additive: no data changes. SQLite (tests) has no such trigger and is skipped.

Revision ID: 004_audit_append_only
Revises: 003_session_version
Create Date: 2026-10-07 09:00:00.000000
"""
from typing import Sequence, Union
from alembic import op

revision: str = '004_audit_append_only'
down_revision: Union[str, None] = '003_session_version'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if op.get_bind().dialect.name != 'postgresql':
        return
    op.execute(
        """
        CREATE OR REPLACE FUNCTION audit_logs_append_only() RETURNS trigger AS $$
        BEGIN
            RAISE EXCEPTION 'audit_logs is append-only (% refused)', TG_OP;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute("DROP TRIGGER IF EXISTS audit_logs_no_change ON audit_logs;")
    op.execute(
        """
        CREATE TRIGGER audit_logs_no_change
        BEFORE UPDATE OR DELETE ON audit_logs
        FOR EACH ROW EXECUTE FUNCTION audit_logs_append_only();
        """
    )
    op.execute("DROP TRIGGER IF EXISTS audit_logs_no_truncate ON audit_logs;")
    op.execute(
        """
        CREATE TRIGGER audit_logs_no_truncate
        BEFORE TRUNCATE ON audit_logs
        FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_append_only();
        """
    )


def downgrade() -> None:
    if op.get_bind().dialect.name != 'postgresql':
        return
    op.execute("DROP TRIGGER IF EXISTS audit_logs_no_truncate ON audit_logs;")
    op.execute("DROP TRIGGER IF EXISTS audit_logs_no_change ON audit_logs;")
    op.execute("DROP FUNCTION IF EXISTS audit_logs_append_only();")
