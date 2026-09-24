import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'ORGANIZER', 'JUDGE', 'PARTICIPANT');
  CREATE TYPE "public"."enum_events_rounds_submission_type" AS ENUM('PROPOSAL', 'CODE_AND_DEMO', 'PRESENTATION', 'IN_PERSON_DEMO');
  CREATE TYPE "public"."enum_events_series" AS ENUM('AURIX', 'KRS');
  CREATE TYPE "public"."enum_events_event_type" AS ENUM('HACKATHON', 'ROBO_SOCCER', 'ROBO_RACE', 'ROBO_EXPO', 'ROBO_IDEATHON', 'WORKSHOP', 'OTHER');
  CREATE TYPE "public"."enum_events_status" AS ENUM('DRAFT', 'ANNOUNCED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'JUDGING', 'RESULTS_PENDING', 'RESULTS_PUBLISHED', 'ARCHIVED');
  CREATE TYPE "public"."enum_teams_status" AS ENUM('OPEN', 'FULL', 'LOCKED', 'DISQUALIFIED');
  CREATE TYPE "public"."enum_team_members_role" AS ENUM('LEAD', 'MEMBER');
  CREATE TYPE "public"."enum_team_members_status" AS ENUM('ACTIVE', 'INVITED');
  CREATE TYPE "public"."enum_registrations_status" AS ENUM('DRAFT', 'PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED');
  CREATE TYPE "public"."enum_registrations_payment_status" AS ENUM('UNPAID', 'PENDING', 'PAID', 'REFUNDED');
  CREATE TYPE "public"."enum_submissions_status" AS ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'QUALIFIED', 'NOT_QUALIFIED', 'FINALIST', 'LOCKED');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('COMPLETED', 'IN_PROGRESS', 'CONCEPT');
  CREATE TYPE "public"."enum_posts_category" AS ENUM('Robotics', 'AI', 'Electronics', 'Project Stories', 'Tutorials', 'Event Recaps', 'Club News');
  CREATE TYPE "public"."enum_resources_difficulty" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
  CREATE TYPE "public"."enum_resources_resource_type" AS ENUM('ARTICLE', 'TUTORIAL', 'PDF', 'VIDEO', 'EXTERNAL');
  CREATE TYPE "public"."enum_people_team_group" AS ENUM('FACULTY', 'LEADERSHIP', 'ROBOTICS', 'SOFTWARE_AI', 'ELECTRONICS', 'MECHANICAL', 'MEDIA');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'PARTICIPANT' NOT NULL,
  	"institution" varchar,
  	"phone" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "events_tracks_examples" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "events_tracks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" numeric NOT NULL,
  	"name" varchar NOT NULL,
  	"mission" varchar NOT NULL
  );
  
  CREATE TABLE "events_rounds" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" numeric NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"submission_type" "enum_events_rounds_submission_type"
  );
  
  CREATE TABLE "events_judging_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"max_score" numeric NOT NULL,
  	"weight_percent" numeric
  );
  
  CREATE TABLE "events_rules_sections_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rule" varchar NOT NULL
  );
  
  CREATE TABLE "events_rules_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "events_schedule" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"time_label" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "events_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"short_name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"edition" varchar DEFAULT '2026' NOT NULL,
  	"series" "enum_events_series" DEFAULT 'AURIX' NOT NULL,
  	"event_type" "enum_events_event_type" NOT NULL,
  	"status" "enum_events_status" DEFAULT 'REGISTRATION_OPEN' NOT NULL,
  	"short_description" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone NOT NULL,
  	"registration_open" timestamp(3) with time zone,
  	"registration_close" timestamp(3) with time zone,
  	"venue" varchar DEFAULT 'IILM University, Greater Noida',
  	"location" varchar DEFAULT 'Greater Noida, Uttar Pradesh, India',
  	"registration_fee" numeric,
  	"currency" varchar DEFAULT 'INR',
  	"min_team_size" numeric,
  	"max_team_size" numeric,
  	"operator_count" numeric,
  	"special_notice" varchar,
  	"requires_payment" boolean DEFAULT false,
  	"requires_submission" boolean DEFAULT false,
  	"requires_judging" boolean DEFAULT false,
  	"results_published" boolean DEFAULT false,
  	"featured" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "teams" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"code" varchar NOT NULL,
  	"event_id" integer NOT NULL,
  	"team_lead_id" integer NOT NULL,
  	"status" "enum_teams_status" DEFAULT 'OPEN',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "team_members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"team_id" integer NOT NULL,
  	"user_id" integer NOT NULL,
  	"role" "enum_team_members_role" DEFAULT 'MEMBER',
  	"status" "enum_team_members_status" DEFAULT 'ACTIVE',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "registrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"team_id" integer NOT NULL,
  	"event_id" integer NOT NULL,
  	"status" "enum_registrations_status" DEFAULT 'PENDING',
  	"payment_status" "enum_registrations_payment_status" DEFAULT 'UNPAID',
  	"payment_reference" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"team_id" integer NOT NULL,
  	"event_id" integer NOT NULL,
  	"round_number" numeric DEFAULT 1 NOT NULL,
  	"project_title" varchar NOT NULL,
  	"track" varchar NOT NULL,
  	"problem_statement" varchar NOT NULL,
  	"solution" varchar NOT NULL,
  	"architecture" varchar,
  	"repository_url" varchar,
  	"demo_url" varchar,
  	"ai_usage_disclosure_used_generative_a_i" boolean DEFAULT false,
  	"ai_usage_disclosure_tools_used" varchar,
  	"ai_usage_disclosure_purpose_and_extent" varchar,
  	"status" "enum_submissions_status" DEFAULT 'DRAFT',
  	"submitted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "evaluations_criterion_scores" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"criterion_name" varchar NOT NULL,
  	"score" numeric NOT NULL,
  	"max_score" numeric NOT NULL
  );
  
  CREATE TABLE "evaluations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"judge_id" integer NOT NULL,
  	"event_id" integer NOT NULL,
  	"team_id" integer NOT NULL,
  	"submission_id" integer,
  	"total_score" numeric NOT NULL,
  	"private_feedback" varchar,
  	"public_feedback" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "results" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer NOT NULL,
  	"team_id" integer NOT NULL,
  	"rank" numeric NOT NULL,
  	"award" varchar,
  	"score" numeric,
  	"published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "projects_domains" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"domain" varchar NOT NULL
  );
  
  CREATE TABLE "projects_technologies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"technology" varchar NOT NULL
  );
  
  CREATE TABLE "projects_hardware_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"spec" varchar
  );
  
  CREATE TABLE "projects_software_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"spec" varchar
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"short_description" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"status" "enum_projects_status" DEFAULT 'IN_PROGRESS',
  	"year" numeric DEFAULT 2026 NOT NULL,
  	"results" varchar,
  	"github_url" varchar,
  	"demo_url" varchar,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"summary" varchar NOT NULL,
  	"content" varchar NOT NULL,
  	"category" "enum_posts_category" NOT NULL,
  	"author" varchar NOT NULL,
  	"reading_time_minutes" numeric DEFAULT 5,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "resources_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "resources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"category" varchar NOT NULL,
  	"difficulty" "enum_resources_difficulty" DEFAULT 'INTERMEDIATE' NOT NULL,
  	"estimated_time" varchar DEFAULT '30 mins',
  	"resource_type" "enum_resources_resource_type" DEFAULT 'ARTICLE' NOT NULL,
  	"summary" varchar NOT NULL,
  	"content" varchar NOT NULL,
  	"author" varchar NOT NULL,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "people" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"department" varchar NOT NULL,
  	"team_group" "enum_people_team_group" NOT NULL,
  	"bio" varchar NOT NULL,
  	"linkedin" varchar,
  	"github" varchar,
  	"active" boolean DEFAULT true,
  	"start_year" numeric DEFAULT 2025 NOT NULL,
  	"end_year" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"events_id" integer,
  	"teams_id" integer,
  	"team_members_id" integer,
  	"registrations_id" integer,
  	"submissions_id" integer,
  	"evaluations_id" integer,
  	"results_id" integer,
  	"projects_id" integer,
  	"posts_id" integer,
  	"resources_id" integer,
  	"people_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_tracks_examples" ADD CONSTRAINT "events_tracks_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_tracks" ADD CONSTRAINT "events_tracks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rounds" ADD CONSTRAINT "events_rounds_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_judging_criteria" ADD CONSTRAINT "events_judging_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rules_sections_rules" ADD CONSTRAINT "events_rules_sections_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_rules_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rules_sections" ADD CONSTRAINT "events_rules_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_schedule" ADD CONSTRAINT "events_schedule_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_faqs" ADD CONSTRAINT "events_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "teams" ADD CONSTRAINT "teams_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "teams" ADD CONSTRAINT "teams_team_lead_id_users_id_fk" FOREIGN KEY ("team_lead_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "evaluations_criterion_scores" ADD CONSTRAINT "evaluations_criterion_scores_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."evaluations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_judge_id_users_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "results" ADD CONSTRAINT "results_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "results" ADD CONSTRAINT "results_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_domains" ADD CONSTRAINT "projects_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_technologies" ADD CONSTRAINT "projects_technologies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_hardware_specs" ADD CONSTRAINT "projects_hardware_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_software_specs" ADD CONSTRAINT "projects_software_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_tags" ADD CONSTRAINT "posts_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_tags" ADD CONSTRAINT "resources_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_teams_fk" FOREIGN KEY ("teams_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_registrations_fk" FOREIGN KEY ("registrations_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_submissions_fk" FOREIGN KEY ("submissions_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_evaluations_fk" FOREIGN KEY ("evaluations_id") REFERENCES "public"."evaluations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_results_fk" FOREIGN KEY ("results_id") REFERENCES "public"."results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resources_fk" FOREIGN KEY ("resources_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "events_tracks_examples_order_idx" ON "events_tracks_examples" USING btree ("_order");
  CREATE INDEX "events_tracks_examples_parent_id_idx" ON "events_tracks_examples" USING btree ("_parent_id");
  CREATE INDEX "events_tracks_order_idx" ON "events_tracks" USING btree ("_order");
  CREATE INDEX "events_tracks_parent_id_idx" ON "events_tracks" USING btree ("_parent_id");
  CREATE INDEX "events_rounds_order_idx" ON "events_rounds" USING btree ("_order");
  CREATE INDEX "events_rounds_parent_id_idx" ON "events_rounds" USING btree ("_parent_id");
  CREATE INDEX "events_judging_criteria_order_idx" ON "events_judging_criteria" USING btree ("_order");
  CREATE INDEX "events_judging_criteria_parent_id_idx" ON "events_judging_criteria" USING btree ("_parent_id");
  CREATE INDEX "events_rules_sections_rules_order_idx" ON "events_rules_sections_rules" USING btree ("_order");
  CREATE INDEX "events_rules_sections_rules_parent_id_idx" ON "events_rules_sections_rules" USING btree ("_parent_id");
  CREATE INDEX "events_rules_sections_order_idx" ON "events_rules_sections" USING btree ("_order");
  CREATE INDEX "events_rules_sections_parent_id_idx" ON "events_rules_sections" USING btree ("_parent_id");
  CREATE INDEX "events_schedule_order_idx" ON "events_schedule" USING btree ("_order");
  CREATE INDEX "events_schedule_parent_id_idx" ON "events_schedule" USING btree ("_parent_id");
  CREATE INDEX "events_faqs_order_idx" ON "events_faqs" USING btree ("_order");
  CREATE INDEX "events_faqs_parent_id_idx" ON "events_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE UNIQUE INDEX "teams_code_idx" ON "teams" USING btree ("code");
  CREATE INDEX "teams_event_idx" ON "teams" USING btree ("event_id");
  CREATE INDEX "teams_team_lead_idx" ON "teams" USING btree ("team_lead_id");
  CREATE INDEX "teams_updated_at_idx" ON "teams" USING btree ("updated_at");
  CREATE INDEX "teams_created_at_idx" ON "teams" USING btree ("created_at");
  CREATE INDEX "team_members_team_idx" ON "team_members" USING btree ("team_id");
  CREATE INDEX "team_members_user_idx" ON "team_members" USING btree ("user_id");
  CREATE INDEX "team_members_updated_at_idx" ON "team_members" USING btree ("updated_at");
  CREATE INDEX "team_members_created_at_idx" ON "team_members" USING btree ("created_at");
  CREATE INDEX "registrations_team_idx" ON "registrations" USING btree ("team_id");
  CREATE INDEX "registrations_event_idx" ON "registrations" USING btree ("event_id");
  CREATE INDEX "registrations_updated_at_idx" ON "registrations" USING btree ("updated_at");
  CREATE INDEX "registrations_created_at_idx" ON "registrations" USING btree ("created_at");
  CREATE INDEX "submissions_team_idx" ON "submissions" USING btree ("team_id");
  CREATE INDEX "submissions_event_idx" ON "submissions" USING btree ("event_id");
  CREATE INDEX "submissions_updated_at_idx" ON "submissions" USING btree ("updated_at");
  CREATE INDEX "submissions_created_at_idx" ON "submissions" USING btree ("created_at");
  CREATE INDEX "evaluations_criterion_scores_order_idx" ON "evaluations_criterion_scores" USING btree ("_order");
  CREATE INDEX "evaluations_criterion_scores_parent_id_idx" ON "evaluations_criterion_scores" USING btree ("_parent_id");
  CREATE INDEX "evaluations_judge_idx" ON "evaluations" USING btree ("judge_id");
  CREATE INDEX "evaluations_event_idx" ON "evaluations" USING btree ("event_id");
  CREATE INDEX "evaluations_team_idx" ON "evaluations" USING btree ("team_id");
  CREATE INDEX "evaluations_submission_idx" ON "evaluations" USING btree ("submission_id");
  CREATE INDEX "evaluations_updated_at_idx" ON "evaluations" USING btree ("updated_at");
  CREATE INDEX "evaluations_created_at_idx" ON "evaluations" USING btree ("created_at");
  CREATE INDEX "results_event_idx" ON "results" USING btree ("event_id");
  CREATE INDEX "results_team_idx" ON "results" USING btree ("team_id");
  CREATE INDEX "results_updated_at_idx" ON "results" USING btree ("updated_at");
  CREATE INDEX "results_created_at_idx" ON "results" USING btree ("created_at");
  CREATE INDEX "projects_domains_order_idx" ON "projects_domains" USING btree ("_order");
  CREATE INDEX "projects_domains_parent_id_idx" ON "projects_domains" USING btree ("_parent_id");
  CREATE INDEX "projects_technologies_order_idx" ON "projects_technologies" USING btree ("_order");
  CREATE INDEX "projects_technologies_parent_id_idx" ON "projects_technologies" USING btree ("_parent_id");
  CREATE INDEX "projects_hardware_specs_order_idx" ON "projects_hardware_specs" USING btree ("_order");
  CREATE INDEX "projects_hardware_specs_parent_id_idx" ON "projects_hardware_specs" USING btree ("_parent_id");
  CREATE INDEX "projects_software_specs_order_idx" ON "projects_software_specs" USING btree ("_order");
  CREATE INDEX "projects_software_specs_parent_id_idx" ON "projects_software_specs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "posts_tags_order_idx" ON "posts_tags" USING btree ("_order");
  CREATE INDEX "posts_tags_parent_id_idx" ON "posts_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "resources_tags_order_idx" ON "resources_tags" USING btree ("_order");
  CREATE INDEX "resources_tags_parent_id_idx" ON "resources_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "resources_slug_idx" ON "resources" USING btree ("slug");
  CREATE INDEX "resources_updated_at_idx" ON "resources" USING btree ("updated_at");
  CREATE INDEX "resources_created_at_idx" ON "resources" USING btree ("created_at");
  CREATE INDEX "people_updated_at_idx" ON "people" USING btree ("updated_at");
  CREATE INDEX "people_created_at_idx" ON "people" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_teams_id_idx" ON "payload_locked_documents_rels" USING btree ("teams_id");
  CREATE INDEX "payload_locked_documents_rels_team_members_id_idx" ON "payload_locked_documents_rels" USING btree ("team_members_id");
  CREATE INDEX "payload_locked_documents_rels_registrations_id_idx" ON "payload_locked_documents_rels" USING btree ("registrations_id");
  CREATE INDEX "payload_locked_documents_rels_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("submissions_id");
  CREATE INDEX "payload_locked_documents_rels_evaluations_id_idx" ON "payload_locked_documents_rels" USING btree ("evaluations_id");
  CREATE INDEX "payload_locked_documents_rels_results_id_idx" ON "payload_locked_documents_rels" USING btree ("results_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_resources_id_idx" ON "payload_locked_documents_rels" USING btree ("resources_id");
  CREATE INDEX "payload_locked_documents_rels_people_id_idx" ON "payload_locked_documents_rels" USING btree ("people_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "events_tracks_examples" CASCADE;
  DROP TABLE "events_tracks" CASCADE;
  DROP TABLE "events_rounds" CASCADE;
  DROP TABLE "events_judging_criteria" CASCADE;
  DROP TABLE "events_rules_sections_rules" CASCADE;
  DROP TABLE "events_rules_sections" CASCADE;
  DROP TABLE "events_schedule" CASCADE;
  DROP TABLE "events_faqs" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "teams" CASCADE;
  DROP TABLE "team_members" CASCADE;
  DROP TABLE "registrations" CASCADE;
  DROP TABLE "submissions" CASCADE;
  DROP TABLE "evaluations_criterion_scores" CASCADE;
  DROP TABLE "evaluations" CASCADE;
  DROP TABLE "results" CASCADE;
  DROP TABLE "projects_domains" CASCADE;
  DROP TABLE "projects_technologies" CASCADE;
  DROP TABLE "projects_hardware_specs" CASCADE;
  DROP TABLE "projects_software_specs" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "posts_tags" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "resources_tags" CASCADE;
  DROP TABLE "resources" CASCADE;
  DROP TABLE "people" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_events_rounds_submission_type";
  DROP TYPE "public"."enum_events_series";
  DROP TYPE "public"."enum_events_event_type";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum_teams_status";
  DROP TYPE "public"."enum_team_members_role";
  DROP TYPE "public"."enum_team_members_status";
  DROP TYPE "public"."enum_registrations_status";
  DROP TYPE "public"."enum_registrations_payment_status";
  DROP TYPE "public"."enum_submissions_status";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum_posts_category";
  DROP TYPE "public"."enum_resources_difficulty";
  DROP TYPE "public"."enum_resources_resource_type";
  DROP TYPE "public"."enum_people_team_group";`)
}
