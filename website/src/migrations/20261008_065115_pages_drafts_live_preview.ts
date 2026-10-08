import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_theme" AS ENUM('krs', 'aurix');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_builtin_image" AS ENUM('aurix-logo-full');
  CREATE TYPE "public"."enum__pages_v_blocks_callout_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum__pages_v_blocks_callout_theme" AS ENUM('krs', 'aurix');
  CREATE TYPE "public"."enum__pages_v_blocks_card_grid_cards_icon" AS ENUM('cpu', 'terminal', 'trophy', 'book-open', 'layers', 'code', 'compass', 'zap', 'flame', 'rocket', 'users', 'calendar', 'map-pin', 'mail', 'phone', 'award', 'target', 'lightbulb', 'wrench', 'shield', 'globe', 'star', 'camera', 'graduation-cap', 'bot', 'circuit-board', 'gauge', 'flag', 'heart', 'clock');
  CREATE TYPE "public"."enum__pages_v_blocks_card_grid_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum__pages_v_blocks_image_text_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum__pages_v_blocks_image_text_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__pages_v_blocks_rich_text_width" AS ENUM('narrow', 'wide');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_theme" AS ENUM('krs', 'aurix');
  CREATE TYPE "public"."enum__pages_v_blocks_event_cards_variant" AS ENUM('compact', 'large');
  CREATE TYPE "public"."enum__pages_v_blocks_page_header_theme" AS ENUM('krs', 'aurix');
  CREATE TYPE "public"."enum__pages_v_blocks_page_header_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__pages_v_blocks_event_banner_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum__pages_v_blocks_team_grid_groups_group" AS ENUM('FACULTY', 'LEADERSHIP', 'ROBOTICS', 'SOFTWARE_AI', 'ELECTRONICS', 'MECHANICAL', 'MEDIA');
  CREATE TYPE "public"."enum__pages_v_blocks_notice_icon" AS ENUM('cpu', 'terminal', 'trophy', 'book-open', 'layers', 'code', 'compass', 'zap', 'flame', 'rocket', 'users', 'calendar', 'map-pin', 'mail', 'phone', 'award', 'target', 'lightbulb', 'wrench', 'shield', 'globe', 'star', 'camera', 'graduation-cap', 'bot', 'circuit-board', 'gauge', 'flag', 'heart', 'clock');
  CREATE TYPE "public"."enum__pages_v_blocks_form_fields_type" AS ENUM('text', 'email', 'tel', 'textarea', 'select');
  CREATE TYPE "public"."enum__pages_v_blocks_form_contact_items_icon" AS ENUM('cpu', 'terminal', 'trophy', 'book-open', 'layers', 'code', 'compass', 'zap', 'flame', 'rocket', 'users', 'calendar', 'map-pin', 'mail', 'phone', 'award', 'target', 'lightbulb', 'wrench', 'shield', 'globe', 'star', 'camera', 'graduation-cap', 'bot', 'circuit-board', 'gauge', 'flag', 'heart', 'clock');
  CREATE TYPE "public"."enum__pages_v_blocks_steps_theme" AS ENUM('krs', 'aurix');
  CREATE TYPE "public"."enum__pages_v_blocks_results_pending_buttons_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum__pages_v_version_spacing" AS ENUM('compact', 'roomy');
  CREATE TYPE "public"."enum__pages_v_version_width" AS ENUM('full', 'large', 'medium', 'narrow');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "_pages_v_blocks_hero_tagline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"highlight" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"style" "enum__pages_v_blocks_hero_buttons_style" DEFAULT 'primary',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "enum__pages_v_blocks_hero_theme" DEFAULT 'krs',
  	"eyebrow" varchar,
  	"title" varchar,
  	"title_accent" varchar,
  	"image_id" integer,
  	"builtin_image" "enum__pages_v_blocks_hero_builtin_image",
  	"intro" varchar,
  	"show_countdown" boolean,
  	"countdown_label" varchar DEFAULT 'Starts In',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_text_chips_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_text_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"body" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"chips_title" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_callout_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"style" "enum__pages_v_blocks_callout_buttons_style" DEFAULT 'primary',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_callout" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "enum__pages_v_blocks_callout_theme" DEFAULT 'krs',
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_card_grid_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__pages_v_blocks_card_grid_cards_icon",
  	"title" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_card_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"columns" "enum__pages_v_blocks_card_grid_columns" DEFAULT '4',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_image_text_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"style" "enum__pages_v_blocks_image_text_buttons_style" DEFAULT 'primary',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_image_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"body" varchar,
  	"image_id" integer,
  	"image_position" "enum__pages_v_blocks_image_text_image_position" DEFAULT 'right',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"content" jsonb,
  	"width" "enum__pages_v_blocks_rich_text_width" DEFAULT 'narrow',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"style" "enum__pages_v_blocks_cta_buttons_style" DEFAULT 'primary',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "enum__pages_v_blocks_cta_theme" DEFAULT 'krs',
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_featured_project" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"project_id" integer,
  	"status_label" varchar,
  	"benchmark_label" varchar,
  	"hardware_title" varchar,
  	"software_title" varchar,
  	"button_label" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_event_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"limit" numeric DEFAULT 3,
  	"featured_only" boolean,
  	"button_label" varchar DEFAULT 'View Details',
  	"fee_suffix" varchar,
  	"variant" "enum__pages_v_blocks_event_cards_variant" DEFAULT 'compact',
  	"show_prize_pool" boolean,
  	"prize_label" varchar DEFAULT 'Prize pool',
  	"team_prefix" varchar,
  	"team_fallback" varchar DEFAULT 'Team',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_resource_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"limit" numeric DEFAULT 3,
  	"by_label" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_blog_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"limit" numeric DEFAULT 2,
  	"read_label" varchar DEFAULT 'min read',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_page_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "enum__pages_v_blocks_page_header_theme" DEFAULT 'krs',
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"intro_link_label" varchar,
  	"intro_link_href" varchar,
  	"intro_after" varchar,
  	"align" "enum__pages_v_blocks_page_header_align" DEFAULT 'left',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_pills_pills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_pills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_project_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"button_label" varchar DEFAULT 'Dossier',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_resource_grid_pills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_resource_grid" (
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
  
  CREATE TABLE "_pages_v_blocks_blog_grid_pills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_blog_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"read_label" varchar DEFAULT 'min read',
  	"read_more_label" varchar DEFAULT 'Read Article',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery_grid_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"show_filter" boolean DEFAULT true,
  	"all_label" varchar DEFAULT 'All',
  	"empty_text" varchar DEFAULT 'No photos in this category yet.',
  	"photo_label" varchar,
  	"video_label" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_event_banner_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"style" "enum__pages_v_blocks_event_banner_buttons_style" DEFAULT 'primary',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_event_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"badge" varchar,
  	"title" varchar,
  	"text" varchar,
  	"show_dates" boolean DEFAULT true,
  	"venue" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team_grid_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"group" "enum__pages_v_blocks_team_grid_groups_group",
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"member_singular" varchar DEFAULT 'Member',
  	"member_plural" varchar DEFAULT 'Members',
  	"since_label" varchar DEFAULT 'Since',
  	"status_label" varchar DEFAULT 'Status:',
  	"active_label" varchar DEFAULT 'Active',
  	"alumni_label" varchar DEFAULT 'Alumni',
  	"footer_text" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_timeline_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"year" varchar,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_timeline" (
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
  
  CREATE TABLE "_pages_v_blocks_notice" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__pages_v_blocks_notice_icon",
  	"label" varchar,
  	"title" varchar,
  	"text" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_form_fields_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_form_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"type" "enum__pages_v_blocks_form_fields_type" DEFAULT 'text',
  	"required" boolean,
  	"half_width" boolean,
  	"placeholder" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_form_contact_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__pages_v_blocks_form_contact_items_icon",
  	"title" varchar,
  	"text" varchar,
  	"highlight" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"form_name" varchar,
  	"submit_label" varchar,
  	"sending_label" varchar,
  	"success_title" varchar,
  	"success_text" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "enum__pages_v_blocks_steps_theme" DEFAULT 'krs',
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_comparison_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"col_name" varchar DEFAULT 'Competition',
  	"col_team" varchar DEFAULT 'Team Composition',
  	"col_fee" varchar DEFAULT 'Registration Fee',
  	"col_prize" varchar DEFAULT 'Prize Pool',
  	"col_specs" varchar DEFAULT 'Robot Constraints',
  	"col_dates" varchar DEFAULT 'Dates',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_event_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"title_suffix" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_event_rulebooks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"badge_prefix" varchar,
  	"button_label" varchar DEFAULT 'View Full Event Page',
  	"fee_label" varchar DEFAULT 'Fee',
  	"team_label" varchar DEFAULT 'Team Size',
  	"dates_label" varchar DEFAULT 'Dates',
  	"version_label" varchar DEFAULT 'Version',
  	"version_value" varchar DEFAULT 'v1.0 (Official)',
  	"unpriced_label" varchar DEFAULT 'Unpriced',
  	"notice_label" varchar DEFAULT 'Notice:',
  	"team_fallback" varchar DEFAULT 'Team Entry',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_schedule" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"empty_text" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_results_pending_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"style" "enum__pages_v_blocks_results_pending_buttons_style" DEFAULT 'primary',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_results" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"pending_badge" varchar,
  	"pending_title" varchar,
  	"pending_text" varchar,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_status_lookup" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_registration_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"closed_text" varchar DEFAULT 'Registration is not open right now. Please check back soon.',
  	"visible_if" varchar,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_path" varchar,
  	"version_spacing" "enum__pages_v_version_spacing",
  	"version_width" "enum__pages_v_version_width",
  	"version_published" boolean DEFAULT true,
  	"version_system" boolean DEFAULT false,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_no_index" boolean,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  ALTER TABLE "pages_blocks_hero_tagline" ALTER COLUMN "item" DROP NOT NULL;
  ALTER TABLE "pages_blocks_hero_buttons" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "pages_blocks_hero_buttons" ALTER COLUMN "href" DROP NOT NULL;
  ALTER TABLE "pages_blocks_text_chips_chips" ALTER COLUMN "item" DROP NOT NULL;
  ALTER TABLE "pages_blocks_callout_buttons" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "pages_blocks_callout_buttons" ALTER COLUMN "href" DROP NOT NULL;
  ALTER TABLE "pages_blocks_card_grid_cards" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "pages_blocks_image_text_buttons" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "pages_blocks_image_text_buttons" ALTER COLUMN "href" DROP NOT NULL;
  ALTER TABLE "pages_blocks_cta_buttons" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "pages_blocks_cta_buttons" ALTER COLUMN "href" DROP NOT NULL;
  ALTER TABLE "pages_blocks_pills_pills" ALTER COLUMN "item" DROP NOT NULL;
  ALTER TABLE "pages_blocks_resource_grid_pills" ALTER COLUMN "item" DROP NOT NULL;
  ALTER TABLE "pages_blocks_blog_grid_pills" ALTER COLUMN "item" DROP NOT NULL;
  ALTER TABLE "pages_blocks_gallery_grid_categories" ALTER COLUMN "item" DROP NOT NULL;
  ALTER TABLE "pages_blocks_event_banner_buttons" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "pages_blocks_event_banner_buttons" ALTER COLUMN "href" DROP NOT NULL;
  ALTER TABLE "pages_blocks_team_grid_groups" ALTER COLUMN "group" DROP NOT NULL;
  ALTER TABLE "pages_blocks_team_grid_groups" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "pages_blocks_timeline_items" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "pages_blocks_form_fields" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "pages_blocks_form_fields" ALTER COLUMN "type" DROP NOT NULL;
  ALTER TABLE "pages_blocks_form_contact_items" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "pages_blocks_form" ALTER COLUMN "form_name" DROP NOT NULL;
  ALTER TABLE "pages_blocks_steps_steps" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "pages_blocks_results_pending_buttons" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "pages_blocks_results_pending_buttons" ALTER COLUMN "href" DROP NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "path" DROP NOT NULL;
  ALTER TABLE "pages" ADD COLUMN "_status" "enum_pages_status" DEFAULT 'draft';
  ALTER TABLE "staff_texts" ADD COLUMN "preview_badge" varchar DEFAULT 'Preview';
  ALTER TABLE "staff_texts" ADD COLUMN "preview_badge_note" varchar DEFAULT 'You are seeing drafts and hidden pages because you are logged in to the CMS. Visitors see the published site.';
  ALTER TABLE "staff_texts" ADD COLUMN "preview_exit" varchar DEFAULT 'Exit preview';
  ALTER TABLE "staff_texts" ADD COLUMN "preview_not_logged_in" varchar DEFAULT 'Log in to the CMS to see the preview.';
  ALTER TABLE "staff_texts" ADD COLUMN "preview_not_allowed" varchar DEFAULT 'Your account cannot preview this screen.';
  ALTER TABLE "staff_texts" ADD COLUMN "preview_bad_request" varchar DEFAULT 'Nothing to preview here.';
  ALTER TABLE "staff_texts" ADD COLUMN "preview_not_found" varchar DEFAULT 'This item has no page on the site yet (save it with an address first).';
  ALTER TABLE "staff_texts" ADD COLUMN "preview_too_many" varchar DEFAULT 'Too many preview requests. Please wait a minute.';
  ALTER TABLE "_pages_v_blocks_hero_tagline" ADD CONSTRAINT "_pages_v_blocks_hero_tagline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_buttons" ADD CONSTRAINT "_pages_v_blocks_hero_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text_chips_chips" ADD CONSTRAINT "_pages_v_blocks_text_chips_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_text_chips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text_chips" ADD CONSTRAINT "_pages_v_blocks_text_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_callout_buttons" ADD CONSTRAINT "_pages_v_blocks_callout_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_callout" ADD CONSTRAINT "_pages_v_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_card_grid_cards" ADD CONSTRAINT "_pages_v_blocks_card_grid_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_card_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_card_grid" ADD CONSTRAINT "_pages_v_blocks_card_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_text_buttons" ADD CONSTRAINT "_pages_v_blocks_image_text_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_image_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_text" ADD CONSTRAINT "_pages_v_blocks_image_text_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_text" ADD CONSTRAINT "_pages_v_blocks_image_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_buttons" ADD CONSTRAINT "_pages_v_blocks_cta_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_project" ADD CONSTRAINT "_pages_v_blocks_featured_project_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_project" ADD CONSTRAINT "_pages_v_blocks_featured_project_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_event_cards" ADD CONSTRAINT "_pages_v_blocks_event_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_resource_cards" ADD CONSTRAINT "_pages_v_blocks_resource_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_blog_cards" ADD CONSTRAINT "_pages_v_blocks_blog_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_header" ADD CONSTRAINT "_pages_v_blocks_page_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_pills_pills" ADD CONSTRAINT "_pages_v_blocks_pills_pills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_pills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_pills" ADD CONSTRAINT "_pages_v_blocks_pills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_project_grid" ADD CONSTRAINT "_pages_v_blocks_project_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_resource_grid_pills" ADD CONSTRAINT "_pages_v_blocks_resource_grid_pills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_resource_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_resource_grid" ADD CONSTRAINT "_pages_v_blocks_resource_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_blog_grid_pills" ADD CONSTRAINT "_pages_v_blocks_blog_grid_pills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_blog_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_blog_grid" ADD CONSTRAINT "_pages_v_blocks_blog_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_grid_categories" ADD CONSTRAINT "_pages_v_blocks_gallery_grid_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_gallery_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_grid" ADD CONSTRAINT "_pages_v_blocks_gallery_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_event_banner_buttons" ADD CONSTRAINT "_pages_v_blocks_event_banner_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_event_banner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_event_banner" ADD CONSTRAINT "_pages_v_blocks_event_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_grid_groups" ADD CONSTRAINT "_pages_v_blocks_team_grid_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_team_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_grid" ADD CONSTRAINT "_pages_v_blocks_team_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline_items" ADD CONSTRAINT "_pages_v_blocks_timeline_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline" ADD CONSTRAINT "_pages_v_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_notice" ADD CONSTRAINT "_pages_v_blocks_notice_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form_fields_options" ADD CONSTRAINT "_pages_v_blocks_form_fields_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_form_fields"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form_fields" ADD CONSTRAINT "_pages_v_blocks_form_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_form"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form_contact_items" ADD CONSTRAINT "_pages_v_blocks_form_contact_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_form"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form" ADD CONSTRAINT "_pages_v_blocks_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps_steps" ADD CONSTRAINT "_pages_v_blocks_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps" ADD CONSTRAINT "_pages_v_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_comparison_table" ADD CONSTRAINT "_pages_v_blocks_comparison_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_event_faqs" ADD CONSTRAINT "_pages_v_blocks_event_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_event_rulebooks" ADD CONSTRAINT "_pages_v_blocks_event_rulebooks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_schedule" ADD CONSTRAINT "_pages_v_blocks_schedule_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_results_pending_buttons" ADD CONSTRAINT "_pages_v_blocks_results_pending_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_results" ADD CONSTRAINT "_pages_v_blocks_results_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_status_lookup" ADD CONSTRAINT "_pages_v_blocks_status_lookup_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_registration_form" ADD CONSTRAINT "_pages_v_blocks_registration_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_pages_v_blocks_hero_tagline_order_idx" ON "_pages_v_blocks_hero_tagline" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_tagline_parent_id_idx" ON "_pages_v_blocks_hero_tagline" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_buttons_order_idx" ON "_pages_v_blocks_hero_buttons" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_buttons_parent_id_idx" ON "_pages_v_blocks_hero_buttons" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_image_idx" ON "_pages_v_blocks_hero" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_text_chips_chips_order_idx" ON "_pages_v_blocks_text_chips_chips" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_text_chips_chips_parent_id_idx" ON "_pages_v_blocks_text_chips_chips" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_text_chips_order_idx" ON "_pages_v_blocks_text_chips" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_text_chips_parent_id_idx" ON "_pages_v_blocks_text_chips" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_text_chips_path_idx" ON "_pages_v_blocks_text_chips" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_callout_buttons_order_idx" ON "_pages_v_blocks_callout_buttons" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_callout_buttons_parent_id_idx" ON "_pages_v_blocks_callout_buttons" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_callout_order_idx" ON "_pages_v_blocks_callout" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_callout_parent_id_idx" ON "_pages_v_blocks_callout" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_callout_path_idx" ON "_pages_v_blocks_callout" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_order_idx" ON "_pages_v_blocks_card_grid_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_parent_id_idx" ON "_pages_v_blocks_card_grid_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_card_grid_order_idx" ON "_pages_v_blocks_card_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_grid_parent_id_idx" ON "_pages_v_blocks_card_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_card_grid_path_idx" ON "_pages_v_blocks_card_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_text_buttons_order_idx" ON "_pages_v_blocks_image_text_buttons" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_image_text_buttons_parent_id_idx" ON "_pages_v_blocks_image_text_buttons" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_image_text_order_idx" ON "_pages_v_blocks_image_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_image_text_parent_id_idx" ON "_pages_v_blocks_image_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_image_text_path_idx" ON "_pages_v_blocks_image_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_text_image_idx" ON "_pages_v_blocks_image_text" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_buttons_order_idx" ON "_pages_v_blocks_cta_buttons" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_buttons_parent_id_idx" ON "_pages_v_blocks_cta_buttons" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "_pages_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_featured_project_order_idx" ON "_pages_v_blocks_featured_project" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_featured_project_parent_id_idx" ON "_pages_v_blocks_featured_project" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_featured_project_path_idx" ON "_pages_v_blocks_featured_project" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_featured_project_project_idx" ON "_pages_v_blocks_featured_project" USING btree ("project_id");
  CREATE INDEX "_pages_v_blocks_event_cards_order_idx" ON "_pages_v_blocks_event_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_event_cards_parent_id_idx" ON "_pages_v_blocks_event_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_event_cards_path_idx" ON "_pages_v_blocks_event_cards" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_resource_cards_order_idx" ON "_pages_v_blocks_resource_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_resource_cards_parent_id_idx" ON "_pages_v_blocks_resource_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_resource_cards_path_idx" ON "_pages_v_blocks_resource_cards" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_blog_cards_order_idx" ON "_pages_v_blocks_blog_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_blog_cards_parent_id_idx" ON "_pages_v_blocks_blog_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_blog_cards_path_idx" ON "_pages_v_blocks_blog_cards" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_page_header_order_idx" ON "_pages_v_blocks_page_header" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_page_header_parent_id_idx" ON "_pages_v_blocks_page_header" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_page_header_path_idx" ON "_pages_v_blocks_page_header" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_pills_pills_order_idx" ON "_pages_v_blocks_pills_pills" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_pills_pills_parent_id_idx" ON "_pages_v_blocks_pills_pills" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_pills_order_idx" ON "_pages_v_blocks_pills" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_pills_parent_id_idx" ON "_pages_v_blocks_pills" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_pills_path_idx" ON "_pages_v_blocks_pills" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_project_grid_order_idx" ON "_pages_v_blocks_project_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_project_grid_parent_id_idx" ON "_pages_v_blocks_project_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_project_grid_path_idx" ON "_pages_v_blocks_project_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_resource_grid_pills_order_idx" ON "_pages_v_blocks_resource_grid_pills" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_resource_grid_pills_parent_id_idx" ON "_pages_v_blocks_resource_grid_pills" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_resource_grid_order_idx" ON "_pages_v_blocks_resource_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_resource_grid_parent_id_idx" ON "_pages_v_blocks_resource_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_resource_grid_path_idx" ON "_pages_v_blocks_resource_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_blog_grid_pills_order_idx" ON "_pages_v_blocks_blog_grid_pills" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_blog_grid_pills_parent_id_idx" ON "_pages_v_blocks_blog_grid_pills" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_blog_grid_order_idx" ON "_pages_v_blocks_blog_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_blog_grid_parent_id_idx" ON "_pages_v_blocks_blog_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_blog_grid_path_idx" ON "_pages_v_blocks_blog_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_gallery_grid_categories_order_idx" ON "_pages_v_blocks_gallery_grid_categories" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_grid_categories_parent_id_idx" ON "_pages_v_blocks_gallery_grid_categories" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_grid_order_idx" ON "_pages_v_blocks_gallery_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_grid_parent_id_idx" ON "_pages_v_blocks_gallery_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_grid_path_idx" ON "_pages_v_blocks_gallery_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_event_banner_buttons_order_idx" ON "_pages_v_blocks_event_banner_buttons" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_event_banner_buttons_parent_id_idx" ON "_pages_v_blocks_event_banner_buttons" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_event_banner_order_idx" ON "_pages_v_blocks_event_banner" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_event_banner_parent_id_idx" ON "_pages_v_blocks_event_banner" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_event_banner_path_idx" ON "_pages_v_blocks_event_banner" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_team_grid_groups_order_idx" ON "_pages_v_blocks_team_grid_groups" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_grid_groups_parent_id_idx" ON "_pages_v_blocks_team_grid_groups" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_grid_order_idx" ON "_pages_v_blocks_team_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_grid_parent_id_idx" ON "_pages_v_blocks_team_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_grid_path_idx" ON "_pages_v_blocks_team_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_timeline_items_order_idx" ON "_pages_v_blocks_timeline_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_timeline_items_parent_id_idx" ON "_pages_v_blocks_timeline_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_order_idx" ON "_pages_v_blocks_timeline" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_timeline_parent_id_idx" ON "_pages_v_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_path_idx" ON "_pages_v_blocks_timeline" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_notice_order_idx" ON "_pages_v_blocks_notice" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_notice_parent_id_idx" ON "_pages_v_blocks_notice" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_notice_path_idx" ON "_pages_v_blocks_notice" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_form_fields_options_order_idx" ON "_pages_v_blocks_form_fields_options" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_form_fields_options_parent_id_idx" ON "_pages_v_blocks_form_fields_options" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_form_fields_order_idx" ON "_pages_v_blocks_form_fields" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_form_fields_parent_id_idx" ON "_pages_v_blocks_form_fields" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_form_contact_items_order_idx" ON "_pages_v_blocks_form_contact_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_form_contact_items_parent_id_idx" ON "_pages_v_blocks_form_contact_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_form_order_idx" ON "_pages_v_blocks_form" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_form_parent_id_idx" ON "_pages_v_blocks_form" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_form_path_idx" ON "_pages_v_blocks_form" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_steps_steps_order_idx" ON "_pages_v_blocks_steps_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_steps_steps_parent_id_idx" ON "_pages_v_blocks_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_order_idx" ON "_pages_v_blocks_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_steps_parent_id_idx" ON "_pages_v_blocks_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_path_idx" ON "_pages_v_blocks_steps" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_comparison_table_order_idx" ON "_pages_v_blocks_comparison_table" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_comparison_table_parent_id_idx" ON "_pages_v_blocks_comparison_table" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_comparison_table_path_idx" ON "_pages_v_blocks_comparison_table" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_event_faqs_order_idx" ON "_pages_v_blocks_event_faqs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_event_faqs_parent_id_idx" ON "_pages_v_blocks_event_faqs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_event_faqs_path_idx" ON "_pages_v_blocks_event_faqs" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_event_rulebooks_order_idx" ON "_pages_v_blocks_event_rulebooks" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_event_rulebooks_parent_id_idx" ON "_pages_v_blocks_event_rulebooks" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_event_rulebooks_path_idx" ON "_pages_v_blocks_event_rulebooks" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_schedule_order_idx" ON "_pages_v_blocks_schedule" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_schedule_parent_id_idx" ON "_pages_v_blocks_schedule" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_schedule_path_idx" ON "_pages_v_blocks_schedule" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_results_pending_buttons_order_idx" ON "_pages_v_blocks_results_pending_buttons" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_results_pending_buttons_parent_id_idx" ON "_pages_v_blocks_results_pending_buttons" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_results_order_idx" ON "_pages_v_blocks_results" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_results_parent_id_idx" ON "_pages_v_blocks_results" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_results_path_idx" ON "_pages_v_blocks_results" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_status_lookup_order_idx" ON "_pages_v_blocks_status_lookup" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_status_lookup_parent_id_idx" ON "_pages_v_blocks_status_lookup" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_status_lookup_path_idx" ON "_pages_v_blocks_status_lookup" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_registration_form_order_idx" ON "_pages_v_blocks_registration_form" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_registration_form_parent_id_idx" ON "_pages_v_blocks_registration_form" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_registration_form_path_idx" ON "_pages_v_blocks_registration_form" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_path_idx" ON "_pages_v" USING btree ("version_path");
  CREATE INDEX "_pages_v_version_seo_version_seo_image_idx" ON "_pages_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");`)
  // Data step (owner-approved plan, docs/LIVE_PREVIEW_PLAN.md §3): the new _status column defaults to 'draft', which would
  // count every existing page as never published and hide it from visitors. Every page that exists today is live, so
  // mark them all published. New rows created later get their status from Payload (draft / publish).
  await db.execute(sql`UPDATE "pages" SET "_status" = 'published' WHERE "_status" IS DISTINCT FROM 'published';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_pages_v_blocks_hero_tagline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hero_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_text_chips_chips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_text_chips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_callout_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_callout" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_card_grid_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_card_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_image_text_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_image_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cta_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_featured_project" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_event_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_resource_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_blog_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_page_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_pills_pills" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_pills" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_project_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_resource_grid_pills" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_resource_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_blog_grid_pills" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_blog_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_gallery_grid_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_gallery_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_event_banner_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_event_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_team_grid_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_team_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_timeline_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_timeline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_notice" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_form_fields_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_form_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_form_contact_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_form" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_steps_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_comparison_table" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_event_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_event_rulebooks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_schedule" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_results_pending_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_results" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_status_lookup" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_registration_form" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_pages_v_blocks_hero_tagline" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_buttons" CASCADE;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_text_chips_chips" CASCADE;
  DROP TABLE "_pages_v_blocks_text_chips" CASCADE;
  DROP TABLE "_pages_v_blocks_callout_buttons" CASCADE;
  DROP TABLE "_pages_v_blocks_callout" CASCADE;
  DROP TABLE "_pages_v_blocks_card_grid_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_card_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_image_text_buttons" CASCADE;
  DROP TABLE "_pages_v_blocks_image_text" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "_pages_v_blocks_cta_buttons" CASCADE;
  DROP TABLE "_pages_v_blocks_cta" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_project" CASCADE;
  DROP TABLE "_pages_v_blocks_event_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_resource_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_blog_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_page_header" CASCADE;
  DROP TABLE "_pages_v_blocks_pills_pills" CASCADE;
  DROP TABLE "_pages_v_blocks_pills" CASCADE;
  DROP TABLE "_pages_v_blocks_project_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_resource_grid_pills" CASCADE;
  DROP TABLE "_pages_v_blocks_resource_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_blog_grid_pills" CASCADE;
  DROP TABLE "_pages_v_blocks_blog_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery_grid_categories" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_event_banner_buttons" CASCADE;
  DROP TABLE "_pages_v_blocks_event_banner" CASCADE;
  DROP TABLE "_pages_v_blocks_team_grid_groups" CASCADE;
  DROP TABLE "_pages_v_blocks_team_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline_items" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline" CASCADE;
  DROP TABLE "_pages_v_blocks_notice" CASCADE;
  DROP TABLE "_pages_v_blocks_form_fields_options" CASCADE;
  DROP TABLE "_pages_v_blocks_form_fields" CASCADE;
  DROP TABLE "_pages_v_blocks_form_contact_items" CASCADE;
  DROP TABLE "_pages_v_blocks_form" CASCADE;
  DROP TABLE "_pages_v_blocks_steps_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_comparison_table" CASCADE;
  DROP TABLE "_pages_v_blocks_event_faqs" CASCADE;
  DROP TABLE "_pages_v_blocks_event_rulebooks" CASCADE;
  DROP TABLE "_pages_v_blocks_schedule" CASCADE;
  DROP TABLE "_pages_v_blocks_results_pending_buttons" CASCADE;
  DROP TABLE "_pages_v_blocks_results" CASCADE;
  DROP TABLE "_pages_v_blocks_status_lookup" CASCADE;
  DROP TABLE "_pages_v_blocks_registration_form" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP INDEX "pages__status_idx";
  ALTER TABLE "pages_blocks_hero_tagline" ALTER COLUMN "item" SET NOT NULL;
  ALTER TABLE "pages_blocks_hero_buttons" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "pages_blocks_hero_buttons" ALTER COLUMN "href" SET NOT NULL;
  ALTER TABLE "pages_blocks_text_chips_chips" ALTER COLUMN "item" SET NOT NULL;
  ALTER TABLE "pages_blocks_callout_buttons" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "pages_blocks_callout_buttons" ALTER COLUMN "href" SET NOT NULL;
  ALTER TABLE "pages_blocks_card_grid_cards" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "pages_blocks_image_text_buttons" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "pages_blocks_image_text_buttons" ALTER COLUMN "href" SET NOT NULL;
  ALTER TABLE "pages_blocks_cta_buttons" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "pages_blocks_cta_buttons" ALTER COLUMN "href" SET NOT NULL;
  ALTER TABLE "pages_blocks_pills_pills" ALTER COLUMN "item" SET NOT NULL;
  ALTER TABLE "pages_blocks_resource_grid_pills" ALTER COLUMN "item" SET NOT NULL;
  ALTER TABLE "pages_blocks_blog_grid_pills" ALTER COLUMN "item" SET NOT NULL;
  ALTER TABLE "pages_blocks_gallery_grid_categories" ALTER COLUMN "item" SET NOT NULL;
  ALTER TABLE "pages_blocks_event_banner_buttons" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "pages_blocks_event_banner_buttons" ALTER COLUMN "href" SET NOT NULL;
  ALTER TABLE "pages_blocks_team_grid_groups" ALTER COLUMN "group" SET NOT NULL;
  ALTER TABLE "pages_blocks_team_grid_groups" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "pages_blocks_timeline_items" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "pages_blocks_form_fields" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "pages_blocks_form_fields" ALTER COLUMN "type" SET NOT NULL;
  ALTER TABLE "pages_blocks_form_contact_items" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "pages_blocks_form" ALTER COLUMN "form_name" SET NOT NULL;
  ALTER TABLE "pages_blocks_steps_steps" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "pages_blocks_results_pending_buttons" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "pages_blocks_results_pending_buttons" ALTER COLUMN "href" SET NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "path" SET NOT NULL;
  ALTER TABLE "pages" DROP COLUMN "_status";
  ALTER TABLE "staff_texts" DROP COLUMN "preview_badge";
  ALTER TABLE "staff_texts" DROP COLUMN "preview_badge_note";
  ALTER TABLE "staff_texts" DROP COLUMN "preview_exit";
  ALTER TABLE "staff_texts" DROP COLUMN "preview_not_logged_in";
  ALTER TABLE "staff_texts" DROP COLUMN "preview_not_allowed";
  ALTER TABLE "staff_texts" DROP COLUMN "preview_bad_request";
  ALTER TABLE "staff_texts" DROP COLUMN "preview_not_found";
  ALTER TABLE "staff_texts" DROP COLUMN "preview_too_many";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_hero_buttons_style";
  DROP TYPE "public"."enum__pages_v_blocks_hero_theme";
  DROP TYPE "public"."enum__pages_v_blocks_hero_builtin_image";
  DROP TYPE "public"."enum__pages_v_blocks_callout_buttons_style";
  DROP TYPE "public"."enum__pages_v_blocks_callout_theme";
  DROP TYPE "public"."enum__pages_v_blocks_card_grid_cards_icon";
  DROP TYPE "public"."enum__pages_v_blocks_card_grid_columns";
  DROP TYPE "public"."enum__pages_v_blocks_image_text_buttons_style";
  DROP TYPE "public"."enum__pages_v_blocks_image_text_image_position";
  DROP TYPE "public"."enum__pages_v_blocks_rich_text_width";
  DROP TYPE "public"."enum__pages_v_blocks_cta_buttons_style";
  DROP TYPE "public"."enum__pages_v_blocks_cta_theme";
  DROP TYPE "public"."enum__pages_v_blocks_event_cards_variant";
  DROP TYPE "public"."enum__pages_v_blocks_page_header_theme";
  DROP TYPE "public"."enum__pages_v_blocks_page_header_align";
  DROP TYPE "public"."enum__pages_v_blocks_event_banner_buttons_style";
  DROP TYPE "public"."enum__pages_v_blocks_team_grid_groups_group";
  DROP TYPE "public"."enum__pages_v_blocks_notice_icon";
  DROP TYPE "public"."enum__pages_v_blocks_form_fields_type";
  DROP TYPE "public"."enum__pages_v_blocks_form_contact_items_icon";
  DROP TYPE "public"."enum__pages_v_blocks_steps_theme";
  DROP TYPE "public"."enum__pages_v_blocks_results_pending_buttons_style";
  DROP TYPE "public"."enum__pages_v_version_spacing";
  DROP TYPE "public"."enum__pages_v_version_width";
  DROP TYPE "public"."enum__pages_v_version_status";`)
}
