import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_event_registrations_status" AS ENUM('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED');
  CREATE TYPE "public"."enum_event_registrations_payment_status" AS ENUM('AWAITING_PAYMENT', 'PAID_VERIFIED', 'NOT_FOUND', 'REFUNDED');
  CREATE TYPE "public"."enum_event_registrations_id_verification" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
  CREATE TABLE "event_registrations_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar,
  	"phone" varchar,
  	"id_document_id" integer NOT NULL
  );
  
  CREATE TABLE "event_registrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"registration_code" varchar NOT NULL,
  	"event_id" integer NOT NULL,
  	"team_name" varchar NOT NULL,
  	"leader_name" varchar NOT NULL,
  	"leader_email" varchar NOT NULL,
  	"leader_phone" varchar NOT NULL,
  	"college" varchar NOT NULL,
  	"amount_due" numeric,
  	"status" "enum_event_registrations_status" DEFAULT 'PENDING',
  	"payment_status" "enum_event_registrations_payment_status" DEFAULT 'AWAITING_PAYMENT',
  	"id_verification" "enum_event_registrations_id_verification" DEFAULT 'PENDING',
  	"payment_reference" varchar,
  	"verified_at" timestamp(3) with time zone,
  	"admin_notes" varchar,
  	"consent" boolean DEFAULT false NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "id_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"member_name" varchar NOT NULL,
  	"registration_code" varchar,
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
  
  ALTER TABLE "events" ADD COLUMN "payment_event_label" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "event_registrations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "id_documents_id" integer;
  ALTER TABLE "event_registrations_members" ADD CONSTRAINT "event_registrations_members_id_document_id_id_documents_id_fk" FOREIGN KEY ("id_document_id") REFERENCES "public"."id_documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_registrations_members" ADD CONSTRAINT "event_registrations_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_registrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "event_registrations_members_order_idx" ON "event_registrations_members" USING btree ("_order");
  CREATE INDEX "event_registrations_members_parent_id_idx" ON "event_registrations_members" USING btree ("_parent_id");
  CREATE INDEX "event_registrations_members_id_document_idx" ON "event_registrations_members" USING btree ("id_document_id");
  CREATE UNIQUE INDEX "event_registrations_registration_code_idx" ON "event_registrations" USING btree ("registration_code");
  CREATE INDEX "event_registrations_event_idx" ON "event_registrations" USING btree ("event_id");
  CREATE INDEX "event_registrations_leader_email_idx" ON "event_registrations" USING btree ("leader_email");
  CREATE INDEX "event_registrations_leader_phone_idx" ON "event_registrations" USING btree ("leader_phone");
  CREATE INDEX "event_registrations_updated_at_idx" ON "event_registrations" USING btree ("updated_at");
  CREATE INDEX "event_registrations_created_at_idx" ON "event_registrations" USING btree ("created_at");
  CREATE INDEX "id_documents_registration_code_idx" ON "id_documents" USING btree ("registration_code");
  CREATE INDEX "id_documents_updated_at_idx" ON "id_documents" USING btree ("updated_at");
  CREATE INDEX "id_documents_created_at_idx" ON "id_documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "id_documents_filename_idx" ON "id_documents" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_registrations_fk" FOREIGN KEY ("event_registrations_id") REFERENCES "public"."event_registrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_id_documents_fk" FOREIGN KEY ("id_documents_id") REFERENCES "public"."id_documents"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_event_registrations_id_idx" ON "payload_locked_documents_rels" USING btree ("event_registrations_id");
  CREATE INDEX "payload_locked_documents_rels_id_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("id_documents_id");`)
  // Razorpay payment page "Select event" options (exact text, some with spaces); only fills empty values
  await db.execute(sql`
  UPDATE "events" SET "payment_event_label" = CASE "slug"
    WHEN 'hackathon' THEN 'Hackathon'
    WHEN 'robo-soccer' THEN 'Robo-soccer'
    WHEN 'robo-race' THEN 'Robo-race'
    WHEN 'robo-expo' THEN 'Robo- Expo'
    WHEN 'robo-ideathon' THEN 'Robo - Ideathon '
  END
  WHERE "payment_event_label" IS NULL
    AND "slug" IN ('hackathon', 'robo-soccer', 'robo-race', 'robo-expo', 'robo-ideathon');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_registrations_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_registrations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "id_documents" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "event_registrations_members" CASCADE;
  DROP TABLE "event_registrations" CASCADE;
  DROP TABLE "id_documents" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_event_registrations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_id_documents_fk";
  
  DROP INDEX "payload_locked_documents_rels_event_registrations_id_idx";
  DROP INDEX "payload_locked_documents_rels_id_documents_id_idx";
  ALTER TABLE "events" DROP COLUMN "payment_event_label";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "event_registrations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "id_documents_id";
  DROP TYPE "public"."enum_event_registrations_status";
  DROP TYPE "public"."enum_event_registrations_payment_status";
  DROP TYPE "public"."enum_event_registrations_id_verification";`)
}
