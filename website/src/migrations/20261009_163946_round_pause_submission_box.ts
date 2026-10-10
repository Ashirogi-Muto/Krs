import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Rounds can close early and reopen (pause_from / pause_until); "PPT Submission" box label. Additive + guarded data step. */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_rounds" ADD COLUMN "pause_from" timestamp(3) with time zone;
  ALTER TABLE "events_rounds" ADD COLUMN "pause_until" timestamp(3) with time zone;
  ALTER TABLE "event_page_labels" ADD COLUMN "stat_submission" varchar DEFAULT 'PPT Submission';`)

  // Owner, 9 Oct 2026: Hackathon Round 1 closes 15 Oct 23:59:59 IST (18:29:59 UTC) and reopens at a time the owner
  // sets in the CMS (placeholder 16 Oct 03:00 IST = 15 Oct 21:30 UTC); the real end stays 19 Oct. Only while both are
  // still empty and the round really ends later.
  await db.execute(sql`
  UPDATE "events_rounds" r SET "pause_from" = '2026-10-15T18:29:59Z', "pause_until" = '2026-10-15T21:30:00Z'
  FROM "events" e
  WHERE r."_parent_id" = e."id" AND e."slug" = 'hackathon' AND r."number" = 1 AND r."submission_type" = 'PROPOSAL'
    AND r."pause_from" IS NULL AND r."pause_until" IS NULL AND r."end_date" > '2026-10-15T21:30:00Z';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_rounds" DROP COLUMN "pause_from";
  ALTER TABLE "events_rounds" DROP COLUMN "pause_until";
  ALTER TABLE "event_page_labels" DROP COLUMN "stat_submission";`)
}
