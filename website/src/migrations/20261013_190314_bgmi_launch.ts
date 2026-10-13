import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Owner, 13 Oct 2026 (BGMI launch): per-competition fee wording (`events.fee_suffix`, e.g. " / player"), extra questions
 * for every player (`events_member_questions`; answers in `event_registrations_members_answers`), the "Esports"
 * competition type, and the wording for them (incl. the solo team-size message). Additive only.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_member_questions_format" AS ENUM('TEXT', 'DIGITS');
  ALTER TYPE "public"."enum_events_event_type" ADD VALUE 'ESPORTS' BEFORE 'OTHER';
  CREATE TABLE "events_member_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"format" "enum_events_member_questions_format" DEFAULT 'TEXT',
  	"max_length" numeric DEFAULT 30,
  	"required" boolean DEFAULT true,
  	"help" varchar
  );
  
  CREATE TABLE "event_registrations_members_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  ALTER TABLE "events" ADD COLUMN "fee_suffix" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "team_solo" varchar DEFAULT 'Solo (1 player)';
  ALTER TABLE "form_texts" ADD COLUMN "general_fmt_solo" varchar DEFAULT 'Solo (1 player)';
  ALTER TABLE "form_texts" ADD COLUMN "messages_reg_team_solo" varchar DEFAULT '{event} is a solo competition: register one player only.';
  ALTER TABLE "form_texts" ADD COLUMN "messages_reg_answer_missing" varchar DEFAULT 'Fill in "{question}" for {name}.';
  ALTER TABLE "form_texts" ADD COLUMN "messages_reg_answer_digits" varchar DEFAULT '"{question}" for {name} must contain digits only.';
  ALTER TABLE "form_texts" ADD COLUMN "messages_reg_answer_invalid" varchar DEFAULT '"{question}" for {name} is too long or contains characters that are not allowed.';
  ALTER TABLE "staff_texts" ADD COLUMN "csv_member_answers" varchar DEFAULT 'Member answers (e.g. in-game name, player ID)';
  ALTER TABLE "events_member_questions" ADD CONSTRAINT "events_member_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_registrations_members_answers" ADD CONSTRAINT "event_registrations_members_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_registrations_members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_member_questions_order_idx" ON "events_member_questions" USING btree ("_order");
  CREATE INDEX "events_member_questions_parent_id_idx" ON "events_member_questions" USING btree ("_parent_id");
  CREATE INDEX "event_registrations_members_answers_order_idx" ON "event_registrations_members_answers" USING btree ("_order");
  CREATE INDEX "event_registrations_members_answers_parent_id_idx" ON "event_registrations_members_answers" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "events_member_questions" CASCADE;
  DROP TABLE "event_registrations_members_answers" CASCADE;
  ALTER TABLE "events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_events_event_type";
  CREATE TYPE "public"."enum_events_event_type" AS ENUM('HACKATHON', 'ROBO_SOCCER', 'ROBO_RACE', 'ROBO_EXPO', 'ROBO_IDEATHON', 'WORKSHOP', 'OTHER');
  ALTER TABLE "events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_events_event_type" USING "event_type"::"public"."enum_events_event_type";
  ALTER TABLE "events" DROP COLUMN "fee_suffix";
  ALTER TABLE "event_page_labels" DROP COLUMN "team_solo";
  ALTER TABLE "form_texts" DROP COLUMN "general_fmt_solo";
  ALTER TABLE "form_texts" DROP COLUMN "messages_reg_team_solo";
  ALTER TABLE "form_texts" DROP COLUMN "messages_reg_answer_missing";
  ALTER TABLE "form_texts" DROP COLUMN "messages_reg_answer_digits";
  ALTER TABLE "form_texts" DROP COLUMN "messages_reg_answer_invalid";
  ALTER TABLE "staff_texts" DROP COLUMN "csv_member_answers";
  DROP TYPE "public"."enum_events_member_questions_format";`)
}
