import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_orbit_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum_pages_blocks_hero_orbit_orbit_cards_icon" AS ENUM('cpu', 'terminal', 'trophy', 'book-open', 'layers', 'code', 'compass', 'zap', 'flame', 'rocket', 'users', 'calendar', 'map-pin', 'mail', 'phone', 'award', 'target', 'lightbulb', 'wrench', 'shield', 'globe', 'star', 'camera', 'graduation-cap', 'bot', 'circuit-board', 'gauge', 'flag', 'heart', 'clock');
  CREATE TYPE "public"."enum_pages_blocks_hero_orbit_theme" AS ENUM('krs', 'aurix');
  CREATE TYPE "public"."enum_pages_blocks_introduction_pillars_icon" AS ENUM('cpu', 'terminal', 'trophy', 'book-open', 'layers', 'code', 'compass', 'zap', 'flame', 'rocket', 'users', 'calendar', 'map-pin', 'mail', 'phone', 'award', 'target', 'lightbulb', 'wrench', 'shield', 'globe', 'star', 'camera', 'graduation-cap', 'bot', 'circuit-board', 'gauge', 'flag', 'heart', 'clock');
  CREATE TYPE "public"."enum_pages_blocks_flagship_event_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_orbit_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_orbit_orbit_cards_icon" AS ENUM('cpu', 'terminal', 'trophy', 'book-open', 'layers', 'code', 'compass', 'zap', 'flame', 'rocket', 'users', 'calendar', 'map-pin', 'mail', 'phone', 'award', 'target', 'lightbulb', 'wrench', 'shield', 'globe', 'star', 'camera', 'graduation-cap', 'bot', 'circuit-board', 'gauge', 'flag', 'heart', 'clock');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_orbit_theme" AS ENUM('krs', 'aurix');
  CREATE TYPE "public"."enum__pages_v_blocks_introduction_pillars_icon" AS ENUM('cpu', 'terminal', 'trophy', 'book-open', 'layers', 'code', 'compass', 'zap', 'flame', 'rocket', 'users', 'calendar', 'map-pin', 'mail', 'phone', 'award', 'target', 'lightbulb', 'wrench', 'shield', 'globe', 'star', 'camera', 'graduation-cap', 'bot', 'circuit-board', 'gauge', 'flag', 'heart', 'clock');
  CREATE TYPE "public"."enum__pages_v_blocks_flagship_event_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TABLE "pages_blocks_hero_orbit_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"style" "enum_pages_blocks_hero_orbit_buttons_style" DEFAULT 'primary'
  );
  
  CREATE TABLE "pages_blocks_hero_orbit_orbit_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_pages_blocks_hero_orbit_orbit_cards_icon",
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_hero_orbit" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"theme" "enum_pages_blocks_hero_orbit_theme" DEFAULT 'krs',
  	"eyebrow" varchar,
  	"title" varchar,
  	"title_accent" varchar,
  	"intro" varchar,
  	"image_id" integer,
  	"stat_value" varchar,
  	"stat_label" varchar,
  	"note_top" varchar DEFAULT '— Less wires.',
  	"note_bottom" varchar DEFAULT 'More robots.',
  	"badge_text" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_introduction_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_pages_blocks_introduction_pillars_icon",
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_introduction_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "pages_blocks_introduction" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT '01 // Institutional Foundation',
  	"title" varchar DEFAULT 'Pioneering',
  	"title_accent" varchar DEFAULT 'Applied Robotics',
  	"intro" varchar DEFAULT 'Kalam Robotics Society (KRS) is the premier multidisciplinary student robotics and cyber-physical systems laboratory at IILM University, Greater Noida.',
  	"image_id" integer,
  	"image_alt" varchar,
  	"image_badge" varchar,
  	"image_caption_title" varchar,
  	"image_caption_text" varchar,
  	"note" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_disciplines_cards_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "pages_blocks_disciplines_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"caption" varchar,
  	"back_title" varchar,
  	"back_text" varchar,
  	"link_label" varchar,
  	"link_href" varchar
  );
  
  CREATE TABLE "pages_blocks_disciplines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT '02 // Operational Pillars',
  	"title" varchar DEFAULT 'Engineering Rigor',
  	"title_accent" varchar DEFAULT 'in Every Discipline',
  	"intro" varchar DEFAULT 'Kalam Robotics Society is built for ambitious engineers ready to design, prototype, and compete across robotics disciplines.',
  	"flip_hint" varchar DEFAULT 'Flip for details',
  	"back_badge" varchar DEFAULT 'Details',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_flagship_event_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "pages_blocks_flagship_event_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"style" "enum_pages_blocks_flagship_event_buttons_style" DEFAULT 'primary'
  );
  
  CREATE TABLE "pages_blocks_flagship_event" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Featured Event',
  	"heading" varchar DEFAULT 'Upcoming',
  	"heading_accent" varchar DEFAULT 'Event',
  	"intro" varchar DEFAULT 'Don''t miss our biggest event of the season. Register now to secure your spot!',
  	"image_id" integer,
  	"image_alt" varchar,
  	"image_badge" varchar DEFAULT 'AURIX 2026',
  	"tag" varchar DEFAULT 'Robotics & AI',
  	"location" varchar DEFAULT '{venue}',
  	"title" varchar DEFAULT 'AURIX 2026: National Robotics Arena & AI Challenge',
  	"date_text" varchar DEFAULT '{dates}',
  	"time_text" varchar,
  	"organizers" varchar DEFAULT 'Organised by Kalam Robotics Society',
  	"price_label" varchar DEFAULT 'Registration',
  	"price_text" varchar DEFAULT 'From {minFee}',
  	"price_note" varchar DEFAULT '/ team',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_competitions_hub" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT '04 // AURIX 2026 Series',
  	"title" varchar DEFAULT 'The Competition',
  	"title_accent" varchar DEFAULT 'Toolkit',
  	"intro" varchar DEFAULT 'Five competitions, one arena day at IILM University. Pick your challenge.',
  	"centre_badge" varchar DEFAULT 'National Arena',
  	"centre_title" varchar DEFAULT 'The AURIX',
  	"centre_accent" varchar DEFAULT 'Core',
  	"centre_text" varchar DEFAULT '{dates} · {prizePool} prize pool',
  	"centre_button_label" varchar DEFAULT 'Enter Arena',
  	"centre_button_href" varchar DEFAULT '/aurix',
  	"card_link_label" varchar DEFAULT 'View challenge details',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero_orbit_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"style" "enum__pages_v_blocks_hero_orbit_buttons_style" DEFAULT 'primary',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero_orbit_orbit_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__pages_v_blocks_hero_orbit_orbit_cards_icon",
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero_orbit" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "enum__pages_v_blocks_hero_orbit_theme" DEFAULT 'krs',
  	"eyebrow" varchar,
  	"title" varchar,
  	"title_accent" varchar,
  	"intro" varchar,
  	"image_id" integer,
  	"stat_value" varchar,
  	"stat_label" varchar,
  	"note_top" varchar DEFAULT '— Less wires.',
  	"note_bottom" varchar DEFAULT 'More robots.',
  	"badge_text" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_introduction_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__pages_v_blocks_introduction_pillars_icon",
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_introduction_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_introduction" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT '01 // Institutional Foundation',
  	"title" varchar DEFAULT 'Pioneering',
  	"title_accent" varchar DEFAULT 'Applied Robotics',
  	"intro" varchar DEFAULT 'Kalam Robotics Society (KRS) is the premier multidisciplinary student robotics and cyber-physical systems laboratory at IILM University, Greater Noida.',
  	"image_id" integer,
  	"image_alt" varchar,
  	"image_badge" varchar,
  	"image_caption_title" varchar,
  	"image_caption_text" varchar,
  	"note" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_disciplines_cards_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_disciplines_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"caption" varchar,
  	"back_title" varchar,
  	"back_text" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_disciplines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT '02 // Operational Pillars',
  	"title" varchar DEFAULT 'Engineering Rigor',
  	"title_accent" varchar DEFAULT 'in Every Discipline',
  	"intro" varchar DEFAULT 'Kalam Robotics Society is built for ambitious engineers ready to design, prototype, and compete across robotics disciplines.',
  	"flip_hint" varchar DEFAULT 'Flip for details',
  	"back_badge" varchar DEFAULT 'Details',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_flagship_event_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_flagship_event_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"style" "enum__pages_v_blocks_flagship_event_buttons_style" DEFAULT 'primary',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_flagship_event" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Featured Event',
  	"heading" varchar DEFAULT 'Upcoming',
  	"heading_accent" varchar DEFAULT 'Event',
  	"intro" varchar DEFAULT 'Don''t miss our biggest event of the season. Register now to secure your spot!',
  	"image_id" integer,
  	"image_alt" varchar,
  	"image_badge" varchar DEFAULT 'AURIX 2026',
  	"tag" varchar DEFAULT 'Robotics & AI',
  	"location" varchar DEFAULT '{venue}',
  	"title" varchar DEFAULT 'AURIX 2026: National Robotics Arena & AI Challenge',
  	"date_text" varchar DEFAULT '{dates}',
  	"time_text" varchar,
  	"organizers" varchar DEFAULT 'Organised by Kalam Robotics Society',
  	"price_label" varchar DEFAULT 'Registration',
  	"price_text" varchar DEFAULT 'From {minFee}',
  	"price_note" varchar DEFAULT '/ team',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_competitions_hub" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT '04 // AURIX 2026 Series',
  	"title" varchar DEFAULT 'The Competition',
  	"title_accent" varchar DEFAULT 'Toolkit',
  	"intro" varchar DEFAULT 'Five competitions, one arena day at IILM University. Pick your challenge.',
  	"centre_badge" varchar DEFAULT 'National Arena',
  	"centre_title" varchar DEFAULT 'The AURIX',
  	"centre_accent" varchar DEFAULT 'Core',
  	"centre_text" varchar DEFAULT '{dates} · {prizePool} prize pool',
  	"centre_button_label" varchar DEFAULT 'Enter Arena',
  	"centre_button_href" varchar DEFAULT '/aurix',
  	"card_link_label" varchar DEFAULT 'View challenge details',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "form_texts" ADD COLUMN "general_scroll_top_button" varchar DEFAULT 'Scroll to top of page';
  ALTER TABLE "pages_blocks_hero_orbit_buttons" ADD CONSTRAINT "pages_blocks_hero_orbit_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero_orbit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_orbit_orbit_cards" ADD CONSTRAINT "pages_blocks_hero_orbit_orbit_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero_orbit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_orbit" ADD CONSTRAINT "pages_blocks_hero_orbit_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_orbit" ADD CONSTRAINT "pages_blocks_hero_orbit_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_introduction_pillars" ADD CONSTRAINT "pages_blocks_introduction_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_introduction"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_introduction_chips" ADD CONSTRAINT "pages_blocks_introduction_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_introduction"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_introduction" ADD CONSTRAINT "pages_blocks_introduction_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_introduction" ADD CONSTRAINT "pages_blocks_introduction_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_disciplines_cards_specs" ADD CONSTRAINT "pages_blocks_disciplines_cards_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_disciplines_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_disciplines_cards" ADD CONSTRAINT "pages_blocks_disciplines_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_disciplines_cards" ADD CONSTRAINT "pages_blocks_disciplines_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_disciplines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_disciplines" ADD CONSTRAINT "pages_blocks_disciplines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_flagship_event_bullets" ADD CONSTRAINT "pages_blocks_flagship_event_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_flagship_event"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_flagship_event_buttons" ADD CONSTRAINT "pages_blocks_flagship_event_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_flagship_event"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_flagship_event" ADD CONSTRAINT "pages_blocks_flagship_event_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_flagship_event" ADD CONSTRAINT "pages_blocks_flagship_event_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_competitions_hub" ADD CONSTRAINT "pages_blocks_competitions_hub_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_orbit_buttons" ADD CONSTRAINT "_pages_v_blocks_hero_orbit_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero_orbit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_orbit_orbit_cards" ADD CONSTRAINT "_pages_v_blocks_hero_orbit_orbit_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero_orbit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_orbit" ADD CONSTRAINT "_pages_v_blocks_hero_orbit_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_orbit" ADD CONSTRAINT "_pages_v_blocks_hero_orbit_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_introduction_pillars" ADD CONSTRAINT "_pages_v_blocks_introduction_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_introduction"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_introduction_chips" ADD CONSTRAINT "_pages_v_blocks_introduction_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_introduction"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_introduction" ADD CONSTRAINT "_pages_v_blocks_introduction_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_introduction" ADD CONSTRAINT "_pages_v_blocks_introduction_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_disciplines_cards_specs" ADD CONSTRAINT "_pages_v_blocks_disciplines_cards_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_disciplines_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_disciplines_cards" ADD CONSTRAINT "_pages_v_blocks_disciplines_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_disciplines_cards" ADD CONSTRAINT "_pages_v_blocks_disciplines_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_disciplines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_disciplines" ADD CONSTRAINT "_pages_v_blocks_disciplines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_flagship_event_bullets" ADD CONSTRAINT "_pages_v_blocks_flagship_event_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_flagship_event"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_flagship_event_buttons" ADD CONSTRAINT "_pages_v_blocks_flagship_event_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_flagship_event"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_flagship_event" ADD CONSTRAINT "_pages_v_blocks_flagship_event_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_flagship_event" ADD CONSTRAINT "_pages_v_blocks_flagship_event_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_competitions_hub" ADD CONSTRAINT "_pages_v_blocks_competitions_hub_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_orbit_buttons_order_idx" ON "pages_blocks_hero_orbit_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_orbit_buttons_parent_id_idx" ON "pages_blocks_hero_orbit_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_orbit_orbit_cards_order_idx" ON "pages_blocks_hero_orbit_orbit_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_orbit_orbit_cards_parent_id_idx" ON "pages_blocks_hero_orbit_orbit_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_orbit_order_idx" ON "pages_blocks_hero_orbit" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_orbit_parent_id_idx" ON "pages_blocks_hero_orbit" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_orbit_path_idx" ON "pages_blocks_hero_orbit" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_orbit_image_idx" ON "pages_blocks_hero_orbit" USING btree ("image_id");
  CREATE INDEX "pages_blocks_introduction_pillars_order_idx" ON "pages_blocks_introduction_pillars" USING btree ("_order");
  CREATE INDEX "pages_blocks_introduction_pillars_parent_id_idx" ON "pages_blocks_introduction_pillars" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_introduction_chips_order_idx" ON "pages_blocks_introduction_chips" USING btree ("_order");
  CREATE INDEX "pages_blocks_introduction_chips_parent_id_idx" ON "pages_blocks_introduction_chips" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_introduction_order_idx" ON "pages_blocks_introduction" USING btree ("_order");
  CREATE INDEX "pages_blocks_introduction_parent_id_idx" ON "pages_blocks_introduction" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_introduction_path_idx" ON "pages_blocks_introduction" USING btree ("_path");
  CREATE INDEX "pages_blocks_introduction_image_idx" ON "pages_blocks_introduction" USING btree ("image_id");
  CREATE INDEX "pages_blocks_disciplines_cards_specs_order_idx" ON "pages_blocks_disciplines_cards_specs" USING btree ("_order");
  CREATE INDEX "pages_blocks_disciplines_cards_specs_parent_id_idx" ON "pages_blocks_disciplines_cards_specs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_disciplines_cards_order_idx" ON "pages_blocks_disciplines_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_disciplines_cards_parent_id_idx" ON "pages_blocks_disciplines_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_disciplines_cards_image_idx" ON "pages_blocks_disciplines_cards" USING btree ("image_id");
  CREATE INDEX "pages_blocks_disciplines_order_idx" ON "pages_blocks_disciplines" USING btree ("_order");
  CREATE INDEX "pages_blocks_disciplines_parent_id_idx" ON "pages_blocks_disciplines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_disciplines_path_idx" ON "pages_blocks_disciplines" USING btree ("_path");
  CREATE INDEX "pages_blocks_flagship_event_bullets_order_idx" ON "pages_blocks_flagship_event_bullets" USING btree ("_order");
  CREATE INDEX "pages_blocks_flagship_event_bullets_parent_id_idx" ON "pages_blocks_flagship_event_bullets" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_flagship_event_buttons_order_idx" ON "pages_blocks_flagship_event_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_flagship_event_buttons_parent_id_idx" ON "pages_blocks_flagship_event_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_flagship_event_order_idx" ON "pages_blocks_flagship_event" USING btree ("_order");
  CREATE INDEX "pages_blocks_flagship_event_parent_id_idx" ON "pages_blocks_flagship_event" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_flagship_event_path_idx" ON "pages_blocks_flagship_event" USING btree ("_path");
  CREATE INDEX "pages_blocks_flagship_event_image_idx" ON "pages_blocks_flagship_event" USING btree ("image_id");
  CREATE INDEX "pages_blocks_competitions_hub_order_idx" ON "pages_blocks_competitions_hub" USING btree ("_order");
  CREATE INDEX "pages_blocks_competitions_hub_parent_id_idx" ON "pages_blocks_competitions_hub" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_competitions_hub_path_idx" ON "pages_blocks_competitions_hub" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_orbit_buttons_order_idx" ON "_pages_v_blocks_hero_orbit_buttons" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_orbit_buttons_parent_id_idx" ON "_pages_v_blocks_hero_orbit_buttons" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_orbit_orbit_cards_order_idx" ON "_pages_v_blocks_hero_orbit_orbit_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_orbit_orbit_cards_parent_id_idx" ON "_pages_v_blocks_hero_orbit_orbit_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_orbit_order_idx" ON "_pages_v_blocks_hero_orbit" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_orbit_parent_id_idx" ON "_pages_v_blocks_hero_orbit" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_orbit_path_idx" ON "_pages_v_blocks_hero_orbit" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_orbit_image_idx" ON "_pages_v_blocks_hero_orbit" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_introduction_pillars_order_idx" ON "_pages_v_blocks_introduction_pillars" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_introduction_pillars_parent_id_idx" ON "_pages_v_blocks_introduction_pillars" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_introduction_chips_order_idx" ON "_pages_v_blocks_introduction_chips" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_introduction_chips_parent_id_idx" ON "_pages_v_blocks_introduction_chips" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_introduction_order_idx" ON "_pages_v_blocks_introduction" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_introduction_parent_id_idx" ON "_pages_v_blocks_introduction" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_introduction_path_idx" ON "_pages_v_blocks_introduction" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_introduction_image_idx" ON "_pages_v_blocks_introduction" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_disciplines_cards_specs_order_idx" ON "_pages_v_blocks_disciplines_cards_specs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_disciplines_cards_specs_parent_id_idx" ON "_pages_v_blocks_disciplines_cards_specs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_disciplines_cards_order_idx" ON "_pages_v_blocks_disciplines_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_disciplines_cards_parent_id_idx" ON "_pages_v_blocks_disciplines_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_disciplines_cards_image_idx" ON "_pages_v_blocks_disciplines_cards" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_disciplines_order_idx" ON "_pages_v_blocks_disciplines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_disciplines_parent_id_idx" ON "_pages_v_blocks_disciplines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_disciplines_path_idx" ON "_pages_v_blocks_disciplines" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_flagship_event_bullets_order_idx" ON "_pages_v_blocks_flagship_event_bullets" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_flagship_event_bullets_parent_id_idx" ON "_pages_v_blocks_flagship_event_bullets" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_flagship_event_buttons_order_idx" ON "_pages_v_blocks_flagship_event_buttons" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_flagship_event_buttons_parent_id_idx" ON "_pages_v_blocks_flagship_event_buttons" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_flagship_event_order_idx" ON "_pages_v_blocks_flagship_event" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_flagship_event_parent_id_idx" ON "_pages_v_blocks_flagship_event" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_flagship_event_path_idx" ON "_pages_v_blocks_flagship_event" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_flagship_event_image_idx" ON "_pages_v_blocks_flagship_event" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_competitions_hub_order_idx" ON "_pages_v_blocks_competitions_hub" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_competitions_hub_parent_id_idx" ON "_pages_v_blocks_competitions_hub" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_competitions_hub_path_idx" ON "_pages_v_blocks_competitions_hub" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_hero_orbit_buttons" CASCADE;
  DROP TABLE "pages_blocks_hero_orbit_orbit_cards" CASCADE;
  DROP TABLE "pages_blocks_hero_orbit" CASCADE;
  DROP TABLE "pages_blocks_introduction_pillars" CASCADE;
  DROP TABLE "pages_blocks_introduction_chips" CASCADE;
  DROP TABLE "pages_blocks_introduction" CASCADE;
  DROP TABLE "pages_blocks_disciplines_cards_specs" CASCADE;
  DROP TABLE "pages_blocks_disciplines_cards" CASCADE;
  DROP TABLE "pages_blocks_disciplines" CASCADE;
  DROP TABLE "pages_blocks_flagship_event_bullets" CASCADE;
  DROP TABLE "pages_blocks_flagship_event_buttons" CASCADE;
  DROP TABLE "pages_blocks_flagship_event" CASCADE;
  DROP TABLE "pages_blocks_competitions_hub" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_orbit_buttons" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_orbit_orbit_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_orbit" CASCADE;
  DROP TABLE "_pages_v_blocks_introduction_pillars" CASCADE;
  DROP TABLE "_pages_v_blocks_introduction_chips" CASCADE;
  DROP TABLE "_pages_v_blocks_introduction" CASCADE;
  DROP TABLE "_pages_v_blocks_disciplines_cards_specs" CASCADE;
  DROP TABLE "_pages_v_blocks_disciplines_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_disciplines" CASCADE;
  DROP TABLE "_pages_v_blocks_flagship_event_bullets" CASCADE;
  DROP TABLE "_pages_v_blocks_flagship_event_buttons" CASCADE;
  DROP TABLE "_pages_v_blocks_flagship_event" CASCADE;
  DROP TABLE "_pages_v_blocks_competitions_hub" CASCADE;
  ALTER TABLE "form_texts" DROP COLUMN "general_scroll_top_button";
  DROP TYPE "public"."enum_pages_blocks_hero_orbit_buttons_style";
  DROP TYPE "public"."enum_pages_blocks_hero_orbit_orbit_cards_icon";
  DROP TYPE "public"."enum_pages_blocks_hero_orbit_theme";
  DROP TYPE "public"."enum_pages_blocks_introduction_pillars_icon";
  DROP TYPE "public"."enum_pages_blocks_flagship_event_buttons_style";
  DROP TYPE "public"."enum__pages_v_blocks_hero_orbit_buttons_style";
  DROP TYPE "public"."enum__pages_v_blocks_hero_orbit_orbit_cards_icon";
  DROP TYPE "public"."enum__pages_v_blocks_hero_orbit_theme";
  DROP TYPE "public"."enum__pages_v_blocks_introduction_pillars_icon";
  DROP TYPE "public"."enum__pages_v_blocks_flagship_event_buttons_style";`)
}
