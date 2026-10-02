import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "page_texts_insights_cultures" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "page_texts_insights_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year" varchar,
  	"title" varchar,
  	"description" varchar
  );
  
  ALTER TABLE "page_texts" ADD COLUMN "insights_eyebrow" varchar;
  ALTER TABLE "page_texts" ADD COLUMN "insights_title" varchar;
  ALTER TABLE "page_texts" ADD COLUMN "insights_intro" varchar;
  ALTER TABLE "page_texts" ADD COLUMN "insights_timeline_eyebrow" varchar;
  ALTER TABLE "page_texts" ADD COLUMN "insights_timeline_title" varchar;
  ALTER TABLE "page_texts" ADD COLUMN "insights_affiliation_label" varchar;
  ALTER TABLE "page_texts" ADD COLUMN "insights_affiliation_title" varchar;
  ALTER TABLE "page_texts" ADD COLUMN "insights_affiliation_text" varchar;
  ALTER TABLE "page_texts_insights_cultures" ADD CONSTRAINT "page_texts_insights_cultures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_texts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_texts_insights_timeline" ADD CONSTRAINT "page_texts_insights_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_texts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "page_texts_insights_cultures_order_idx" ON "page_texts_insights_cultures" USING btree ("_order");
  CREATE INDEX "page_texts_insights_cultures_parent_id_idx" ON "page_texts_insights_cultures" USING btree ("_parent_id");
  CREATE INDEX "page_texts_insights_timeline_order_idx" ON "page_texts_insights_timeline" USING btree ("_order");
  CREATE INDEX "page_texts_insights_timeline_parent_id_idx" ON "page_texts_insights_timeline" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "page_texts_insights_cultures" CASCADE;
  DROP TABLE "page_texts_insights_timeline" CASCADE;
  ALTER TABLE "page_texts" DROP COLUMN "insights_eyebrow";
  ALTER TABLE "page_texts" DROP COLUMN "insights_title";
  ALTER TABLE "page_texts" DROP COLUMN "insights_intro";
  ALTER TABLE "page_texts" DROP COLUMN "insights_timeline_eyebrow";
  ALTER TABLE "page_texts" DROP COLUMN "insights_timeline_title";
  ALTER TABLE "page_texts" DROP COLUMN "insights_affiliation_label";
  ALTER TABLE "page_texts" DROP COLUMN "insights_affiliation_title";
  ALTER TABLE "page_texts" DROP COLUMN "insights_affiliation_text";`)
}
