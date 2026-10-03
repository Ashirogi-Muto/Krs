import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_texts" ADD COLUMN "sign_in_login_title" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_login_subtitle" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_email" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_email_placeholder" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_password" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_forgot" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_login_button" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_login_busy" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_login_error" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_no_account" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_register_link" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_reg_title" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_reg_subtitle" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_reg_name" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_reg_name_placeholder" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_reg_email" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_reg_email_placeholder" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_reg_college" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_reg_college_placeholder" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_reg_phone" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_reg_phone_placeholder" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_reg_password" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_reg_button" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_reg_busy" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_reg_error" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_have_account" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "sign_in_login_link" varchar;`)
  // Data fill (never overwrites): the built-in home page was created before "text after the fee" existed, so its
  // competition cards lost " / team". Only fills the value where it was never set.
  await db.execute(sql`
    UPDATE "pages_blocks_event_cards" SET "fee_suffix" = ' / team'
    WHERE "fee_suffix" IS NULL
      AND "_parent_id" IN (SELECT "id" FROM "pages" WHERE "path" = '/' AND "system" = true);
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_texts" DROP COLUMN "sign_in_login_title";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_login_subtitle";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_email";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_email_placeholder";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_password";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_forgot";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_login_button";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_login_busy";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_login_error";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_no_account";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_register_link";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_reg_title";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_reg_subtitle";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_reg_name";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_reg_name_placeholder";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_reg_email";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_reg_email_placeholder";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_reg_college";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_reg_college_placeholder";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_reg_phone";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_reg_phone_placeholder";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_reg_password";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_reg_button";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_reg_busy";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_reg_error";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_have_account";
  ALTER TABLE "form_texts" DROP COLUMN "sign_in_login_link";`)
}
