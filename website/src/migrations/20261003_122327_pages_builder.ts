import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum_pages_blocks_hero_theme" AS ENUM('krs', 'aurix');
  CREATE TYPE "public"."enum_pages_blocks_callout_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum_pages_blocks_callout_theme" AS ENUM('krs', 'aurix');
  CREATE TYPE "public"."enum_pages_blocks_card_grid_cards_icon" AS ENUM('cpu', 'terminal', 'trophy', 'book-open', 'layers', 'code', 'compass', 'zap', 'flame', 'rocket', 'users', 'calendar', 'map-pin', 'mail', 'phone', 'award', 'target', 'lightbulb', 'wrench', 'shield', 'globe', 'star', 'camera', 'graduation-cap', 'bot', 'circuit-board', 'gauge', 'flag', 'heart', 'clock');
  CREATE TYPE "public"."enum_pages_blocks_card_grid_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum_pages_blocks_image_text_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum_pages_blocks_image_text_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_pages_blocks_rich_text_width" AS ENUM('narrow', 'wide');
  CREATE TYPE "public"."enum_pages_blocks_cta_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum_pages_blocks_cta_theme" AS ENUM('krs', 'aurix');
  CREATE TABLE "pages_blocks_hero_tagline" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_hero_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"style" "enum_pages_blocks_hero_buttons_style" DEFAULT 'primary'
  );
  
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"theme" "enum_pages_blocks_hero_theme" DEFAULT 'krs',
  	"eyebrow" varchar,
  	"title" varchar,
  	"title_accent" varchar,
  	"intro" varchar,
  	"show_countdown" boolean,
  	"countdown_label" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_text_chips_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_text_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"body" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"chips_title" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_callout_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"style" "enum_pages_blocks_callout_buttons_style" DEFAULT 'primary'
  );
  
  CREATE TABLE "pages_blocks_callout" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"theme" "enum_pages_blocks_callout_theme" DEFAULT 'krs',
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_card_grid_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_pages_blocks_card_grid_cards_icon",
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"link_label" varchar,
  	"link_href" varchar
  );
  
  CREATE TABLE "pages_blocks_card_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"columns" "enum_pages_blocks_card_grid_columns" DEFAULT '4',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_image_text_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"style" "enum_pages_blocks_image_text_buttons_style" DEFAULT 'primary'
  );
  
  CREATE TABLE "pages_blocks_image_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"body" varchar,
  	"image_id" integer,
  	"image_position" "enum_pages_blocks_image_text_image_position" DEFAULT 'right',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"content" jsonb,
  	"width" "enum_pages_blocks_rich_text_width" DEFAULT 'narrow',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"style" "enum_pages_blocks_cta_buttons_style" DEFAULT 'primary'
  );
  
  CREATE TABLE "pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"theme" "enum_pages_blocks_cta_theme" DEFAULT 'krs',
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_featured_project" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"project_id" integer,
  	"status_label" varchar,
  	"benchmark_label" varchar,
  	"hardware_title" varchar,
  	"software_title" varchar,
  	"button_label" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_event_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"limit" numeric DEFAULT 3,
  	"featured_only" boolean,
  	"button_label" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_resource_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"limit" numeric DEFAULT 3,
  	"by_label" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_blog_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"limit" numeric DEFAULT 2,
  	"read_label" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"published" boolean DEFAULT true,
  	"system" boolean DEFAULT false,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"seo_no_index" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "pages_blocks_hero_tagline" ADD CONSTRAINT "pages_blocks_hero_tagline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_buttons" ADD CONSTRAINT "pages_blocks_hero_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_text_chips_chips" ADD CONSTRAINT "pages_blocks_text_chips_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_text_chips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_text_chips" ADD CONSTRAINT "pages_blocks_text_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_callout_buttons" ADD CONSTRAINT "pages_blocks_callout_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_callout" ADD CONSTRAINT "pages_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_card_grid_cards" ADD CONSTRAINT "pages_blocks_card_grid_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_card_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_card_grid" ADD CONSTRAINT "pages_blocks_card_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_text_buttons" ADD CONSTRAINT "pages_blocks_image_text_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_image_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_text" ADD CONSTRAINT "pages_blocks_image_text_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_text" ADD CONSTRAINT "pages_blocks_image_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_buttons" ADD CONSTRAINT "pages_blocks_cta_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_project" ADD CONSTRAINT "pages_blocks_featured_project_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_project" ADD CONSTRAINT "pages_blocks_featured_project_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_event_cards" ADD CONSTRAINT "pages_blocks_event_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_resource_cards" ADD CONSTRAINT "pages_blocks_resource_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_blog_cards" ADD CONSTRAINT "pages_blocks_blog_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_tagline_order_idx" ON "pages_blocks_hero_tagline" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_tagline_parent_id_idx" ON "pages_blocks_hero_tagline" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_buttons_order_idx" ON "pages_blocks_hero_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_buttons_parent_id_idx" ON "pages_blocks_hero_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_text_chips_chips_order_idx" ON "pages_blocks_text_chips_chips" USING btree ("_order");
  CREATE INDEX "pages_blocks_text_chips_chips_parent_id_idx" ON "pages_blocks_text_chips_chips" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_text_chips_order_idx" ON "pages_blocks_text_chips" USING btree ("_order");
  CREATE INDEX "pages_blocks_text_chips_parent_id_idx" ON "pages_blocks_text_chips" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_text_chips_path_idx" ON "pages_blocks_text_chips" USING btree ("_path");
  CREATE INDEX "pages_blocks_callout_buttons_order_idx" ON "pages_blocks_callout_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_callout_buttons_parent_id_idx" ON "pages_blocks_callout_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_callout_order_idx" ON "pages_blocks_callout" USING btree ("_order");
  CREATE INDEX "pages_blocks_callout_parent_id_idx" ON "pages_blocks_callout" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_callout_path_idx" ON "pages_blocks_callout" USING btree ("_path");
  CREATE INDEX "pages_blocks_card_grid_cards_order_idx" ON "pages_blocks_card_grid_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_card_grid_cards_parent_id_idx" ON "pages_blocks_card_grid_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_card_grid_order_idx" ON "pages_blocks_card_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_card_grid_parent_id_idx" ON "pages_blocks_card_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_card_grid_path_idx" ON "pages_blocks_card_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_text_buttons_order_idx" ON "pages_blocks_image_text_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_text_buttons_parent_id_idx" ON "pages_blocks_image_text_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_text_order_idx" ON "pages_blocks_image_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_text_parent_id_idx" ON "pages_blocks_image_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_text_path_idx" ON "pages_blocks_image_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_text_image_idx" ON "pages_blocks_image_text" USING btree ("image_id");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_buttons_order_idx" ON "pages_blocks_cta_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_buttons_parent_id_idx" ON "pages_blocks_cta_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_featured_project_order_idx" ON "pages_blocks_featured_project" USING btree ("_order");
  CREATE INDEX "pages_blocks_featured_project_parent_id_idx" ON "pages_blocks_featured_project" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_featured_project_path_idx" ON "pages_blocks_featured_project" USING btree ("_path");
  CREATE INDEX "pages_blocks_featured_project_project_idx" ON "pages_blocks_featured_project" USING btree ("project_id");
  CREATE INDEX "pages_blocks_event_cards_order_idx" ON "pages_blocks_event_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_event_cards_parent_id_idx" ON "pages_blocks_event_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_event_cards_path_idx" ON "pages_blocks_event_cards" USING btree ("_path");
  CREATE INDEX "pages_blocks_resource_cards_order_idx" ON "pages_blocks_resource_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_resource_cards_parent_id_idx" ON "pages_blocks_resource_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_resource_cards_path_idx" ON "pages_blocks_resource_cards" USING btree ("_path");
  CREATE INDEX "pages_blocks_blog_cards_order_idx" ON "pages_blocks_blog_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_blog_cards_parent_id_idx" ON "pages_blocks_blog_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_blog_cards_path_idx" ON "pages_blocks_blog_cards" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_path_idx" ON "pages" USING btree ("path");
  CREATE INDEX "pages_seo_seo_image_idx" ON "pages" USING btree ("seo_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero_tagline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_hero_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_text_chips_chips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_text_chips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_callout_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_callout" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_card_grid_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_card_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_image_text_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_image_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cta_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_featured_project" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_event_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_resource_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_blog_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_hero_tagline" CASCADE;
  DROP TABLE "pages_blocks_hero_buttons" CASCADE;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_text_chips_chips" CASCADE;
  DROP TABLE "pages_blocks_text_chips" CASCADE;
  DROP TABLE "pages_blocks_callout_buttons" CASCADE;
  DROP TABLE "pages_blocks_callout" CASCADE;
  DROP TABLE "pages_blocks_card_grid_cards" CASCADE;
  DROP TABLE "pages_blocks_card_grid" CASCADE;
  DROP TABLE "pages_blocks_image_text_buttons" CASCADE;
  DROP TABLE "pages_blocks_image_text" CASCADE;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_cta_buttons" CASCADE;
  DROP TABLE "pages_blocks_cta" CASCADE;
  DROP TABLE "pages_blocks_featured_project" CASCADE;
  DROP TABLE "pages_blocks_event_cards" CASCADE;
  DROP TABLE "pages_blocks_resource_cards" CASCADE;
  DROP TABLE "pages_blocks_blog_cards" CASCADE;
  DROP TABLE "pages" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";
  
  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  DROP TYPE "public"."enum_pages_blocks_hero_buttons_style";
  DROP TYPE "public"."enum_pages_blocks_hero_theme";
  DROP TYPE "public"."enum_pages_blocks_callout_buttons_style";
  DROP TYPE "public"."enum_pages_blocks_callout_theme";
  DROP TYPE "public"."enum_pages_blocks_card_grid_cards_icon";
  DROP TYPE "public"."enum_pages_blocks_card_grid_columns";
  DROP TYPE "public"."enum_pages_blocks_image_text_buttons_style";
  DROP TYPE "public"."enum_pages_blocks_image_text_image_position";
  DROP TYPE "public"."enum_pages_blocks_rich_text_width";
  DROP TYPE "public"."enum_pages_blocks_cta_buttons_style";
  DROP TYPE "public"."enum_pages_blocks_cta_theme";`)
}
