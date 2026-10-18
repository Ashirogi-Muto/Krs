import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * PR #18 review (18 Oct 2026): Hackathon direct entry is switched per competition in the CMS (events.direct_entry) and its
 * notice wording is in Event pages (event_page_labels.direct_entry_*; defaults = the PR's text). Additive only.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" ADD COLUMN "direct_entry" boolean DEFAULT false;
  ALTER TABLE "event_page_labels" ADD COLUMN "direct_entry_badge" varchar DEFAULT 'Important update';
  ALTER TABLE "event_page_labels" ADD COLUMN "direct_entry_title" varchar DEFAULT 'All teams proceed directly to the final';
  ALTER TABLE "event_page_labels" ADD COLUMN "direct_entry_text" varchar DEFAULT 'The online screening round has been withdrawn. With registrations closing on {close} and the event on {date}, the remaining time is too short to run it fairly. All registered teams will compete directly in the 12-hour on-site hackathon.';
  ALTER TABLE "event_page_labels" ADD COLUMN "direct_entry_text_no_close" varchar DEFAULT 'The online screening round has been withdrawn. With the event on {date}, the remaining time is too short to run it fairly. All registered teams will compete directly in the 12-hour on-site hackathon.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" DROP COLUMN "direct_entry";
  ALTER TABLE "event_page_labels" DROP COLUMN "direct_entry_badge";
  ALTER TABLE "event_page_labels" DROP COLUMN "direct_entry_title";
  ALTER TABLE "event_page_labels" DROP COLUMN "direct_entry_text";
  ALTER TABLE "event_page_labels" DROP COLUMN "direct_entry_text_no_close";`)
}
