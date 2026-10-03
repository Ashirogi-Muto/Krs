import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_builtin_image" AS ENUM('aurix-logo-full');
  CREATE TYPE "public"."enum_pages_blocks_event_cards_variant" AS ENUM('compact', 'large');
  CREATE TYPE "public"."enum_pages_blocks_page_header_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_pages_blocks_steps_theme" AS ENUM('krs', 'aurix');
  CREATE TYPE "public"."enum_pages_blocks_results_pending_buttons_style" AS ENUM('primary', 'secondary', 'link');
  ALTER TYPE "public"."enum_pages_width" ADD VALUE 'large' BEFORE 'narrow';
  ALTER TYPE "public"."enum_pages_width" ADD VALUE 'medium' BEFORE 'narrow';
  CREATE TABLE "pages_blocks_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"theme" "enum_pages_blocks_steps_theme" DEFAULT 'krs',
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_comparison_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"col_name" varchar,
  	"col_team" varchar,
  	"col_fee" varchar,
  	"col_prize" varchar,
  	"col_specs" varchar,
  	"col_dates" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_event_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"title_suffix" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_event_rulebooks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"badge_prefix" varchar,
  	"button_label" varchar,
  	"fee_label" varchar,
  	"team_label" varchar,
  	"dates_label" varchar,
  	"version_label" varchar,
  	"version_value" varchar,
  	"unpriced_label" varchar,
  	"notice_label" varchar,
  	"team_fallback" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_schedule" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"empty_text" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_results_pending_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"style" "enum_pages_blocks_results_pending_buttons_style" DEFAULT 'primary'
  );
  
  CREATE TABLE "pages_blocks_results" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"pending_badge" varchar,
  	"pending_title" varchar,
  	"pending_text" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_status_lookup" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_registration_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"closed_text" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "event_page_labels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status_label" varchar,
  	"countdown_label" varchar,
  	"stat_date" varchar,
  	"stat_venue" varchar,
  	"venue_value" varchar,
  	"stat_team" varchar,
  	"stat_fee" varchar,
  	"fee_suffix" varchar,
  	"unpriced" varchar,
  	"stat_prize" varchar,
  	"prize_tba" varchar,
  	"rules_button" varchar,
  	"footage_button" varchar,
  	"notice_title" varchar,
  	"cta_open" varchar,
  	"cta_closed" varchar,
  	"cta_live" varchar,
  	"cta_results_pending" varchar,
  	"cta_results" varchar,
  	"cta_archived" varchar,
  	"cta_announced" varchar,
  	"cta_title" varchar,
  	"cta_text" varchar,
  	"overview_eyebrow" varchar,
  	"overview_title" varchar,
  	"eligibility_label" varchar,
  	"tracks_eyebrow" varchar,
  	"tracks_title" varchar,
  	"tracks_intro" varchar,
  	"track_label" varchar,
  	"target_focus" varchar,
  	"rounds_eyebrow" varchar,
  	"rounds_title" varchar,
  	"round_label" varchar,
  	"submission_label" varchar,
  	"schedule_eyebrow" varchar,
  	"schedule_title" varchar,
  	"rubric_eyebrow" varchar,
  	"rubric_title" varchar,
  	"criterion_label" varchar,
  	"marks_label" varchar,
  	"rules_eyebrow" varchar,
  	"rules_title" varchar,
  	"faq_eyebrow" varchar,
  	"faq_title" varchar,
  	"coming_soon_text" varchar,
  	"coming_soon_prize" varchar,
  	"coming_soon_button" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pages_blocks_hero_tagline" ADD COLUMN "highlight" boolean;
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "image_id" integer;
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "builtin_image" "enum_pages_blocks_hero_builtin_image";
  ALTER TABLE "pages_blocks_event_cards" ADD COLUMN "variant" "enum_pages_blocks_event_cards_variant" DEFAULT 'compact';
  ALTER TABLE "pages_blocks_event_cards" ADD COLUMN "show_prize_pool" boolean;
  ALTER TABLE "pages_blocks_event_cards" ADD COLUMN "prize_label" varchar;
  ALTER TABLE "pages_blocks_event_cards" ADD COLUMN "team_prefix" varchar;
  ALTER TABLE "pages_blocks_event_cards" ADD COLUMN "team_fallback" varchar;
  ALTER TABLE "pages_blocks_page_header" ADD COLUMN "intro_link_label" varchar;
  ALTER TABLE "pages_blocks_page_header" ADD COLUMN "intro_link_href" varchar;
  ALTER TABLE "pages_blocks_page_header" ADD COLUMN "intro_after" varchar;
  ALTER TABLE "pages_blocks_page_header" ADD COLUMN "align" "enum_pages_blocks_page_header_align" DEFAULT 'left';
  ALTER TABLE "pages_blocks_steps_steps" ADD CONSTRAINT "pages_blocks_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps" ADD CONSTRAINT "pages_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_comparison_table" ADD CONSTRAINT "pages_blocks_comparison_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_event_faqs" ADD CONSTRAINT "pages_blocks_event_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_event_rulebooks" ADD CONSTRAINT "pages_blocks_event_rulebooks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_schedule" ADD CONSTRAINT "pages_blocks_schedule_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_results_pending_buttons" ADD CONSTRAINT "pages_blocks_results_pending_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_results" ADD CONSTRAINT "pages_blocks_results_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_status_lookup" ADD CONSTRAINT "pages_blocks_status_lookup_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_registration_form" ADD CONSTRAINT "pages_blocks_registration_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_steps_steps_order_idx" ON "pages_blocks_steps_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_steps_steps_parent_id_idx" ON "pages_blocks_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_steps_order_idx" ON "pages_blocks_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_steps_parent_id_idx" ON "pages_blocks_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_steps_path_idx" ON "pages_blocks_steps" USING btree ("_path");
  CREATE INDEX "pages_blocks_comparison_table_order_idx" ON "pages_blocks_comparison_table" USING btree ("_order");
  CREATE INDEX "pages_blocks_comparison_table_parent_id_idx" ON "pages_blocks_comparison_table" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_comparison_table_path_idx" ON "pages_blocks_comparison_table" USING btree ("_path");
  CREATE INDEX "pages_blocks_event_faqs_order_idx" ON "pages_blocks_event_faqs" USING btree ("_order");
  CREATE INDEX "pages_blocks_event_faqs_parent_id_idx" ON "pages_blocks_event_faqs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_event_faqs_path_idx" ON "pages_blocks_event_faqs" USING btree ("_path");
  CREATE INDEX "pages_blocks_event_rulebooks_order_idx" ON "pages_blocks_event_rulebooks" USING btree ("_order");
  CREATE INDEX "pages_blocks_event_rulebooks_parent_id_idx" ON "pages_blocks_event_rulebooks" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_event_rulebooks_path_idx" ON "pages_blocks_event_rulebooks" USING btree ("_path");
  CREATE INDEX "pages_blocks_schedule_order_idx" ON "pages_blocks_schedule" USING btree ("_order");
  CREATE INDEX "pages_blocks_schedule_parent_id_idx" ON "pages_blocks_schedule" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_schedule_path_idx" ON "pages_blocks_schedule" USING btree ("_path");
  CREATE INDEX "pages_blocks_results_pending_buttons_order_idx" ON "pages_blocks_results_pending_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_results_pending_buttons_parent_id_idx" ON "pages_blocks_results_pending_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_results_order_idx" ON "pages_blocks_results" USING btree ("_order");
  CREATE INDEX "pages_blocks_results_parent_id_idx" ON "pages_blocks_results" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_results_path_idx" ON "pages_blocks_results" USING btree ("_path");
  CREATE INDEX "pages_blocks_status_lookup_order_idx" ON "pages_blocks_status_lookup" USING btree ("_order");
  CREATE INDEX "pages_blocks_status_lookup_parent_id_idx" ON "pages_blocks_status_lookup" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_status_lookup_path_idx" ON "pages_blocks_status_lookup" USING btree ("_path");
  CREATE INDEX "pages_blocks_registration_form_order_idx" ON "pages_blocks_registration_form" USING btree ("_order");
  CREATE INDEX "pages_blocks_registration_form_parent_id_idx" ON "pages_blocks_registration_form" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_registration_form_path_idx" ON "pages_blocks_registration_form" USING btree ("_path");
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_image_idx" ON "pages_blocks_hero" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_steps_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_comparison_table" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_event_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_event_rulebooks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_schedule" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_results_pending_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_results" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_status_lookup" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_registration_form" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_page_labels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_steps_steps" CASCADE;
  DROP TABLE "pages_blocks_steps" CASCADE;
  DROP TABLE "pages_blocks_comparison_table" CASCADE;
  DROP TABLE "pages_blocks_event_faqs" CASCADE;
  DROP TABLE "pages_blocks_event_rulebooks" CASCADE;
  DROP TABLE "pages_blocks_schedule" CASCADE;
  DROP TABLE "pages_blocks_results_pending_buttons" CASCADE;
  DROP TABLE "pages_blocks_results" CASCADE;
  DROP TABLE "pages_blocks_status_lookup" CASCADE;
  DROP TABLE "pages_blocks_registration_form" CASCADE;
  DROP TABLE "event_page_labels" CASCADE;
  ALTER TABLE "pages_blocks_hero" DROP CONSTRAINT "pages_blocks_hero_image_id_media_id_fk";
  
  ALTER TABLE "pages" ALTER COLUMN "width" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_width";
  CREATE TYPE "public"."enum_pages_width" AS ENUM('full', 'narrow');
  ALTER TABLE "pages" ALTER COLUMN "width" SET DATA TYPE "public"."enum_pages_width" USING "width"::"public"."enum_pages_width";
  DROP INDEX "pages_blocks_hero_image_idx";
  ALTER TABLE "pages_blocks_hero_tagline" DROP COLUMN "highlight";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "image_id";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "builtin_image";
  ALTER TABLE "pages_blocks_event_cards" DROP COLUMN "variant";
  ALTER TABLE "pages_blocks_event_cards" DROP COLUMN "show_prize_pool";
  ALTER TABLE "pages_blocks_event_cards" DROP COLUMN "prize_label";
  ALTER TABLE "pages_blocks_event_cards" DROP COLUMN "team_prefix";
  ALTER TABLE "pages_blocks_event_cards" DROP COLUMN "team_fallback";
  ALTER TABLE "pages_blocks_page_header" DROP COLUMN "intro_link_label";
  ALTER TABLE "pages_blocks_page_header" DROP COLUMN "intro_link_href";
  ALTER TABLE "pages_blocks_page_header" DROP COLUMN "intro_after";
  ALTER TABLE "pages_blocks_page_header" DROP COLUMN "align";
  DROP TYPE "public"."enum_pages_blocks_hero_builtin_image";
  DROP TYPE "public"."enum_pages_blocks_event_cards_variant";
  DROP TYPE "public"."enum_pages_blocks_page_header_align";
  DROP TYPE "public"."enum_pages_blocks_steps_theme";
  DROP TYPE "public"."enum_pages_blocks_results_pending_buttons_style";`)
}
