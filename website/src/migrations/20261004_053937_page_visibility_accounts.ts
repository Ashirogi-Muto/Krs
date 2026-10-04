import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "hidden_paths" jsonb;
  ALTER TABLE "form_texts" ADD COLUMN "account_wrong_address" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "project_page_demo" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "project_page_team_lead" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "learning_page_drive" varchar;`)
  // Data copy (nothing removed): the pages hidden today move to the new list used by the Page visibility screen.
  // The old site_settings_hidden_pages rows stay as they are.
  await db.execute(sql`
   UPDATE "site_settings" s SET "hidden_paths" = COALESCE(
     (SELECT jsonb_agg(h."value"::text ORDER BY h."order") FROM "site_settings_hidden_pages" h WHERE h."parent_id" = s."id"),
     '[]'::jsonb)
   WHERE s."hidden_paths" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "hidden_paths";
  ALTER TABLE "form_texts" DROP COLUMN "account_wrong_address";
  ALTER TABLE "form_texts" DROP COLUMN "project_page_demo";
  ALTER TABLE "form_texts" DROP COLUMN "project_page_team_lead";
  ALTER TABLE "form_texts" DROP COLUMN "learning_page_drive";`)
}
