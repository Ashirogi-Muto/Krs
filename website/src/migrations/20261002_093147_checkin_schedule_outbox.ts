import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_email_outbox_kind" AS ENUM('REGISTRATION_CONFIRMATION');
  CREATE TYPE "public"."enum_email_outbox_status" AS ENUM('PENDING', 'SENDING', 'SENT', 'FAILED');
  CREATE TABLE "email_outbox" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"to" varchar NOT NULL,
  	"subject" varchar NOT NULL,
  	"kind" "enum_email_outbox_kind" NOT NULL,
  	"registration_id" integer,
  	"status" "enum_email_outbox_status" DEFAULT 'PENDING' NOT NULL,
  	"attempts" numeric DEFAULT 0,
  	"next_attempt_at" timestamp(3) with time zone,
  	"sent_at" timestamp(3) with time zone,
  	"message_id" varchar,
  	"last_error" varchar,
  	"html" varchar NOT NULL,
  	"text" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "aurix_schedule_days_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"time" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"event_id" integer,
  	"label" varchar,
  	"location" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "aurix_schedule_days" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "aurix_schedule" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"intro" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "event_registrations" ADD COLUMN "checked_in" boolean DEFAULT false;
  ALTER TABLE "event_registrations" ADD COLUMN "checked_in_at" timestamp(3) with time zone;
  ALTER TABLE "event_registrations" ADD COLUMN "checked_in_by" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "email_outbox_id" integer;
  ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_registration_id_event_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "aurix_schedule_days_items" ADD CONSTRAINT "aurix_schedule_days_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "aurix_schedule_days_items" ADD CONSTRAINT "aurix_schedule_days_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."aurix_schedule_days"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "aurix_schedule_days" ADD CONSTRAINT "aurix_schedule_days_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."aurix_schedule"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "email_outbox_to_idx" ON "email_outbox" USING btree ("to");
  CREATE INDEX "email_outbox_registration_idx" ON "email_outbox" USING btree ("registration_id");
  CREATE INDEX "email_outbox_status_idx" ON "email_outbox" USING btree ("status");
  CREATE INDEX "email_outbox_next_attempt_at_idx" ON "email_outbox" USING btree ("next_attempt_at");
  CREATE INDEX "email_outbox_updated_at_idx" ON "email_outbox" USING btree ("updated_at");
  CREATE INDEX "email_outbox_created_at_idx" ON "email_outbox" USING btree ("created_at");
  CREATE INDEX "aurix_schedule_days_items_order_idx" ON "aurix_schedule_days_items" USING btree ("_order");
  CREATE INDEX "aurix_schedule_days_items_parent_id_idx" ON "aurix_schedule_days_items" USING btree ("_parent_id");
  CREATE INDEX "aurix_schedule_days_items_event_idx" ON "aurix_schedule_days_items" USING btree ("event_id");
  CREATE INDEX "aurix_schedule_days_order_idx" ON "aurix_schedule_days" USING btree ("_order");
  CREATE INDEX "aurix_schedule_days_parent_id_idx" ON "aurix_schedule_days" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_outbox_fk" FOREIGN KEY ("email_outbox_id") REFERENCES "public"."email_outbox"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_email_outbox_id_idx" ON "payload_locked_documents_rels" USING btree ("email_outbox_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "email_outbox" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "aurix_schedule_days_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "aurix_schedule_days" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "aurix_schedule" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "email_outbox" CASCADE;
  DROP TABLE "aurix_schedule_days_items" CASCADE;
  DROP TABLE "aurix_schedule_days" CASCADE;
  DROP TABLE "aurix_schedule" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_email_outbox_fk";
  
  DROP INDEX "payload_locked_documents_rels_email_outbox_id_idx";
  ALTER TABLE "event_registrations" DROP COLUMN "checked_in";
  ALTER TABLE "event_registrations" DROP COLUMN "checked_in_at";
  ALTER TABLE "event_registrations" DROP COLUMN "checked_in_by";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "email_outbox_id";
  DROP TYPE "public"."enum_email_outbox_kind";
  DROP TYPE "public"."enum_email_outbox_status";`)
}
