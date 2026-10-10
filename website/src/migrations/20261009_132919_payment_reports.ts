import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Payment matching in the CMS (owner, 9 Oct 2026). Additive: the payment_reports table (stored Razorpay reports),
 * staff-text columns/defaults, and a unique index on event_registrations.payment_reference (one payment = one team).
 * Data steps, guarded:
 *  - blank payment references become NULL first (the index allows many NULLs, not many '');
 *  - presets: Treasurer gains "Payment matching", Event Head loses it (owner: Finance, Treasurer, President and
 *    admins); only rows still marked as presets, and descriptions only while they still read the old preset text.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`UPDATE "event_registrations" SET "payment_reference" = NULL WHERE btrim("payment_reference") = '';`)
  await db.execute(sql`
   CREATE TABLE "payment_reports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"original_name" varchar,
  	"uploaded_by" varchar,
  	"row_count" numeric,
  	"payment_ids" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "staff_texts" ALTER COLUMN "payments_no_access" SET DEFAULT 'Only Finance, the Treasurer, the President and admins can match payments, or a team member whose access role includes "Payment matching".';
  ALTER TABLE "staff_texts" ALTER COLUMN "payments_step1" SET DEFAULT '1. Download the payments report from Razorpay ({csv}) and choose it here. The file is stored with the latest reports; no team changes until you press Apply.';
  ALTER TABLE "staff_texts" ALTER COLUMN "payments_csv_word" SET DEFAULT 'Excel .xlsx or CSV';
  ALTER TABLE "staff_texts" ALTER COLUMN "payments_not_csv" SET DEFAULT 'Please choose the Razorpay report as an Excel (.xlsx) or CSV file. Old .xls files and password-protected files cannot be read.';
  ALTER TABLE "staff_texts" ALTER COLUMN "retention_intro" SET DEFAULT 'Participants are told their data is kept for {days} days after their event. Events listed here are past that date. Deleting removes the event''s registrations, student ID files and confirmation emails, and the stored Razorpay reports, permanently (copies in server backups age out within 7 days). Download an export first if you need one.';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payment_reports_id" integer;
  ALTER TABLE "staff_texts" ADD COLUMN "payments_nav_label" varchar DEFAULT 'Payment matching';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_intro" varchar DEFAULT 'Upload the payments report from Razorpay every day. Each report lists all payments so far: payments recorded on earlier days are skipped by themselves, so only new payments are offered. No email is sent to the teams.';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_err_broken" varchar DEFAULT 'This file could not be read. Download the report from Razorpay again, or save it as CSV.';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_err_too_big" varchar DEFAULT 'The file is too large (2 MB at most).';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_err_empty" varchar DEFAULT 'The file has no payment rows.';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_err_too_many" varchar DEFAULT 'The file has more than {max} rows.';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_uploading" varchar DEFAULT 'Reading the file…';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_upload_failed" varchar DEFAULT 'Upload failed — are you still signed in?';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_saved_as" varchar DEFAULT 'Stored as the report of {date}.';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_compared_with" varchar DEFAULT ' Payments that were already in the report of {date} are marked "earlier".';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_no_previous" varchar DEFAULT ' There is no earlier report to compare with.';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_col_seen" varchar DEFAULT 'In report';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_seen_new" varchar DEFAULT 'New';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_seen_earlier" varchar DEFAULT 'Earlier';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_reports_title" varchar DEFAULT 'Stored reports (the newest {n} are kept)';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_reports_empty" varchar DEFAULT 'No report uploaded yet.';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_report_line" varchar DEFAULT '{name} · {date} · {rows} rows · {by}';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_download" varchar DEFAULT 'Download';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_skip_paid" varchar DEFAULT '{code} (already paid with {ref})';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_skip_recorded" varchar DEFAULT '{code} (already recorded)';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_skip_other_team" varchar DEFAULT '{code} (payment {ref} is already recorded on {other})';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_skip_cancelled" varchar DEFAULT '{code} (registration cancelled)';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_skip_not_in_report" varchar DEFAULT '{code} (payment {ref} is not a paid payment of this team in the report)';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_report_gone" varchar DEFAULT 'This report is no longer stored (newer uploads replaced it). Please choose the file again.';
  ALTER TABLE "staff_texts" ADD COLUMN "payments_why_verified_by_hand" varchar DEFAULT 'Team was marked paid earlier without a payment ID';
  CREATE INDEX "payment_reports_updated_at_idx" ON "payment_reports" USING btree ("updated_at");
  CREATE INDEX "payment_reports_created_at_idx" ON "payment_reports" USING btree ("created_at");
  CREATE UNIQUE INDEX "payment_reports_filename_idx" ON "payment_reports" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payment_reports_fk" FOREIGN KEY ("payment_reports_id") REFERENCES "public"."payment_reports"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "event_registrations_payment_reference_idx" ON "event_registrations" USING btree ("payment_reference");
  CREATE INDEX "payload_locked_documents_rels_payment_reports_id_idx" ON "payload_locked_documents_rels" USING btree ("payment_reports_id");`)
  await db.execute(sql`
  INSERT INTO "access_roles_permissions" ("order", "parent_id", "value")
  SELECT COALESCE((SELECT max(p."order") FROM "access_roles_permissions" p WHERE p."parent_id" = r."id"), 0) + 1, r."id", 'tools.paymentMatching'::"enum_access_roles_permissions"
  FROM "access_roles" r
  WHERE r."name" = 'Treasurer' AND r."preset" = true
    AND NOT EXISTS (SELECT 1 FROM "access_roles_permissions" p WHERE p."parent_id" = r."id" AND p."value" = 'tools.paymentMatching');
  DELETE FROM "access_roles_permissions" p USING "access_roles" r
  WHERE p."parent_id" = r."id" AND r."name" = 'Event Head' AND r."preset" = true AND p."value" = 'tools.paymentMatching';
  UPDATE "access_roles" SET "description" = 'Finance view, finance CSV and payment matching.'
  WHERE "name" = 'Treasurer' AND "preset" = true AND "description" = 'Finance view (read-only) and finance CSV.';
  UPDATE "access_roles" SET "description" = 'Manages registrations (all fields, all exports), submissions, announcements and form submissions; payment matching.'
  WHERE "name" = 'President' AND "preset" = true AND "description" = 'Manages registrations (all fields, all exports), submissions, announcements and form submissions.';
  UPDATE "access_roles" SET "description" = 'As President except payment matching, plus edits events (including dates, fees and team sizes), event wording and the AURIX schedule.'
  WHERE "name" = 'Event Head' AND "preset" = true AND "description" = 'As President, plus edits events (including dates, fees and team sizes), event wording and the AURIX schedule.';`)
  payload.logger.info('Payment matching: Treasurer preset gains it, Event Head preset loses it (presets only)')
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payment_reports" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payment_reports" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payment_reports_fk";
  
  DROP INDEX "event_registrations_payment_reference_idx";
  DROP INDEX "payload_locked_documents_rels_payment_reports_id_idx";
  ALTER TABLE "staff_texts" ALTER COLUMN "payments_no_access" SET DEFAULT 'Only the Finance team and registration managers can match payments.';
  ALTER TABLE "staff_texts" ALTER COLUMN "payments_step1" SET DEFAULT '1. Download the payments report from Razorpay as {csv} and choose it here. Nothing is saved until you press Apply.';
  ALTER TABLE "staff_texts" ALTER COLUMN "payments_csv_word" SET DEFAULT 'CSV';
  ALTER TABLE "staff_texts" ALTER COLUMN "payments_not_csv" SET DEFAULT 'Please export the Razorpay report as CSV.';
  ALTER TABLE "staff_texts" ALTER COLUMN "retention_intro" SET DEFAULT 'Participants are told their data is kept for {days} days after their event. Events listed here are past that date. Deleting removes the event''s registrations, student ID files and confirmation emails permanently (copies in server backups age out within 7 days). Download an export first if you need one.';
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payment_reports_id";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_nav_label";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_intro";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_err_broken";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_err_too_big";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_err_empty";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_err_too_many";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_uploading";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_upload_failed";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_saved_as";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_compared_with";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_no_previous";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_col_seen";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_seen_new";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_seen_earlier";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_reports_title";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_reports_empty";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_report_line";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_download";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_skip_paid";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_skip_recorded";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_skip_other_team";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_skip_cancelled";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_skip_not_in_report";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_report_gone";
  ALTER TABLE "staff_texts" DROP COLUMN "payments_why_verified_by_hand";`)
}
