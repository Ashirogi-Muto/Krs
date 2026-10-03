import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_page_header_theme" AS ENUM('krs', 'aurix');
  CREATE TYPE "public"."enum_pages_blocks_event_banner_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum_pages_blocks_team_grid_groups_group" AS ENUM('FACULTY', 'LEADERSHIP', 'ROBOTICS', 'SOFTWARE_AI', 'ELECTRONICS', 'MECHANICAL', 'MEDIA');
  CREATE TYPE "public"."enum_pages_blocks_notice_icon" AS ENUM('cpu', 'terminal', 'trophy', 'book-open', 'layers', 'code', 'compass', 'zap', 'flame', 'rocket', 'users', 'calendar', 'map-pin', 'mail', 'phone', 'award', 'target', 'lightbulb', 'wrench', 'shield', 'globe', 'star', 'camera', 'graduation-cap', 'bot', 'circuit-board', 'gauge', 'flag', 'heart', 'clock');
  CREATE TYPE "public"."enum_pages_blocks_form_fields_type" AS ENUM('text', 'email', 'tel', 'textarea', 'select');
  CREATE TYPE "public"."enum_pages_blocks_form_contact_items_icon" AS ENUM('cpu', 'terminal', 'trophy', 'book-open', 'layers', 'code', 'compass', 'zap', 'flame', 'rocket', 'users', 'calendar', 'map-pin', 'mail', 'phone', 'award', 'target', 'lightbulb', 'wrench', 'shield', 'globe', 'star', 'camera', 'graduation-cap', 'bot', 'circuit-board', 'gauge', 'flag', 'heart', 'clock');
  CREATE TYPE "public"."enum_pages_spacing" AS ENUM('compact', 'roomy');
  CREATE TYPE "public"."enum_pages_width" AS ENUM('full', 'narrow');
  CREATE TABLE "pages_blocks_page_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"theme" "enum_pages_blocks_page_header_theme" DEFAULT 'krs',
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_pills_pills" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_pills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_project_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"button_label" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_resource_grid_pills" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_resource_grid" (
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
  
  CREATE TABLE "pages_blocks_blog_grid_pills" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_blog_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"read_label" varchar,
  	"read_more_label" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_gallery_grid_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_gallery_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"show_filter" boolean DEFAULT true,
  	"all_label" varchar,
  	"empty_text" varchar,
  	"photo_label" varchar,
  	"video_label" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_event_banner_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"style" "enum_pages_blocks_event_banner_buttons_style" DEFAULT 'primary'
  );
  
  CREATE TABLE "pages_blocks_event_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"badge" varchar,
  	"title" varchar,
  	"text" varchar,
  	"show_dates" boolean DEFAULT true,
  	"venue" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_team_grid_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"group" "enum_pages_blocks_team_grid_groups_group" NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_team_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"member_singular" varchar,
  	"member_plural" varchar,
  	"since_label" varchar,
  	"status_label" varchar,
  	"active_label" varchar,
  	"alumni_label" varchar,
  	"footer_text" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_timeline_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year" varchar,
  	"title" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "pages_blocks_timeline" (
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
  
  CREATE TABLE "pages_blocks_notice" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_pages_blocks_notice_icon",
  	"label" varchar,
  	"title" varchar,
  	"text" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_form_fields_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "pages_blocks_form_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"type" "enum_pages_blocks_form_fields_type" DEFAULT 'text' NOT NULL,
  	"required" boolean,
  	"half_width" boolean,
  	"placeholder" varchar
  );
  
  CREATE TABLE "pages_blocks_form_contact_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_pages_blocks_form_contact_items_icon",
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"highlight" varchar
  );
  
  CREATE TABLE "pages_blocks_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"form_name" varchar NOT NULL,
  	"submit_label" varchar,
  	"sending_label" varchar,
  	"success_title" varchar,
  	"success_text" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "form_submissions_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE "form_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"form_name" varchar NOT NULL,
  	"page" varchar,
  	"summary" varchar,
  	"handled" boolean DEFAULT false,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pages_blocks_event_cards" ADD COLUMN "fee_suffix" varchar;
  ALTER TABLE "pages" ADD COLUMN "spacing" "enum_pages_spacing";
  ALTER TABLE "pages" ADD COLUMN "width" "enum_pages_width";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "form_submissions_id" integer;
  ALTER TABLE "pages_blocks_page_header" ADD CONSTRAINT "pages_blocks_page_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_pills_pills" ADD CONSTRAINT "pages_blocks_pills_pills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_pills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_pills" ADD CONSTRAINT "pages_blocks_pills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_project_grid" ADD CONSTRAINT "pages_blocks_project_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_resource_grid_pills" ADD CONSTRAINT "pages_blocks_resource_grid_pills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_resource_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_resource_grid" ADD CONSTRAINT "pages_blocks_resource_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_blog_grid_pills" ADD CONSTRAINT "pages_blocks_blog_grid_pills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_blog_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_blog_grid" ADD CONSTRAINT "pages_blocks_blog_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_grid_categories" ADD CONSTRAINT "pages_blocks_gallery_grid_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_gallery_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_grid" ADD CONSTRAINT "pages_blocks_gallery_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_event_banner_buttons" ADD CONSTRAINT "pages_blocks_event_banner_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_event_banner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_event_banner" ADD CONSTRAINT "pages_blocks_event_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_grid_groups" ADD CONSTRAINT "pages_blocks_team_grid_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_team_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_grid" ADD CONSTRAINT "pages_blocks_team_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_timeline_items" ADD CONSTRAINT "pages_blocks_timeline_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_timeline" ADD CONSTRAINT "pages_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_notice" ADD CONSTRAINT "pages_blocks_notice_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_form_fields_options" ADD CONSTRAINT "pages_blocks_form_fields_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_form_fields"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_form_fields" ADD CONSTRAINT "pages_blocks_form_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_form"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_form_contact_items" ADD CONSTRAINT "pages_blocks_form_contact_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_form"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_form" ADD CONSTRAINT "pages_blocks_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "form_submissions_answers" ADD CONSTRAINT "form_submissions_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_page_header_order_idx" ON "pages_blocks_page_header" USING btree ("_order");
  CREATE INDEX "pages_blocks_page_header_parent_id_idx" ON "pages_blocks_page_header" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_page_header_path_idx" ON "pages_blocks_page_header" USING btree ("_path");
  CREATE INDEX "pages_blocks_pills_pills_order_idx" ON "pages_blocks_pills_pills" USING btree ("_order");
  CREATE INDEX "pages_blocks_pills_pills_parent_id_idx" ON "pages_blocks_pills_pills" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pills_order_idx" ON "pages_blocks_pills" USING btree ("_order");
  CREATE INDEX "pages_blocks_pills_parent_id_idx" ON "pages_blocks_pills" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pills_path_idx" ON "pages_blocks_pills" USING btree ("_path");
  CREATE INDEX "pages_blocks_project_grid_order_idx" ON "pages_blocks_project_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_project_grid_parent_id_idx" ON "pages_blocks_project_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_project_grid_path_idx" ON "pages_blocks_project_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_resource_grid_pills_order_idx" ON "pages_blocks_resource_grid_pills" USING btree ("_order");
  CREATE INDEX "pages_blocks_resource_grid_pills_parent_id_idx" ON "pages_blocks_resource_grid_pills" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_resource_grid_order_idx" ON "pages_blocks_resource_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_resource_grid_parent_id_idx" ON "pages_blocks_resource_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_resource_grid_path_idx" ON "pages_blocks_resource_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_blog_grid_pills_order_idx" ON "pages_blocks_blog_grid_pills" USING btree ("_order");
  CREATE INDEX "pages_blocks_blog_grid_pills_parent_id_idx" ON "pages_blocks_blog_grid_pills" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_blog_grid_order_idx" ON "pages_blocks_blog_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_blog_grid_parent_id_idx" ON "pages_blocks_blog_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_blog_grid_path_idx" ON "pages_blocks_blog_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_gallery_grid_categories_order_idx" ON "pages_blocks_gallery_grid_categories" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_grid_categories_parent_id_idx" ON "pages_blocks_gallery_grid_categories" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_grid_order_idx" ON "pages_blocks_gallery_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_grid_parent_id_idx" ON "pages_blocks_gallery_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_grid_path_idx" ON "pages_blocks_gallery_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_event_banner_buttons_order_idx" ON "pages_blocks_event_banner_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_event_banner_buttons_parent_id_idx" ON "pages_blocks_event_banner_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_event_banner_order_idx" ON "pages_blocks_event_banner" USING btree ("_order");
  CREATE INDEX "pages_blocks_event_banner_parent_id_idx" ON "pages_blocks_event_banner" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_event_banner_path_idx" ON "pages_blocks_event_banner" USING btree ("_path");
  CREATE INDEX "pages_blocks_team_grid_groups_order_idx" ON "pages_blocks_team_grid_groups" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_grid_groups_parent_id_idx" ON "pages_blocks_team_grid_groups" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_grid_order_idx" ON "pages_blocks_team_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_grid_parent_id_idx" ON "pages_blocks_team_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_grid_path_idx" ON "pages_blocks_team_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_timeline_items_order_idx" ON "pages_blocks_timeline_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_timeline_items_parent_id_idx" ON "pages_blocks_timeline_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_timeline_order_idx" ON "pages_blocks_timeline" USING btree ("_order");
  CREATE INDEX "pages_blocks_timeline_parent_id_idx" ON "pages_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_timeline_path_idx" ON "pages_blocks_timeline" USING btree ("_path");
  CREATE INDEX "pages_blocks_notice_order_idx" ON "pages_blocks_notice" USING btree ("_order");
  CREATE INDEX "pages_blocks_notice_parent_id_idx" ON "pages_blocks_notice" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_notice_path_idx" ON "pages_blocks_notice" USING btree ("_path");
  CREATE INDEX "pages_blocks_form_fields_options_order_idx" ON "pages_blocks_form_fields_options" USING btree ("_order");
  CREATE INDEX "pages_blocks_form_fields_options_parent_id_idx" ON "pages_blocks_form_fields_options" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_form_fields_order_idx" ON "pages_blocks_form_fields" USING btree ("_order");
  CREATE INDEX "pages_blocks_form_fields_parent_id_idx" ON "pages_blocks_form_fields" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_form_contact_items_order_idx" ON "pages_blocks_form_contact_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_form_contact_items_parent_id_idx" ON "pages_blocks_form_contact_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_form_order_idx" ON "pages_blocks_form" USING btree ("_order");
  CREATE INDEX "pages_blocks_form_parent_id_idx" ON "pages_blocks_form" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_form_path_idx" ON "pages_blocks_form" USING btree ("_path");
  CREATE INDEX "form_submissions_answers_order_idx" ON "form_submissions_answers" USING btree ("_order");
  CREATE INDEX "form_submissions_answers_parent_id_idx" ON "form_submissions_answers" USING btree ("_parent_id");
  CREATE INDEX "form_submissions_updated_at_idx" ON "form_submissions" USING btree ("updated_at");
  CREATE INDEX "form_submissions_created_at_idx" ON "form_submissions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_form_submissions_fk" FOREIGN KEY ("form_submissions_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_form_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("form_submissions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_page_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_pills_pills" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_pills" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_project_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_resource_grid_pills" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_resource_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_blog_grid_pills" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_blog_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_gallery_grid_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_gallery_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_event_banner_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_event_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_team_grid_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_team_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_timeline_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_timeline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_notice" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_form_fields_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_form_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_form_contact_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_form" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "form_submissions_answers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "form_submissions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_page_header" CASCADE;
  DROP TABLE "pages_blocks_pills_pills" CASCADE;
  DROP TABLE "pages_blocks_pills" CASCADE;
  DROP TABLE "pages_blocks_project_grid" CASCADE;
  DROP TABLE "pages_blocks_resource_grid_pills" CASCADE;
  DROP TABLE "pages_blocks_resource_grid" CASCADE;
  DROP TABLE "pages_blocks_blog_grid_pills" CASCADE;
  DROP TABLE "pages_blocks_blog_grid" CASCADE;
  DROP TABLE "pages_blocks_gallery_grid_categories" CASCADE;
  DROP TABLE "pages_blocks_gallery_grid" CASCADE;
  DROP TABLE "pages_blocks_event_banner_buttons" CASCADE;
  DROP TABLE "pages_blocks_event_banner" CASCADE;
  DROP TABLE "pages_blocks_team_grid_groups" CASCADE;
  DROP TABLE "pages_blocks_team_grid" CASCADE;
  DROP TABLE "pages_blocks_timeline_items" CASCADE;
  DROP TABLE "pages_blocks_timeline" CASCADE;
  DROP TABLE "pages_blocks_notice" CASCADE;
  DROP TABLE "pages_blocks_form_fields_options" CASCADE;
  DROP TABLE "pages_blocks_form_fields" CASCADE;
  DROP TABLE "pages_blocks_form_contact_items" CASCADE;
  DROP TABLE "pages_blocks_form" CASCADE;
  DROP TABLE "form_submissions_answers" CASCADE;
  DROP TABLE "form_submissions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_form_submissions_fk";
  
  DROP INDEX "payload_locked_documents_rels_form_submissions_id_idx";
  ALTER TABLE "pages_blocks_event_cards" DROP COLUMN "fee_suffix";
  ALTER TABLE "pages" DROP COLUMN "spacing";
  ALTER TABLE "pages" DROP COLUMN "width";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "form_submissions_id";
  DROP TYPE "public"."enum_pages_blocks_page_header_theme";
  DROP TYPE "public"."enum_pages_blocks_event_banner_buttons_style";
  DROP TYPE "public"."enum_pages_blocks_team_grid_groups_group";
  DROP TYPE "public"."enum_pages_blocks_notice_icon";
  DROP TYPE "public"."enum_pages_blocks_form_fields_type";
  DROP TYPE "public"."enum_pages_blocks_form_contact_items_icon";
  DROP TYPE "public"."enum_pages_spacing";
  DROP TYPE "public"."enum_pages_width";`)
}
