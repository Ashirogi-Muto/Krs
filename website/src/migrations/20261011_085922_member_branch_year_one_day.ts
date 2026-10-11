import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Optional branch + year/class per team member (school students too); wording; one-day AURIX events (guarded). */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_event_registrations_members_year" AS ENUM('Y1', 'Y2', 'Y3', 'Y4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12');
  ALTER TABLE "form_texts" ALTER COLUMN "registration_college" SET DEFAULT 'University / college / school';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_college" SET DEFAULT 'Please enter the university / college / school for every team member.';
  ALTER TABLE "event_registrations_members" ADD COLUMN "branch" varchar;
  ALTER TABLE "event_registrations_members" ADD COLUMN "year" "enum_event_registrations_members_year";
  ALTER TABLE "form_texts" ADD COLUMN "registration_branch" varchar DEFAULT 'Branch / stream (optional)';
  ALTER TABLE "form_texts" ADD COLUMN "registration_year" varchar DEFAULT 'Year / class (optional)';
  ALTER TABLE "form_texts" ADD COLUMN "registration_year_college_group" varchar DEFAULT 'College';
  ALTER TABLE "form_texts" ADD COLUMN "registration_year_school_group" varchar DEFAULT 'School';
  ALTER TABLE "form_texts" ADD COLUMN "registration_y_y1" varchar DEFAULT '1st year';
  ALTER TABLE "form_texts" ADD COLUMN "registration_y_y2" varchar DEFAULT '2nd year';
  ALTER TABLE "form_texts" ADD COLUMN "registration_y_y3" varchar DEFAULT '3rd year';
  ALTER TABLE "form_texts" ADD COLUMN "registration_y_y4" varchar DEFAULT '4th year';
  ALTER TABLE "form_texts" ADD COLUMN "registration_y_c5" varchar DEFAULT 'Class 5';
  ALTER TABLE "form_texts" ADD COLUMN "registration_y_c6" varchar DEFAULT 'Class 6';
  ALTER TABLE "form_texts" ADD COLUMN "registration_y_c7" varchar DEFAULT 'Class 7';
  ALTER TABLE "form_texts" ADD COLUMN "registration_y_c8" varchar DEFAULT 'Class 8';
  ALTER TABLE "form_texts" ADD COLUMN "registration_y_c9" varchar DEFAULT 'Class 9';
  ALTER TABLE "form_texts" ADD COLUMN "registration_y_c10" varchar DEFAULT 'Class 10';
  ALTER TABLE "form_texts" ADD COLUMN "registration_y_c11" varchar DEFAULT 'Class 11';
  ALTER TABLE "form_texts" ADD COLUMN "registration_y_c12" varchar DEFAULT 'Class 12';
  ALTER TABLE "form_texts" ADD COLUMN "registration_err_branch" varchar DEFAULT 'The branch of {name} may only contain letters and spaces.';
  ALTER TABLE "form_texts" ADD COLUMN "messages_reg_branch" varchar DEFAULT 'The branch of {name} may only contain letters and spaces.';
  ALTER TABLE "form_texts" ADD COLUMN "messages_reg_year" varchar DEFAULT 'Please choose a year or class from the list for {name}.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_template_title" varchar DEFAULT 'Official presentation template';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_template_text" varchar DEFAULT 'Download the official AURIX template, fill in your idea and upload it below as PPT, PPTX or PDF.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_template_button" varchar DEFAULT 'Download the PPT template';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_template_meta" varchar DEFAULT '{name} · {size}';
  ALTER TABLE "staff_texts" ADD COLUMN "csv_branch" varchar DEFAULT 'Branch';
  ALTER TABLE "staff_texts" ADD COLUMN "csv_year" varchar DEFAULT 'Year / class';
  ALTER TABLE "staff_texts" ADD COLUMN "csv_member_branches" varchar DEFAULT 'Member branches';
  ALTER TABLE "staff_texts" ADD COLUMN "csv_member_years" varchar DEFAULT 'Member years / classes';`)

  // Owner, 11 Oct 2026: every AURIX competition is a one-day event on 27 Oct (cards then read "27 Oct 2026").
  // Ends: 17:00 IST, the Hackathon 21:00 IST (end of its 12-hour round). Only rows still on the old 28 Oct end.
  await db.execute(sql`
  UPDATE "events" SET "end_date" = CASE WHEN "slug" = 'hackathon' THEN '2026-10-27T15:30:00Z'::timestamptz ELSE '2026-10-27T11:30:00Z'::timestamptz END
  WHERE "slug" IN ('hackathon', 'robo-soccer', 'robo-race', 'robo-expo', 'robo-ideathon') AND "end_date" = '2026-10-28T11:30:00Z'::timestamptz;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_texts" ALTER COLUMN "registration_college" SET DEFAULT 'University / college';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_college" SET DEFAULT 'Please enter the university / college for every team member.';
  ALTER TABLE "event_registrations_members" DROP COLUMN "branch";
  ALTER TABLE "event_registrations_members" DROP COLUMN "year";
  ALTER TABLE "form_texts" DROP COLUMN "registration_branch";
  ALTER TABLE "form_texts" DROP COLUMN "registration_year";
  ALTER TABLE "form_texts" DROP COLUMN "registration_year_college_group";
  ALTER TABLE "form_texts" DROP COLUMN "registration_year_school_group";
  ALTER TABLE "form_texts" DROP COLUMN "registration_y_y1";
  ALTER TABLE "form_texts" DROP COLUMN "registration_y_y2";
  ALTER TABLE "form_texts" DROP COLUMN "registration_y_y3";
  ALTER TABLE "form_texts" DROP COLUMN "registration_y_y4";
  ALTER TABLE "form_texts" DROP COLUMN "registration_y_c5";
  ALTER TABLE "form_texts" DROP COLUMN "registration_y_c6";
  ALTER TABLE "form_texts" DROP COLUMN "registration_y_c7";
  ALTER TABLE "form_texts" DROP COLUMN "registration_y_c8";
  ALTER TABLE "form_texts" DROP COLUMN "registration_y_c9";
  ALTER TABLE "form_texts" DROP COLUMN "registration_y_c10";
  ALTER TABLE "form_texts" DROP COLUMN "registration_y_c11";
  ALTER TABLE "form_texts" DROP COLUMN "registration_y_c12";
  ALTER TABLE "form_texts" DROP COLUMN "registration_err_branch";
  ALTER TABLE "form_texts" DROP COLUMN "messages_reg_branch";
  ALTER TABLE "form_texts" DROP COLUMN "messages_reg_year";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_template_title";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_template_text";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_template_button";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_template_meta";
  ALTER TABLE "staff_texts" DROP COLUMN "csv_branch";
  ALTER TABLE "staff_texts" DROP COLUMN "csv_year";
  ALTER TABLE "staff_texts" DROP COLUMN "csv_member_branches";
  ALTER TABLE "staff_texts" DROP COLUMN "csv_member_years";
  DROP TYPE "public"."enum_event_registrations_members_year";`)
}
