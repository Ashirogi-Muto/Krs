import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Small sponsor logos in heroes: the per-sponsor tick and the hero line text (additive); realme ticked. */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings_sponsors" ADD COLUMN "in_hero" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "hero_label" varchar DEFAULT 'In association with';`)

  // Owner, 10 Oct 2026: realme also gets a small logo in the hero (AURIX home + its competition pages)
  await db.execute(sql`UPDATE "site_settings_sponsors" SET "in_hero" = true WHERE "name" = 'realme' AND "in_hero" IS NOT TRUE;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings_sponsors" DROP COLUMN "in_hero";
  ALTER TABLE "site_settings" DROP COLUMN "hero_label";`)
}
