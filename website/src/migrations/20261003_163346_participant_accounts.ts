import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_email_outbox_kind" ADD VALUE 'ACCOUNT_VERIFICATION';
  ALTER TYPE "public"."enum_email_outbox_kind" ADD VALUE 'PASSWORD_RESET';
  ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "verify_token_hash" varchar;
  ALTER TABLE "users" ADD COLUMN "verify_token_expires" timestamp(3) with time zone;
  ALTER TABLE "form_texts" ADD COLUMN "account_reg_notice" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_check_title" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_check_text" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_check_spam" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_resend" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_resent" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_mail_limit" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_gate_title" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_gate_text" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_verified_title" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_verified_text" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_verified_button" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_portal_button" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_verify_invalid" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_verify_expired" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_forgot_title" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_forgot_text" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_forgot_button" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_forgot_done" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_reset_title" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_reset_label" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_reset_button" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_reset_done" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_back_to_login" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_logout" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_login_to_register" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_login_to_register_text" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_login_button" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_signup_button" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_leader_from_account" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "email_outbox" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_email_outbox_kind";
  CREATE TYPE "public"."enum_email_outbox_kind" AS ENUM('REGISTRATION_CONFIRMATION');
  ALTER TABLE "email_outbox" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_email_outbox_kind" USING "kind"::"public"."enum_email_outbox_kind";
  ALTER TABLE "users" DROP COLUMN "email_verified";
  ALTER TABLE "users" DROP COLUMN "email_verified_at";
  ALTER TABLE "users" DROP COLUMN "verify_token_hash";
  ALTER TABLE "users" DROP COLUMN "verify_token_expires";
  ALTER TABLE "form_texts" DROP COLUMN "account_reg_notice";
  ALTER TABLE "form_texts" DROP COLUMN "account_check_title";
  ALTER TABLE "form_texts" DROP COLUMN "account_check_text";
  ALTER TABLE "form_texts" DROP COLUMN "account_check_spam";
  ALTER TABLE "form_texts" DROP COLUMN "account_resend";
  ALTER TABLE "form_texts" DROP COLUMN "account_resent";
  ALTER TABLE "form_texts" DROP COLUMN "account_mail_limit";
  ALTER TABLE "form_texts" DROP COLUMN "account_gate_title";
  ALTER TABLE "form_texts" DROP COLUMN "account_gate_text";
  ALTER TABLE "form_texts" DROP COLUMN "account_verified_title";
  ALTER TABLE "form_texts" DROP COLUMN "account_verified_text";
  ALTER TABLE "form_texts" DROP COLUMN "account_verified_button";
  ALTER TABLE "form_texts" DROP COLUMN "account_portal_button";
  ALTER TABLE "form_texts" DROP COLUMN "account_verify_invalid";
  ALTER TABLE "form_texts" DROP COLUMN "account_verify_expired";
  ALTER TABLE "form_texts" DROP COLUMN "account_forgot_title";
  ALTER TABLE "form_texts" DROP COLUMN "account_forgot_text";
  ALTER TABLE "form_texts" DROP COLUMN "account_forgot_button";
  ALTER TABLE "form_texts" DROP COLUMN "account_forgot_done";
  ALTER TABLE "form_texts" DROP COLUMN "account_reset_title";
  ALTER TABLE "form_texts" DROP COLUMN "account_reset_label";
  ALTER TABLE "form_texts" DROP COLUMN "account_reset_button";
  ALTER TABLE "form_texts" DROP COLUMN "account_reset_done";
  ALTER TABLE "form_texts" DROP COLUMN "account_back_to_login";
  ALTER TABLE "form_texts" DROP COLUMN "account_logout";
  ALTER TABLE "form_texts" DROP COLUMN "account_login_to_register";
  ALTER TABLE "form_texts" DROP COLUMN "account_login_to_register_text";
  ALTER TABLE "form_texts" DROP COLUMN "account_login_button";
  ALTER TABLE "form_texts" DROP COLUMN "account_signup_button";
  ALTER TABLE "form_texts" DROP COLUMN "account_leader_from_account";`)
}
