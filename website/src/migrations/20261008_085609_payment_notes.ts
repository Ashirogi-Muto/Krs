import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_texts" ADD COLUMN "registration_done_pay_college" varchar DEFAULT 'The payment page only accepts letters and numbers in the college name, so we filled it in without spaces (e.g. IILMUniversity). Please keep it like that.';
  ALTER TABLE "form_texts" ADD COLUMN "status_pay_title" varchar DEFAULT 'Haven''t paid yet?';
  ALTER TABLE "form_texts" ADD COLUMN "status_pay_button" varchar DEFAULT 'Proceed to payment';
  ALTER TABLE "form_texts" ADD COLUMN "status_pay_college" varchar DEFAULT 'The payment page only accepts letters and numbers in the college name, so we filled it in without spaces (e.g. IILMUniversity). Please keep it like that.';
  ALTER TABLE "form_texts" ADD COLUMN "status_pay_already" varchar DEFAULT 'Already paid? Don''t pay again: payments are checked once a day and show here within 24–48 hours.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_texts" DROP COLUMN "registration_done_pay_college";
  ALTER TABLE "form_texts" DROP COLUMN "status_pay_title";
  ALTER TABLE "form_texts" DROP COLUMN "status_pay_button";
  ALTER TABLE "form_texts" DROP COLUMN "status_pay_college";
  ALTER TABLE "form_texts" DROP COLUMN "status_pay_already";`)
}
