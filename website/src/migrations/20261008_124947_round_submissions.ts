import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_round_submissions_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'QUALIFIED', 'NOT_QUALIFIED');
  CREATE TABLE "round_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"registration_code" varchar,
  	"team_name" varchar,
  	"round_number" numeric NOT NULL,
  	"status" "enum_round_submissions_status" DEFAULT 'SUBMITTED',
  	"submitted_at" timestamp(3) with time zone,
  	"project_title" varchar,
  	"track" varchar,
  	"repository_url" varchar,
  	"demo_url" varchar,
  	"file_filename" varchar,
  	"file_size" numeric,
  	"file_content_type" varchar,
  	"file_key" varchar,
  	"review_notes" varchar,
  	"registration_id" integer NOT NULL,
  	"event_id" integer NOT NULL,
  	"submitted_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "round_submissions_id" integer;
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_round_deadline" varchar DEFAULT 'Deadline: {deadline} IST';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_round_opens" varchar DEFAULT 'Opens {date} IST';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_round_closed" varchar DEFAULT 'Submissions for this round are closed.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_not_qualified" varchar DEFAULT 'Only teams qualified in round {n} can submit here.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_inactive" varchar DEFAULT 'This registration is cancelled, so it cannot submit.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_title_label" varchar DEFAULT 'Project title';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_track_label" varchar DEFAULT 'Track';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_track_choose" varchar DEFAULT 'Choose a track';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_file_label" varchar DEFAULT 'Presentation (PPT, PPTX or PDF, max 15 MB)';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_file_optional" varchar DEFAULT 'Presentation (optional; PPT, PPTX or PDF, max 15 MB)';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_file_choose" varchar DEFAULT 'Choose file';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_file_keep" varchar DEFAULT 'Keep the current file';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_file_none" varchar DEFAULT 'No file chosen';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_repo_label" varchar DEFAULT 'Repository link (https://…)';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_demo_label" varchar DEFAULT 'Demo link (optional, https://…)';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_submit" varchar DEFAULT 'Submit';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_update" varchar DEFAULT 'Update submission';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_uploading" varchar DEFAULT 'Uploading… {pct}%';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_saving" varchar DEFAULT 'Saving…';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_saved" varchar DEFAULT 'Your submission was saved. You can update it until the deadline.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_replace_note" varchar DEFAULT 'A new file replaces the previous one. You can update your submission until the deadline.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_current" varchar DEFAULT 'Submitted: {file} ({size}) on {date} IST';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_current_no_file" varchar DEFAULT 'Submitted on {date} IST';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_st_submitted" varchar DEFAULT 'Submitted, waiting for review';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_st_review" varchar DEFAULT 'Under review';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_st_qualified" varchar DEFAULT 'Qualified for the next round';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_st_not_qualified" varchar DEFAULT 'Not qualified';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_not_configured" varchar DEFAULT 'Uploads are not available yet. Please try again later or contact the organizers.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_no_team" varchar DEFAULT 'Only the team leader can submit for this team and round.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_closed" varchar DEFAULT 'The deadline for this round has passed.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_not_qualified" varchar DEFAULT 'Your team is not qualified for this round.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_type" varchar DEFAULT 'Upload a PPT, PPTX or PDF file.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_size" varchar DEFAULT 'The file is larger than 15 MB. Export it as PDF or compress the images.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_title" varchar DEFAULT 'Enter a project title (2–150 characters).';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_track" varchar DEFAULT 'Choose one of the tracks.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_repo" varchar DEFAULT 'Enter the repository link (starting with https://).';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_demo" varchar DEFAULT 'The demo link must start with https://.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_file_missing" varchar DEFAULT 'Choose your presentation file.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_upload_missing" varchar DEFAULT 'The upload did not complete. Please choose the file again.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_file_content" varchar DEFAULT 'This file is not a real PPT, PPTX or PDF. Please export your presentation again.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_failed" varchar DEFAULT 'Could not save your submission. Please try again.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_too_many" varchar DEFAULT 'Too many attempts. Please try again later.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_network" varchar DEFAULT 'The upload was interrupted. Check your connection and try again.';
  ALTER TABLE "round_submissions" ADD CONSTRAINT "round_submissions_registration_id_event_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "round_submissions" ADD CONSTRAINT "round_submissions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "round_submissions" ADD CONSTRAINT "round_submissions_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "round_submissions_registration_code_idx" ON "round_submissions" USING btree ("registration_code");
  CREATE INDEX "round_submissions_registration_idx" ON "round_submissions" USING btree ("registration_id");
  CREATE INDEX "round_submissions_event_idx" ON "round_submissions" USING btree ("event_id");
  CREATE INDEX "round_submissions_submitted_by_idx" ON "round_submissions" USING btree ("submitted_by_id");
  CREATE INDEX "round_submissions_updated_at_idx" ON "round_submissions" USING btree ("updated_at");
  CREATE INDEX "round_submissions_created_at_idx" ON "round_submissions" USING btree ("created_at");
  CREATE UNIQUE INDEX "registration_roundNumber_idx" ON "round_submissions" USING btree ("registration_id","round_number");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_round_submissions_fk" FOREIGN KEY ("round_submissions_id") REFERENCES "public"."round_submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_round_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("round_submissions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "round_submissions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "round_submissions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_round_submissions_fk";
  
  DROP INDEX "payload_locked_documents_rels_round_submissions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "round_submissions_id";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_round_deadline";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_round_opens";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_round_closed";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_not_qualified";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_inactive";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_title_label";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_track_label";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_track_choose";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_file_label";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_file_optional";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_file_choose";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_file_keep";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_file_none";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_repo_label";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_demo_label";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_submit";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_update";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_uploading";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_saving";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_saved";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_replace_note";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_current";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_current_no_file";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_st_submitted";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_st_review";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_st_qualified";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_st_not_qualified";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_not_configured";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_no_team";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_closed";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_not_qualified";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_type";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_size";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_title";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_track";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_repo";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_demo";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_file_missing";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_upload_missing";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_file_content";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_failed";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_too_many";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_network";
  DROP TYPE "public"."enum_round_submissions_status";`)
}
