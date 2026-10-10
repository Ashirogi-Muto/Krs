import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_registrations_members" ALTER COLUMN "id_document_id" DROP NOT NULL;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_id_help" SET DEFAULT 'Upload a clear photo or PDF of the team leader''s student ID card (required); other members'' ID cards are optional. Max 2 MB per file; photos are resized automatically.';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_email_optional" SET DEFAULT 'Email';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_phone_optional" SET DEFAULT 'Phone';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_id" SET DEFAULT 'Please upload the team leader''s student ID card.';
  ALTER TABLE "form_texts" ADD COLUMN "registration_student_id_optional" varchar DEFAULT 'Student ID (optional)';
  ALTER TABLE "form_texts" ADD COLUMN "registration_err_contact" varchar DEFAULT 'Please enter an email address and phone number for every team member.';
  ALTER TABLE "form_texts" ADD COLUMN "messages_reg_member_contact" varchar DEFAULT '{name} needs an email address and phone number.';`)
  // Data step (owner, 8 Oct 2026: only the team leader's student ID is required; email + phone for every member).
  // The /aurix/register page intro said "upload each member's student ID". Change it only if it still has exactly the
  // built-in wording (an editor's own text is left alone).
  await db.execute(sql`
    UPDATE "pages_blocks_page_header"
    SET "intro" = 'Fill in your team details (an email and phone number for every member) and upload the team leader''s student ID; other members'' IDs are optional. You''ll then be taken to the payment page with your details already filled in. Already registered?'
    WHERE "intro" = 'Fill in your team details and upload each member''s student ID. You''ll then be taken to the payment page with your details already filled in. Already registered?';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_registrations_members" ALTER COLUMN "id_document_id" SET NOT NULL;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_id_help" SET DEFAULT 'Every member must upload a clear photo or PDF of their student ID card (max 2 MB; photos are resized automatically).';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_email_optional" SET DEFAULT 'Email (optional)';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_phone_optional" SET DEFAULT 'Phone (optional)';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_id" SET DEFAULT 'Please upload a student ID card for every team member.';
  ALTER TABLE "form_texts" DROP COLUMN "registration_student_id_optional";
  ALTER TABLE "form_texts" DROP COLUMN "registration_err_contact";
  ALTER TABLE "form_texts" DROP COLUMN "messages_reg_member_contact";`)
}
