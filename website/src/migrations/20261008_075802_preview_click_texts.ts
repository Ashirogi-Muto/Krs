import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "staff_texts" ADD COLUMN "preview_click_on" varchar DEFAULT 'Click to edit: on';
  ALTER TABLE "staff_texts" ADD COLUMN "preview_click_off" varchar DEFAULT 'Click to edit: off';
  ALTER TABLE "staff_texts" ADD COLUMN "preview_click_hint" varchar DEFAULT 'On: clicking text in the preview opens its field in the CMS. Off: links in the preview work normally.';
  ALTER TABLE "staff_texts" ADD COLUMN "preview_shared_note" varchar DEFAULT 'This text is shared: changing it changes every page that uses it.';
  ALTER TABLE "staff_texts" ADD COLUMN "preview_no_field" varchar DEFAULT 'This text is not edited on this screen. Try Help → Where to edit.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "staff_texts" DROP COLUMN "preview_click_on";
  ALTER TABLE "staff_texts" DROP COLUMN "preview_click_off";
  ALTER TABLE "staff_texts" DROP COLUMN "preview_click_hint";
  ALTER TABLE "staff_texts" DROP COLUMN "preview_shared_note";
  ALTER TABLE "staff_texts" DROP COLUMN "preview_no_field";`)
}
