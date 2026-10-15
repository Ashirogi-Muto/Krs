import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Owner, 15 Oct 2026: wording of the Participants screen's "Export CSV" button and of the CSV's columns
 * (Staff & admin texts → Accounts screens). Additive only.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "staff_texts" ADD COLUMN "accounts_export_csv" varchar DEFAULT 'Export CSV ({count})';
  ALTER TABLE "staff_texts" ADD COLUMN "accounts_csv_name" varchar DEFAULT 'Name';
  ALTER TABLE "staff_texts" ADD COLUMN "accounts_csv_email" varchar DEFAULT 'Email';
  ALTER TABLE "staff_texts" ADD COLUMN "accounts_csv_phone" varchar DEFAULT 'Phone';
  ALTER TABLE "staff_texts" ADD COLUMN "accounts_csv_college" varchar DEFAULT 'College / institution';
  ALTER TABLE "staff_texts" ADD COLUMN "accounts_csv_confirmed" varchar DEFAULT 'Email confirmed';
  ALTER TABLE "staff_texts" ADD COLUMN "accounts_csv_confirmed_at" varchar DEFAULT 'Confirmed at (IST)';
  ALTER TABLE "staff_texts" ADD COLUMN "accounts_csv_signed_up" varchar DEFAULT 'Signed up (IST)';
  ALTER TABLE "staff_texts" ADD COLUMN "accounts_csv_locked" varchar DEFAULT 'Locked until (IST)';
  ALTER TABLE "staff_texts" ADD COLUMN "accounts_csv_teams" varchar DEFAULT 'Teams';
  ALTER TABLE "staff_texts" ADD COLUMN "accounts_csv_team_codes" varchar DEFAULT 'Team codes';
  ALTER TABLE "staff_texts" ADD COLUMN "accounts_csv_events" varchar DEFAULT 'Competitions';
  ALTER TABLE "staff_texts" ADD COLUMN "accounts_csv_yes" varchar DEFAULT 'Yes';
  ALTER TABLE "staff_texts" ADD COLUMN "accounts_csv_no" varchar DEFAULT 'No';
  ALTER TABLE "staff_texts" ADD COLUMN "accounts_csv_file" varchar DEFAULT 'participants';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "staff_texts" DROP COLUMN "accounts_export_csv";
  ALTER TABLE "staff_texts" DROP COLUMN "accounts_csv_name";
  ALTER TABLE "staff_texts" DROP COLUMN "accounts_csv_email";
  ALTER TABLE "staff_texts" DROP COLUMN "accounts_csv_phone";
  ALTER TABLE "staff_texts" DROP COLUMN "accounts_csv_college";
  ALTER TABLE "staff_texts" DROP COLUMN "accounts_csv_confirmed";
  ALTER TABLE "staff_texts" DROP COLUMN "accounts_csv_confirmed_at";
  ALTER TABLE "staff_texts" DROP COLUMN "accounts_csv_signed_up";
  ALTER TABLE "staff_texts" DROP COLUMN "accounts_csv_locked";
  ALTER TABLE "staff_texts" DROP COLUMN "accounts_csv_teams";
  ALTER TABLE "staff_texts" DROP COLUMN "accounts_csv_team_codes";
  ALTER TABLE "staff_texts" DROP COLUMN "accounts_csv_events";
  ALTER TABLE "staff_texts" DROP COLUMN "accounts_csv_yes";
  ALTER TABLE "staff_texts" DROP COLUMN "accounts_csv_no";
  ALTER TABLE "staff_texts" DROP COLUMN "accounts_csv_file";`)
}
