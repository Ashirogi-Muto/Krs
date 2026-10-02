import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_resources_resource_type" ADD VALUE 'PROJECT' BEFORE 'EXTERNAL';
  ALTER TABLE "projects" ADD COLUMN "team_lead" varchar;
  ALTER TABLE "projects" ADD COLUMN "cover_image_id" integer;
  ALTER TABLE "projects" ADD COLUMN "video_url" varchar;
  ALTER TABLE "projects" ADD COLUMN "drive_url" varchar;
  ALTER TABLE "projects" ADD COLUMN "published" boolean DEFAULT true;
  ALTER TABLE "projects" ADD COLUMN "needs_review" boolean DEFAULT false;
  ALTER TABLE "posts" ADD COLUMN "cover_image_id" integer;
  ALTER TABLE "posts" ADD COLUMN "published" boolean DEFAULT true;
  ALTER TABLE "posts" ADD COLUMN "needs_review" boolean DEFAULT false;
  ALTER TABLE "resources" ADD COLUMN "drive_url" varchar;
  ALTER TABLE "resources" ADD COLUMN "published" boolean DEFAULT true;
  ALTER TABLE "resources" ADD COLUMN "needs_review" boolean DEFAULT false;
  ALTER TABLE "people" ADD COLUMN "photo_id" integer;
  ALTER TABLE "people" ADD COLUMN "sort_order" numeric DEFAULT 100;
  ALTER TABLE "people" ADD COLUMN "published" boolean DEFAULT true;
  ALTER TABLE "people" ADD COLUMN "needs_review" boolean DEFAULT false;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "projects_cover_image_idx" ON "projects" USING btree ("cover_image_id");
  CREATE INDEX "projects_published_idx" ON "projects" USING btree ("published");
  CREATE INDEX "posts_cover_image_idx" ON "posts" USING btree ("cover_image_id");
  CREATE INDEX "posts_published_idx" ON "posts" USING btree ("published");
  CREATE INDEX "resources_published_idx" ON "resources" USING btree ("published");
  CREATE INDEX "people_photo_idx" ON "people" USING btree ("photo_id");
  CREATE INDEX "people_published_idx" ON "people" USING btree ("published");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" DROP CONSTRAINT "projects_cover_image_id_media_id_fk";
  
  ALTER TABLE "posts" DROP CONSTRAINT "posts_cover_image_id_media_id_fk";
  
  ALTER TABLE "people" DROP CONSTRAINT "people_photo_id_media_id_fk";
  
  ALTER TABLE "resources" ALTER COLUMN "resource_type" SET DATA TYPE text;
  ALTER TABLE "resources" ALTER COLUMN "resource_type" SET DEFAULT 'ARTICLE'::text;
  DROP TYPE "public"."enum_resources_resource_type";
  CREATE TYPE "public"."enum_resources_resource_type" AS ENUM('ARTICLE', 'TUTORIAL', 'PDF', 'VIDEO', 'EXTERNAL');
  ALTER TABLE "resources" ALTER COLUMN "resource_type" SET DEFAULT 'ARTICLE'::"public"."enum_resources_resource_type";
  ALTER TABLE "resources" ALTER COLUMN "resource_type" SET DATA TYPE "public"."enum_resources_resource_type" USING "resource_type"::"public"."enum_resources_resource_type";
  DROP INDEX "projects_cover_image_idx";
  DROP INDEX "projects_published_idx";
  DROP INDEX "posts_cover_image_idx";
  DROP INDEX "posts_published_idx";
  DROP INDEX "resources_published_idx";
  DROP INDEX "people_photo_idx";
  DROP INDEX "people_published_idx";
  ALTER TABLE "projects" DROP COLUMN "team_lead";
  ALTER TABLE "projects" DROP COLUMN "cover_image_id";
  ALTER TABLE "projects" DROP COLUMN "video_url";
  ALTER TABLE "projects" DROP COLUMN "drive_url";
  ALTER TABLE "projects" DROP COLUMN "published";
  ALTER TABLE "projects" DROP COLUMN "needs_review";
  ALTER TABLE "posts" DROP COLUMN "cover_image_id";
  ALTER TABLE "posts" DROP COLUMN "published";
  ALTER TABLE "posts" DROP COLUMN "needs_review";
  ALTER TABLE "resources" DROP COLUMN "drive_url";
  ALTER TABLE "resources" DROP COLUMN "published";
  ALTER TABLE "resources" DROP COLUMN "needs_review";
  ALTER TABLE "people" DROP COLUMN "photo_id";
  ALTER TABLE "people" DROP COLUMN "sort_order";
  ALTER TABLE "people" DROP COLUMN "published";
  ALTER TABLE "people" DROP COLUMN "needs_review";`)
}
