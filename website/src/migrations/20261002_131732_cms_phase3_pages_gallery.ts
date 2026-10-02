import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_gallery_albums_category" AS ENUM('Projects', 'Competitions', 'Workshops', 'Lab Workbench');
  CREATE TYPE "public"."enum_gallery_albums_type" AS ENUM('album', 'video');
  CREATE TABLE "gallery_albums" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"category" "enum_gallery_albums_category" NOT NULL,
  	"type" "enum_gallery_albums_type" DEFAULT 'album' NOT NULL,
  	"date" varchar,
  	"caption" varchar NOT NULL,
  	"drive_url" varchar NOT NULL,
  	"cover_image_id" integer,
  	"sort_order" numeric DEFAULT 100,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "page_texts_aurix_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "page_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"home_hero_eyebrow" varchar,
  	"home_hero_intro" varchar,
  	"home_about_eyebrow" varchar,
  	"home_about_title" varchar,
  	"home_domains_title" varchar,
  	"home_aurix_eyebrow" varchar,
  	"home_aurix_title" varchar,
  	"home_aurix_intro" varchar,
  	"home_aurix_button" varchar,
  	"home_hackathon_button" varchar,
  	"home_pillars_eyebrow" varchar,
  	"home_pillars_title" varchar,
  	"aurix_hero_eyebrow" varchar,
  	"aurix_hero_intro" varchar,
  	"aurix_explore_button" varchar,
  	"aurix_portal_button" varchar,
  	"aurix_categories_eyebrow" varchar,
  	"aurix_categories_title" varchar,
  	"aurix_categories_intro" varchar,
  	"aurix_steps_eyebrow" varchar,
  	"aurix_steps_title" varchar,
  	"aurix_comparison_eyebrow" varchar,
  	"aurix_comparison_title" varchar,
  	"competitions_eyebrow" varchar,
  	"competitions_title" varchar,
  	"competitions_intro" varchar,
  	"faq_eyebrow" varchar,
  	"faq_title" varchar,
  	"faq_intro" varchar,
  	"rules_eyebrow" varchar,
  	"rules_title" varchar,
  	"rules_intro" varchar,
  	"gallery_eyebrow" varchar,
  	"gallery_title" varchar,
  	"gallery_intro" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "legal_pages_privacy_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" varchar NOT NULL
  );
  
  CREATE TABLE "legal_pages_terms_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" varchar NOT NULL
  );
  
  CREATE TABLE "legal_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"privacy_title" varchar NOT NULL,
  	"privacy_last_updated" varchar,
  	"terms_title" varchar NOT NULL,
  	"terms_last_updated" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "gallery_albums_id" integer;
  ALTER TABLE "gallery_albums" ADD CONSTRAINT "gallery_albums_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_texts_aurix_steps" ADD CONSTRAINT "page_texts_aurix_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_texts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "legal_pages_privacy_sections" ADD CONSTRAINT "legal_pages_privacy_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."legal_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "legal_pages_terms_sections" ADD CONSTRAINT "legal_pages_terms_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."legal_pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "gallery_albums_cover_image_idx" ON "gallery_albums" USING btree ("cover_image_id");
  CREATE INDEX "gallery_albums_published_idx" ON "gallery_albums" USING btree ("published");
  CREATE INDEX "gallery_albums_updated_at_idx" ON "gallery_albums" USING btree ("updated_at");
  CREATE INDEX "gallery_albums_created_at_idx" ON "gallery_albums" USING btree ("created_at");
  CREATE INDEX "page_texts_aurix_steps_order_idx" ON "page_texts_aurix_steps" USING btree ("_order");
  CREATE INDEX "page_texts_aurix_steps_parent_id_idx" ON "page_texts_aurix_steps" USING btree ("_parent_id");
  CREATE INDEX "legal_pages_privacy_sections_order_idx" ON "legal_pages_privacy_sections" USING btree ("_order");
  CREATE INDEX "legal_pages_privacy_sections_parent_id_idx" ON "legal_pages_privacy_sections" USING btree ("_parent_id");
  CREATE INDEX "legal_pages_terms_sections_order_idx" ON "legal_pages_terms_sections" USING btree ("_order");
  CREATE INDEX "legal_pages_terms_sections_parent_id_idx" ON "legal_pages_terms_sections" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gallery_albums_fk" FOREIGN KEY ("gallery_albums_id") REFERENCES "public"."gallery_albums"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_gallery_albums_id_idx" ON "payload_locked_documents_rels" USING btree ("gallery_albums_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "gallery_albums" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_texts_aurix_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "legal_pages_privacy_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "legal_pages_terms_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "legal_pages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "gallery_albums" CASCADE;
  DROP TABLE "page_texts_aurix_steps" CASCADE;
  DROP TABLE "page_texts" CASCADE;
  DROP TABLE "legal_pages_privacy_sections" CASCADE;
  DROP TABLE "legal_pages_terms_sections" CASCADE;
  DROP TABLE "legal_pages" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_gallery_albums_fk";
  
  DROP INDEX "payload_locked_documents_rels_gallery_albums_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "gallery_albums_id";
  DROP TYPE "public"."enum_gallery_albums_category";
  DROP TYPE "public"."enum_gallery_albums_type";`)
}
