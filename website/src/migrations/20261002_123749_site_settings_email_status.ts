import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_event_registrations_confirmation_email" AS ENUM('PENDING', 'RETRYING', 'SENT', 'FAILED');
  CREATE TYPE "public"."enum_site_settings_social_links_platform" AS ENUM('Instagram', 'LinkedIn', 'GitHub', 'YouTube', 'X', 'WhatsApp', 'Other');
  CREATE TYPE "public"."enum_site_settings_hidden_pages" AS ENUM('/team', '/join', '/contact', '/insights', '/gallery', '/events', '/learning', '/blogs', '/projects', '/aurix/schedule', '/aurix/results', '/aurix/portal', '/login', '/register', '/judge');
  CREATE TABLE "site_settings_domains" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"domain" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_site_settings_social_links_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_hidden_pages" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_site_settings_hidden_pages",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"short_name" varchar NOT NULL,
  	"institution" varchar NOT NULL,
  	"motto" varchar,
  	"location" varchar,
  	"about" varchar,
  	"contact_email" varchar,
  	"footer_blurb" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "event_registrations" ADD COLUMN "confirmation_email" "enum_event_registrations_confirmation_email";
  ALTER TABLE "email_outbox" ADD COLUMN "reference" varchar;
  ALTER TABLE "email_outbox" ADD COLUMN "dedupe_key" varchar;
  ALTER TABLE "email_outbox" ADD COLUMN "last_attempt_at" timestamp(3) with time zone;
  ALTER TABLE "site_settings_domains" ADD CONSTRAINT "site_settings_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_pillars" ADD CONSTRAINT "site_settings_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_social_links" ADD CONSTRAINT "site_settings_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_hidden_pages" ADD CONSTRAINT "site_settings_hidden_pages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_domains_order_idx" ON "site_settings_domains" USING btree ("_order");
  CREATE INDEX "site_settings_domains_parent_id_idx" ON "site_settings_domains" USING btree ("_parent_id");
  CREATE INDEX "site_settings_pillars_order_idx" ON "site_settings_pillars" USING btree ("_order");
  CREATE INDEX "site_settings_pillars_parent_id_idx" ON "site_settings_pillars" USING btree ("_parent_id");
  CREATE INDEX "site_settings_social_links_order_idx" ON "site_settings_social_links" USING btree ("_order");
  CREATE INDEX "site_settings_social_links_parent_id_idx" ON "site_settings_social_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_hidden_pages_order_idx" ON "site_settings_hidden_pages" USING btree ("order");
  CREATE INDEX "site_settings_hidden_pages_parent_idx" ON "site_settings_hidden_pages" USING btree ("parent_id");
  CREATE INDEX "email_outbox_reference_idx" ON "email_outbox" USING btree ("reference");
  CREATE UNIQUE INDEX "email_outbox_dedupe_key_idx" ON "email_outbox" USING btree ("dedupe_key");
  -- Existing queued emails: registration code, de-duplication key, and the registration's status column
  UPDATE "email_outbox" o SET "reference" = r."registration_code", "dedupe_key" = o."kind"::text || ':' || o."registration_id"
    FROM "event_registrations" r WHERE r."id" = o."registration_id" AND o."dedupe_key" IS NULL;
  UPDATE "event_registrations" r SET "confirmation_email" = CASE o."status" WHEN 'SENT' THEN 'SENT'::"enum_event_registrations_confirmation_email" WHEN 'FAILED' THEN 'FAILED'::"enum_event_registrations_confirmation_email" ELSE 'PENDING'::"enum_event_registrations_confirmation_email" END
    FROM "email_outbox" o WHERE o."registration_id" = r."id" AND o."kind" = 'REGISTRATION_CONFIRMATION';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings_domains" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_pillars" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_social_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_hidden_pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "site_settings_domains" CASCADE;
  DROP TABLE "site_settings_pillars" CASCADE;
  DROP TABLE "site_settings_social_links" CASCADE;
  DROP TABLE "site_settings_hidden_pages" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP INDEX "email_outbox_reference_idx";
  DROP INDEX "email_outbox_dedupe_key_idx";
  ALTER TABLE "event_registrations" DROP COLUMN "confirmation_email";
  ALTER TABLE "email_outbox" DROP COLUMN "reference";
  ALTER TABLE "email_outbox" DROP COLUMN "dedupe_key";
  ALTER TABLE "email_outbox" DROP COLUMN "last_attempt_at";
  DROP TYPE "public"."enum_event_registrations_confirmation_email";
  DROP TYPE "public"."enum_site_settings_social_links_platform";
  DROP TYPE "public"."enum_site_settings_hidden_pages";`)
}
