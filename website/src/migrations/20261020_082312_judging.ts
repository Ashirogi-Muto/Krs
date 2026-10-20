import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_judging_rounds_status" AS ENUM('DRAFT', 'OPEN', 'CLOSED');
  CREATE TYPE "public"."enum_judging_rounds_teams" AS ENUM('submitted', 'qualified', 'confirmed');
  CREATE TYPE "public"."enum_judging_decisions_decision" AS ENUM('QUALIFIED', 'NOT_QUALIFIED');
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'judging.manage' BEFORE 'events.viewDrafts';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'judging.results' BEFORE 'events.viewDrafts';
  CREATE TABLE "judging_rounds_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"key" varchar,
  	"min" numeric DEFAULT 0 NOT NULL,
  	"max" numeric NOT NULL,
  	"step" numeric DEFAULT 1,
  	"guidance" varchar
  );
  
  CREATE TABLE "judging_rounds" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"event_id" integer NOT NULL,
  	"round_number" numeric DEFAULT 1 NOT NULL,
  	"status" "enum_judging_rounds_status" DEFAULT 'DRAFT' NOT NULL,
  	"teams" "enum_judging_rounds_teams" DEFAULT 'confirmed' NOT NULL,
  	"formula" varchar,
  	"decimals" numeric DEFAULT 2,
  	"judge_view_team_name" boolean DEFAULT true,
  	"judge_view_college" boolean DEFAULT true,
  	"judge_view_members" boolean DEFAULT true,
  	"judge_view_project" boolean DEFAULT true,
  	"judge_view_file" boolean DEFAULT true,
  	"judge_view_other_scores" boolean DEFAULT false,
  	"judge_view_edit_after_submit" boolean DEFAULT true,
  	"judge_view_remarks_required" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "judging_rounds_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "judge_scores" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"round_id" integer NOT NULL,
  	"registration_id" integer NOT NULL,
  	"judge_id" integer NOT NULL,
  	"event_id" integer NOT NULL,
  	"marks" jsonb NOT NULL,
  	"total" numeric NOT NULL,
  	"submitted_at" timestamp(3) with time zone NOT NULL,
  	"remarks" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "judging_decisions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"round_id" integer NOT NULL,
  	"registration_id" integer NOT NULL,
  	"event_id" integer NOT NULL,
  	"decision" "enum_judging_decisions_decision" NOT NULL,
  	"decided_by" varchar,
  	"decided_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "judging_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"judge_tab_title" varchar DEFAULT 'Judging',
  	"judge_eyebrow" varchar DEFAULT 'AURIX judging',
  	"judge_title" varchar DEFAULT 'Judge portal',
  	"judge_hello" varchar DEFAULT 'Signed in as {name}',
  	"judge_exit" varchar DEFAULT 'Back to AURIX',
  	"judge_no_access" varchar DEFAULT 'This page is for judges. Your account is not a judge account.',
  	"judge_staff_link" varchar DEFAULT 'Open the results desk',
  	"judge_no_rounds" varchar DEFAULT 'No rounds are open for you yet. The organisers will assign you and open judging.',
  	"judge_rounds_title" varchar DEFAULT 'Your rounds',
  	"judge_status_open" varchar DEFAULT 'Open',
  	"judge_status_closed" varchar DEFAULT 'Closed (read only)',
  	"judge_progress" varchar DEFAULT '{done} of {total} scored',
  	"judge_possible" varchar DEFAULT 'Possible score: {low} to {high}',
  	"judge_filter_all" varchar DEFAULT 'All',
  	"judge_filter_todo" varchar DEFAULT 'To score',
  	"judge_filter_done" varchar DEFAULT 'Scored',
  	"judge_search" varchar DEFAULT 'Search team or code',
  	"judge_no_teams" varchar DEFAULT 'No teams in this round yet.',
  	"judge_badge_done" varchar DEFAULT 'Scored',
  	"judge_badge_todo" varchar DEFAULT 'To score',
  	"judge_unnamed" varchar DEFAULT 'Team {code}',
  	"judge_college" varchar DEFAULT 'College',
  	"judge_members" varchar DEFAULT 'Members',
  	"judge_project" varchar DEFAULT 'Project',
  	"judge_track" varchar DEFAULT 'Track',
  	"judge_repo" varchar DEFAULT 'Repository',
  	"judge_demo" varchar DEFAULT 'Demo',
  	"judge_file" varchar DEFAULT 'Download submission',
  	"judge_no_file" varchar DEFAULT 'No file submitted',
  	"judge_marks_title" varchar DEFAULT 'Marks',
  	"judge_range" varchar DEFAULT '{min} to {max}',
  	"judge_score_label" varchar DEFAULT 'Score',
  	"judge_remarks" varchar DEFAULT 'Remarks (only the organisers see these)',
  	"judge_remarks_required" varchar DEFAULT 'Remarks (required; only the organisers see these)',
  	"judge_save" varchar DEFAULT 'Save score',
  	"judge_update" varchar DEFAULT 'Update score',
  	"judge_saving" varchar DEFAULT 'Saving…',
  	"judge_saved" varchar DEFAULT 'Score saved.',
  	"judge_saved_at" varchar DEFAULT 'Saved {time}',
  	"judge_final" varchar DEFAULT 'Your score is final.',
  	"judge_closed" varchar DEFAULT 'Judging for this round is closed.',
  	"judge_others" varchar DEFAULT 'Other judges'' scores',
  	"judge_judge_n" varchar DEFAULT 'Judge {n}',
  	"judge_back" varchar DEFAULT 'Back to teams',
  	"judge_next" varchar DEFAULT 'Next team',
  	"judge_loading" varchar DEFAULT 'Loading…',
  	"judge_err_load" varchar DEFAULT 'Could not load. Check your connection and try again.',
  	"desk_tab_title" varchar DEFAULT 'Judging results',
  	"desk_eyebrow" varchar DEFAULT 'AURIX staff',
  	"desk_title" varchar DEFAULT 'Judging results',
  	"desk_cms_link" varchar DEFAULT 'Back to the CMS',
  	"desk_no_access" varchar DEFAULT 'You need "See scores & decide" in an access role (CMS → Accounts → Access roles).',
  	"desk_choose_round" varchar DEFAULT 'Choose a round',
  	"desk_no_rounds" varchar DEFAULT 'No judging rounds yet. Add one in the CMS: AURIX → Judging rounds.',
  	"desk_status_draft" varchar DEFAULT 'Draft',
  	"desk_status_open" varchar DEFAULT 'Open',
  	"desk_status_closed" varchar DEFAULT 'Closed',
  	"desk_summary" varchar DEFAULT '{teams} teams · {scored} scored by every judge · {judges} judges',
  	"desk_formula" varchar DEFAULT 'Score = {formula}',
  	"desk_formula_sum" varchar DEFAULT 'sum of all criteria',
  	"desk_possible" varchar DEFAULT 'Possible score: {low} to {high}',
  	"desk_col_rank" varchar DEFAULT 'Rank',
  	"desk_col_team" varchar DEFAULT 'Team',
  	"desk_col_code" varchar DEFAULT 'Code',
  	"desk_col_avg" varchar DEFAULT 'Average',
  	"desk_col_judges" varchar DEFAULT 'Judges',
  	"desk_col_spread" varchar DEFAULT 'Spread',
  	"desk_col_decision" varchar DEFAULT 'Decision',
  	"desk_col_remarks" varchar DEFAULT 'Remarks',
  	"desk_not_scored" varchar DEFAULT 'Not scored yet',
  	"desk_missing" varchar DEFAULT 'Still to score: {names}',
  	"desk_tools_title" varchar DEFAULT 'Select teams',
  	"desk_tools_help" varchar DEFAULT 'Fill in any rules (all must hold), then press Select matching. You can tick or untick teams by hand afterwards.',
  	"desk_top_n" varchar DEFAULT 'Top N',
  	"desk_include_ties" varchar DEFAULT 'Include teams tied at the cut-off',
  	"desk_min_avg" varchar DEFAULT 'Average at least',
  	"desk_max_avg" varchar DEFAULT 'Average at most',
  	"desk_min_judges" varchar DEFAULT 'Scored by at least (judges)',
  	"desk_max_spread" varchar DEFAULT 'Judges'' scores differ by at most',
  	"desk_crit_min" varchar DEFAULT 'Minimum average mark per criterion',
  	"desk_apply" varchar DEFAULT 'Select matching',
  	"desk_select_all" varchar DEFAULT 'Select all scored',
  	"desk_clear" varchar DEFAULT 'Clear selection',
  	"desk_selected" varchar DEFAULT '{n} selected',
  	"desk_tie" varchar DEFAULT 'Tie at the cut-off: {teams}. Decide by hand.',
  	"desk_mark_q" varchar DEFAULT 'Mark selected Qualified',
  	"desk_mark_n_q" varchar DEFAULT 'Mark selected Not qualified',
  	"desk_mark_rest_n_q" varchar DEFAULT 'Mark all others Not qualified',
  	"desk_mark_clear" varchar DEFAULT 'Clear decision of selected',
  	"desk_confirm" varchar DEFAULT 'Set "{decision}" for {n} teams?',
  	"desk_decision_q" varchar DEFAULT 'Qualified',
  	"desk_decision_n_q" varchar DEFAULT 'Not qualified',
  	"desk_decision_none" varchar DEFAULT 'No decision',
  	"desk_saved_decisions" varchar DEFAULT 'Saved {n} decisions.',
  	"desk_csv" varchar DEFAULT 'Download CSV',
  	"desk_details" varchar DEFAULT 'Details',
  	"desk_remarks_title" varchar DEFAULT 'Remarks',
  	"desk_no_remarks" varchar DEFAULT 'No remarks.',
  	"desk_loading" varchar DEFAULT 'Loading…',
  	"desk_err_load" varchar DEFAULT 'Could not load. Check your connection and try again.',
  	"api_not_allowed" varchar DEFAULT 'Not allowed.',
  	"api_bad_origin" varchar DEFAULT 'Request refused. Reload the page and try again.',
  	"api_bad_request" varchar DEFAULT 'Something in the request is not right. Reload the page and try again.',
  	"api_slow_down" varchar DEFAULT 'Too many requests. Wait a minute and try again.',
  	"api_not_open" varchar DEFAULT 'This round is not open for scoring.',
  	"api_not_in_round" varchar DEFAULT 'This team is not in this round.',
  	"api_mark_missing" varchar DEFAULT 'Give a mark for "{criterion}".',
  	"api_mark_range" varchar DEFAULT '"{criterion}" must be between {min} and {max}.',
  	"api_mark_step" varchar DEFAULT '"{criterion}" must be in steps of {step}.',
  	"api_remarks_needed" varchar DEFAULT 'Add your remarks before saving.',
  	"api_final" varchar DEFAULT 'Your score for this team is final.',
  	"api_changed" varchar DEFAULT 'This was changed meanwhile. Reload and try again.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "judging_rounds_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "judge_scores_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "judging_decisions_id" integer;
  ALTER TABLE "judging_rounds_criteria" ADD CONSTRAINT "judging_rounds_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."judging_rounds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "judging_rounds" ADD CONSTRAINT "judging_rounds_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "judging_rounds_rels" ADD CONSTRAINT "judging_rounds_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."judging_rounds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "judging_rounds_rels" ADD CONSTRAINT "judging_rounds_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_round_id_judging_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."judging_rounds"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_registration_id_event_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_judge_id_users_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "judging_decisions" ADD CONSTRAINT "judging_decisions_round_id_judging_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."judging_rounds"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "judging_decisions" ADD CONSTRAINT "judging_decisions_registration_id_event_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "judging_decisions" ADD CONSTRAINT "judging_decisions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "judging_rounds_criteria_order_idx" ON "judging_rounds_criteria" USING btree ("_order");
  CREATE INDEX "judging_rounds_criteria_parent_id_idx" ON "judging_rounds_criteria" USING btree ("_parent_id");
  CREATE INDEX "judging_rounds_event_idx" ON "judging_rounds" USING btree ("event_id");
  CREATE INDEX "judging_rounds_updated_at_idx" ON "judging_rounds" USING btree ("updated_at");
  CREATE INDEX "judging_rounds_created_at_idx" ON "judging_rounds" USING btree ("created_at");
  CREATE UNIQUE INDEX "event_roundNumber_idx" ON "judging_rounds" USING btree ("event_id","round_number");
  CREATE INDEX "judging_rounds_rels_order_idx" ON "judging_rounds_rels" USING btree ("order");
  CREATE INDEX "judging_rounds_rels_parent_idx" ON "judging_rounds_rels" USING btree ("parent_id");
  CREATE INDEX "judging_rounds_rels_path_idx" ON "judging_rounds_rels" USING btree ("path");
  CREATE INDEX "judging_rounds_rels_users_id_idx" ON "judging_rounds_rels" USING btree ("users_id");
  CREATE INDEX "judge_scores_round_idx" ON "judge_scores" USING btree ("round_id");
  CREATE INDEX "judge_scores_registration_idx" ON "judge_scores" USING btree ("registration_id");
  CREATE INDEX "judge_scores_judge_idx" ON "judge_scores" USING btree ("judge_id");
  CREATE INDEX "judge_scores_event_idx" ON "judge_scores" USING btree ("event_id");
  CREATE INDEX "judge_scores_updated_at_idx" ON "judge_scores" USING btree ("updated_at");
  CREATE INDEX "judge_scores_created_at_idx" ON "judge_scores" USING btree ("created_at");
  CREATE UNIQUE INDEX "round_registration_judge_idx" ON "judge_scores" USING btree ("round_id","registration_id","judge_id");
  CREATE INDEX "judging_decisions_round_idx" ON "judging_decisions" USING btree ("round_id");
  CREATE INDEX "judging_decisions_registration_idx" ON "judging_decisions" USING btree ("registration_id");
  CREATE INDEX "judging_decisions_event_idx" ON "judging_decisions" USING btree ("event_id");
  CREATE INDEX "judging_decisions_updated_at_idx" ON "judging_decisions" USING btree ("updated_at");
  CREATE INDEX "judging_decisions_created_at_idx" ON "judging_decisions" USING btree ("created_at");
  CREATE UNIQUE INDEX "round_registration_idx" ON "judging_decisions" USING btree ("round_id","registration_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_judging_rounds_fk" FOREIGN KEY ("judging_rounds_id") REFERENCES "public"."judging_rounds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_judge_scores_fk" FOREIGN KEY ("judge_scores_id") REFERENCES "public"."judge_scores"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_judging_decisions_fk" FOREIGN KEY ("judging_decisions_id") REFERENCES "public"."judging_decisions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_judging_rounds_id_idx" ON "payload_locked_documents_rels" USING btree ("judging_rounds_id");
  CREATE INDEX "payload_locked_documents_rels_judge_scores_id_idx" ON "payload_locked_documents_rels" USING btree ("judge_scores_id");
  CREATE INDEX "payload_locked_documents_rels_judging_decisions_id_idx" ON "payload_locked_documents_rels" USING btree ("judging_decisions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "judging_rounds_criteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "judging_rounds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "judging_rounds_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "judge_scores" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "judging_decisions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "judging_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "judging_rounds_criteria" CASCADE;
  DROP TABLE "judging_rounds" CASCADE;
  DROP TABLE "judging_rounds_rels" CASCADE;
  DROP TABLE "judge_scores" CASCADE;
  DROP TABLE "judging_decisions" CASCADE;
  DROP TABLE "judging_texts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_judging_rounds_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_judge_scores_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_judging_decisions_fk";
  
  ALTER TABLE "access_roles_permissions" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_access_roles_permissions";
  CREATE TYPE "public"."enum_access_roles_permissions" AS ENUM('registrations.view', 'registrations.contacts', 'registrations.leaderPhone', 'registrations.ids', 'registrations.money', 'registrations.portalAccounts', 'registrations.notes', 'registrations.editStatus', 'registrations.editIdCheck', 'registrations.editPayment', 'registrations.editDetails', 'registrations.editCheckin', 'registrations.delete', 'idDocuments.edit', 'idDocuments.delete', 'submissions.view', 'submissions.download', 'submissions.review', 'submissions.delete', 'events.viewDrafts', 'events.editTexts', 'events.editLocked', 'events.create', 'events.delete', 'announcements.create', 'announcements.edit', 'announcements.delete', 'coupons.view', 'coupons.create', 'coupons.edit', 'coupons.delete', 'coupons.editOwn', 'coupons.deleteOwn', 'coupons.usage', 'emailOutbox.view', 'emailOutbox.edit', 'emailOutbox.delete', 'formSubmissions.view', 'formSubmissions.handle', 'formSubmissions.delete', 'shortLinks.view', 'shortLinks.create', 'shortLinks.edit', 'shortLinks.delete', 'pages.view', 'pages.create', 'pages.edit', 'pages.delete', 'pages.versions', 'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'posts.view', 'posts.create', 'posts.edit', 'posts.delete', 'resources.view', 'resources.create', 'resources.edit', 'resources.delete', 'people.view', 'people.create', 'people.edit', 'people.delete', 'gallery.view', 'gallery.create', 'gallery.edit', 'gallery.delete', 'media.create', 'media.edit', 'media.delete', 'globals.siteSettings', 'globals.navigation', 'globals.eventPageLabels', 'globals.formTexts', 'globals.portalTexts', 'globals.pageTexts', 'globals.legalPages', 'globals.aurixSchedule', 'globals.staffTexts', 'tools.checkin', 'tools.paymentMatching', 'tools.idReupload', 'exports.full', 'exports.finance', 'exports.checkin', 'exports.roster', 'paymentReports.manage', 'admin.retention', 'dashboard.overview', 'dashboard.finance', 'dashboard.desk', 'dashboard.events', 'dashboard.counts', 'dashboard.totals', 'admin.pageVisibility', 'admin.participants', 'accounts.team', 'accounts.delete', 'accessRoles.manage');
  ALTER TABLE "access_roles_permissions" ALTER COLUMN "value" SET DATA TYPE "public"."enum_access_roles_permissions" USING "value"::"public"."enum_access_roles_permissions";
  DROP INDEX "payload_locked_documents_rels_judging_rounds_id_idx";
  DROP INDEX "payload_locked_documents_rels_judge_scores_id_idx";
  DROP INDEX "payload_locked_documents_rels_judging_decisions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "judging_rounds_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "judge_scores_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "judging_decisions_id";
  DROP TYPE "public"."enum_judging_rounds_status";
  DROP TYPE "public"."enum_judging_rounds_teams";
  DROP TYPE "public"."enum_judging_decisions_decision";`)
}
