import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_rounds" ADD COLUMN "evaluation_format" varchar;
  ALTER TABLE "events_schedule" ADD COLUMN "location" varchar;
  ALTER TABLE "events" ADD COLUMN "coming_soon" boolean DEFAULT false;
  ALTER TABLE "events" ADD COLUMN "coming_soon_message" varchar;
  ALTER TABLE "events" ADD COLUMN "timezone" varchar DEFAULT 'Asia/Kolkata';
  ALTER TABLE "events" ADD COLUMN "participant_requirements" varchar;
  ALTER TABLE "events" ADD COLUMN "registration_url" varchar;
  ALTER TABLE "events" ADD COLUMN "media_gallery_url" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_rounds" DROP COLUMN "evaluation_format";
  ALTER TABLE "events_schedule" DROP COLUMN "location";
  ALTER TABLE "events" DROP COLUMN "coming_soon";
  ALTER TABLE "events" DROP COLUMN "coming_soon_message";
  ALTER TABLE "events" DROP COLUMN "timezone";
  ALTER TABLE "events" DROP COLUMN "participant_requirements";
  ALTER TABLE "events" DROP COLUMN "registration_url";
  ALTER TABLE "events" DROP COLUMN "media_gallery_url";`)
}
