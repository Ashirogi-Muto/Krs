import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Owner, 18 Oct 2026: site-wide coupon strip wording for a coupon valid for one competition (event_page_labels). Additive. */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_page_labels" ADD COLUMN "ticker_text_one" varchar DEFAULT 'Coupon live: {headline} on {event} with code';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_page_labels" DROP COLUMN "ticker_text_one";`)
}
