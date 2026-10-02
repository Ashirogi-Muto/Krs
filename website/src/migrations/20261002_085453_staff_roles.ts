import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('REGISTRATION', 'TECH_EVENT', 'LOGISTICS', 'DISCIPLINE', 'TECH_SUPPORT', 'MEDIA', 'SPONSORS', 'DECORATION', 'FINANCE', 'TEAM_HEAD', 'CORE_MEMBER', 'SUPERVISOR', 'PRESIDENT', 'EVENT_HEAD', 'TREASURER');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'PARTICIPANT'::text;
  -- Old single team roles become a "Team member" with the matching staff role (none existed on 2 Oct 2026)
  INSERT INTO "users_roles" ("order", "parent_id", "value")
    SELECT 1, "id", (CASE "role" WHEN 'ORGANIZER' THEN 'EVENT_HEAD' WHEN 'FINANCE' THEN 'FINANCE'
                     WHEN 'VERIFIER' THEN 'REGISTRATION' WHEN 'COORDINATOR' THEN 'TECH_EVENT' END)::"public"."enum_users_roles"
    FROM "users" WHERE "role" IN ('ORGANIZER', 'FINANCE', 'VERIFIER', 'COORDINATOR');
  UPDATE "users" SET "role" = 'STAFF' WHERE "role" IN ('ORGANIZER', 'FINANCE', 'VERIFIER', 'COORDINATOR');
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'STAFF', 'JUDGE', 'PARTICIPANT');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'PARTICIPANT'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'PARTICIPANT'::text;
  -- Team members lose CMS access on rollback (the old schema has no STAFF)
  UPDATE "users" SET "role" = 'PARTICIPANT' WHERE "role" = 'STAFF';
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'ORGANIZER', 'FINANCE', 'VERIFIER', 'COORDINATOR', 'JUDGE', 'PARTICIPANT');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'PARTICIPANT'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  DROP TYPE "public"."enum_users_roles";`)
}
