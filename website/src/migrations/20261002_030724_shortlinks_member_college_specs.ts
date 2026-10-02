import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_short_links_destination_type" AS ENUM('EVENT', 'PATH', 'URL');
  CREATE TYPE "public"."enum_short_links_event_target" AS ENUM('DETAILS', 'REGISTER');
  CREATE TABLE "short_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"destination_type" "enum_short_links_destination_type" DEFAULT 'EVENT' NOT NULL,
  	"event_id" integer,
  	"event_target" "enum_short_links_event_target" DEFAULT 'DETAILS',
  	"path" varchar,
  	"url" varchar,
  	"active" boolean DEFAULT true,
  	"notes" varchar,
  	"clicks" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "events" ADD COLUMN "specs_summary" varchar;
  ALTER TABLE "event_registrations_members" ADD COLUMN "college" varchar;
  UPDATE "event_registrations_members" m SET "college" = r."college" FROM "event_registrations" r WHERE m."_parent_id" = r."id" AND m."college" IS NULL;
  UPDATE "event_registrations_members" SET "college" = '' WHERE "college" IS NULL;
  ALTER TABLE "event_registrations_members" ALTER COLUMN "college" SET NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "short_links_id" integer;
  ALTER TABLE "short_links" ADD CONSTRAINT "short_links_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "short_links_slug_idx" ON "short_links" USING btree ("slug");
  CREATE INDEX "short_links_event_idx" ON "short_links" USING btree ("event_id");
  CREATE INDEX "short_links_updated_at_idx" ON "short_links" USING btree ("updated_at");
  CREATE INDEX "short_links_created_at_idx" ON "short_links" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_short_links_fk" FOREIGN KEY ("short_links_id") REFERENCES "public"."short_links"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_short_links_id_idx" ON "payload_locked_documents_rels" USING btree ("short_links_id");`)
  // Starter short links (go.kalamroboticssociety.com/<slug>); skipped if a slug already exists
  await db.execute(sql`
  INSERT INTO "short_links" ("slug", "destination_type", "path", "notes")
  VALUES
    ('aurix', 'PATH', '/aurix', 'Main AURIX page'),
    ('register', 'PATH', '/aurix/register', 'Registration form (choose any competition)')
  ON CONFLICT ("slug") DO NOTHING;
  INSERT INTO "short_links" ("slug", "destination_type", "event_id", "event_target", "notes")
  SELECT v.slug, 'EVENT', e."id", v.target::"enum_short_links_event_target", v.notes
  FROM (VALUES
    ('soccer', 'robo-soccer', 'DETAILS', 'Robo Soccer details'),
    ('race', 'robo-race', 'DETAILS', 'Robo Race details'),
    ('expo', 'robo-expo', 'DETAILS', 'Robo Expo details'),
    ('ideathon', 'robo-ideathon', 'DETAILS', 'Robo Ideathon details'),
    ('hackathon', 'hackathon', 'DETAILS', 'Hackathon page'),
    ('soccer-register', 'robo-soccer', 'REGISTER', 'Robo Soccer registration'),
    ('race-register', 'robo-race', 'REGISTER', 'Robo Race registration'),
    ('expo-register', 'robo-expo', 'REGISTER', 'Robo Expo registration'),
    ('ideathon-register', 'robo-ideathon', 'REGISTER', 'Robo Ideathon registration')
  ) AS v(slug, event_slug, target, notes)
  JOIN "events" e ON e."slug" = v.event_slug
  ON CONFLICT ("slug") DO NOTHING;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "short_links" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "short_links" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_short_links_fk";
  
  DROP INDEX "payload_locked_documents_rels_short_links_id_idx";
  ALTER TABLE "events" DROP COLUMN "specs_summary";
  ALTER TABLE "event_registrations_members" DROP COLUMN "college";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "short_links_id";
  DROP TYPE "public"."enum_short_links_destination_type";
  DROP TYPE "public"."enum_short_links_event_target";`)
}
