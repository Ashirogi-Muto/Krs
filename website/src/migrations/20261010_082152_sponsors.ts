import path from 'node:path'
import fs from 'node:fs'
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Sponsors (owner, 10 Oct 2026). Additive: the "Sponsors" page section, the sponsor list in Site settings, a strip
 * label and a guide link. Data steps, guarded (create-only): realme's official logo into Media, realme as the first
 * sponsor ("Brand Partner": the MoU says brand activation; shown on the Hackathon page), and the section on AURIX home
 * right before its final call-to-action. Each step is skipped if its target already exists.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_sponsors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_sponsors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "site_settings_sponsors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar DEFAULT 'Brand Partner',
  	"logo_id" integer NOT NULL,
  	"url" varchar,
  	"on_competitions" boolean DEFAULT true
  );
  
  CREATE TABLE "site_settings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"events_id" integer
  );
  
  ALTER TABLE "event_page_labels" ADD COLUMN "sponsors_title" varchar DEFAULT 'Partners';
  ALTER TABLE "staff_texts" ADD COLUMN "guide_l_sponsors" varchar DEFAULT 'Site settings → Sponsors (AURIX): the logos';
  ALTER TABLE "pages_blocks_sponsors" ADD CONSTRAINT "pages_blocks_sponsors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_sponsors" ADD CONSTRAINT "_pages_v_blocks_sponsors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_sponsors" ADD CONSTRAINT "site_settings_sponsors_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_sponsors" ADD CONSTRAINT "site_settings_sponsors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_sponsors_order_idx" ON "pages_blocks_sponsors" USING btree ("_order");
  CREATE INDEX "pages_blocks_sponsors_parent_id_idx" ON "pages_blocks_sponsors" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_sponsors_path_idx" ON "pages_blocks_sponsors" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_sponsors_order_idx" ON "_pages_v_blocks_sponsors" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_sponsors_parent_id_idx" ON "_pages_v_blocks_sponsors" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_sponsors_path_idx" ON "_pages_v_blocks_sponsors" USING btree ("_path");
  CREATE INDEX "site_settings_sponsors_order_idx" ON "site_settings_sponsors" USING btree ("_order");
  CREATE INDEX "site_settings_sponsors_parent_id_idx" ON "site_settings_sponsors" USING btree ("_parent_id");
  CREATE INDEX "site_settings_sponsors_logo_idx" ON "site_settings_sponsors" USING btree ("logo_id");
  CREATE INDEX "site_settings_rels_order_idx" ON "site_settings_rels" USING btree ("order");
  CREATE INDEX "site_settings_rels_parent_idx" ON "site_settings_rels" USING btree ("parent_id");
  CREATE INDEX "site_settings_rels_path_idx" ON "site_settings_rels" USING btree ("path");
  CREATE INDEX "site_settings_rels_events_id_idx" ON "site_settings_rels" USING btree ("events_id");`)

  // 1. realme as the first sponsor (only while the list is empty)
  const settings: any = await payload.findGlobal({ slug: 'site-settings', depth: 0, req })
  if (!Array.isArray(settings?.sponsors) || settings.sponsors.length === 0) {
    const file = path.resolve(process.cwd(), 'public/images/sponsors/realme-logo.png')
    if (fs.existsSync(file)) {
      const logo = await payload.create({ collection: 'media', data: { alt: 'realme logo' } as any, filePath: file, req, overrideAccess: true })
      const { docs: hack } = await payload.find({ collection: 'events', where: { slug: { equals: 'hackathon' } }, limit: 1, depth: 0, req, overrideAccess: true })
      await payload.updateGlobal({
        slug: 'site-settings',
        req,
        overrideAccess: true,
        data: {
          sponsors: [
            { name: 'realme', label: 'Brand Partner', logo: logo.id, url: 'https://www.realme.com/in/', onCompetitions: true, events: hack[0] ? [hack[0].id] : [] },
          ],
        } as any,
      })
      payload.logger.info('Sponsors: realme added (logo uploaded to Media)')
    } else payload.logger.warn('Sponsors: realme logo file missing; sponsor not added')
  }

  // 2. The "Sponsors" section on AURIX home, before its final call-to-action (only if the page has none yet)
  const { docs: homes } = await payload.find({ collection: 'pages', where: { path: { equals: '/aurix' } }, limit: 1, depth: 0, req, overrideAccess: true })
  const home: any = homes[0]
  if (home && !(home.layout || []).some((b: any) => b?.blockType === 'sponsors')) {
    const layout = [...(home.layout || [])]
    const ctaAt = layout.map((b: any) => b?.blockType).lastIndexOf('cta')
    const block = { blockType: 'sponsors', eyebrow: 'Partners // AURIX 2026', title: 'Our Sponsors' }
    layout.splice(ctaAt >= 0 ? ctaAt : layout.length, 0, block)
    await payload.update({ collection: 'pages', id: home.id, data: { layout, _status: 'published' } as any, req, overrideAccess: true })
    payload.logger.info('Sponsors: section added to AURIX home')
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_sponsors" CASCADE;
  DROP TABLE "_pages_v_blocks_sponsors" CASCADE;
  DROP TABLE "site_settings_sponsors" CASCADE;
  DROP TABLE "site_settings_rels" CASCADE;
  ALTER TABLE "event_page_labels" DROP COLUMN "sponsors_title";
  ALTER TABLE "staff_texts" DROP COLUMN "guide_l_sponsors";`)
}
