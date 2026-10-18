import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Owner, 18 Oct 2026: free registration for school students (lib/school-entry.ts): payment status NOT_REQUIRED,
 * event_registrations.school_entry, the wording in its own global school_entry_texts (form_texts is at Postgres' 8 KB
 * row limit and must not grow), plus portal/staff labels. Additive only.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_event_registrations_payment_status" ADD VALUE 'NOT_REQUIRED' BEFORE 'NOT_FOUND';
  CREATE TABLE "school_entry_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"form_school_check" varchar DEFAULT 'The team leader is a school student (Class 5–12): registration is free',
  	"form_school_help" varchar DEFAULT 'Choose the team leader''s class and upload the leader''s school ID card. Your team is confirmed once we have checked the ID; you will not be asked to pay.',
  	"form_school_name" varchar DEFAULT 'School name',
  	"form_school_id" varchar DEFAULT 'School ID card',
  	"form_school_class" varchar DEFAULT 'Class (required for a free school entry)',
  	"form_submit_free" varchar DEFAULT 'Register (free school entry)',
  	"form_err_school_year" varchar DEFAULT 'For a free school entry, choose the team leader''s class (Class 5–12).',
  	"form_done_free_next" varchar DEFAULT 'No payment needed: free school entry',
  	"form_done_free_confirm" varchar DEFAULT 'We will check the team leader''s school ID card. Your registration is confirmed once it is verified; you will receive an email.',
  	"form_reg_school_year" varchar DEFAULT 'A free school entry needs the team leader ({name}) to be in Class 5–12. Choose the class, or untick the school student box.',
  	"status_pay_free" varchar DEFAULT 'Free (school entry): no payment needed',
  	"status_fee_school" varchar DEFAULT 'Free (school entry)',
  	"status_next1_school" varchar DEFAULT 'Our team checks the team leader''s school ID card. There is nothing to pay.',
  	"status_next2_school" varchar DEFAULT 'Once the school ID is verified, your registration is confirmed.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "event_registrations" ADD COLUMN "school_entry" boolean DEFAULT false;
  ALTER TABLE "portal_texts" ADD COLUMN "dashboard_pay_free" varchar DEFAULT 'Free (school entry): no payment needed';
  ALTER TABLE "staff_texts" ADD COLUMN "checkin_warn_school" varchar DEFAULT 'Free school entry: check the team leader''s school ID card';
  ALTER TABLE "staff_texts" ADD COLUMN "csv_school_entry" varchar DEFAULT 'School entry';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "school_entry_texts" CASCADE;
  ALTER TABLE "event_registrations" ALTER COLUMN "payment_status" SET DATA TYPE text;
  ALTER TABLE "event_registrations" ALTER COLUMN "payment_status" SET DEFAULT 'AWAITING_PAYMENT'::text;
  DROP TYPE "public"."enum_event_registrations_payment_status";
  CREATE TYPE "public"."enum_event_registrations_payment_status" AS ENUM('AWAITING_PAYMENT', 'PAID_VERIFIED', 'NOT_FOUND', 'REFUNDED');
  ALTER TABLE "event_registrations" ALTER COLUMN "payment_status" SET DEFAULT 'AWAITING_PAYMENT'::"public"."enum_event_registrations_payment_status";
  ALTER TABLE "event_registrations" ALTER COLUMN "payment_status" SET DATA TYPE "public"."enum_event_registrations_payment_status" USING "payment_status"::"public"."enum_event_registrations_payment_status";
  ALTER TABLE "event_registrations" DROP COLUMN "school_entry";
  ALTER TABLE "portal_texts" DROP COLUMN "dashboard_pay_free";
  ALTER TABLE "staff_texts" DROP COLUMN "checkin_warn_school";
  ALTER TABLE "staff_texts" DROP COLUMN "csv_school_entry";`)
}
