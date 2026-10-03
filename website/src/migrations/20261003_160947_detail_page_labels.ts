import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_texts" ADD COLUMN "project_page_back" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "project_page_status" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "project_page_year" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "project_page_video" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "project_page_photos" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "project_page_repo" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "project_page_hardware" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "project_page_software" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "project_page_results_eyebrow" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "project_page_results_title" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "project_page_tech" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "project_page_tutorials" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "project_page_aurix_button" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "learning_page_back" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "learning_page_difficulty" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "learning_page_cta_title" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "learning_page_cta_text" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "learning_page_cta_button" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "learning_page_cta_href" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "blog_page_back" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "blog_page_read_label" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "blog_page_cta_title" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "blog_page_cta_text" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "blog_page_cta_button" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "blog_page_cta_href" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_texts" DROP COLUMN "project_page_back";
  ALTER TABLE "form_texts" DROP COLUMN "project_page_status";
  ALTER TABLE "form_texts" DROP COLUMN "project_page_year";
  ALTER TABLE "form_texts" DROP COLUMN "project_page_video";
  ALTER TABLE "form_texts" DROP COLUMN "project_page_photos";
  ALTER TABLE "form_texts" DROP COLUMN "project_page_repo";
  ALTER TABLE "form_texts" DROP COLUMN "project_page_hardware";
  ALTER TABLE "form_texts" DROP COLUMN "project_page_software";
  ALTER TABLE "form_texts" DROP COLUMN "project_page_results_eyebrow";
  ALTER TABLE "form_texts" DROP COLUMN "project_page_results_title";
  ALTER TABLE "form_texts" DROP COLUMN "project_page_tech";
  ALTER TABLE "form_texts" DROP COLUMN "project_page_tutorials";
  ALTER TABLE "form_texts" DROP COLUMN "project_page_aurix_button";
  ALTER TABLE "form_texts" DROP COLUMN "learning_page_back";
  ALTER TABLE "form_texts" DROP COLUMN "learning_page_difficulty";
  ALTER TABLE "form_texts" DROP COLUMN "learning_page_cta_title";
  ALTER TABLE "form_texts" DROP COLUMN "learning_page_cta_text";
  ALTER TABLE "form_texts" DROP COLUMN "learning_page_cta_button";
  ALTER TABLE "form_texts" DROP COLUMN "learning_page_cta_href";
  ALTER TABLE "form_texts" DROP COLUMN "blog_page_back";
  ALTER TABLE "form_texts" DROP COLUMN "blog_page_read_label";
  ALTER TABLE "form_texts" DROP COLUMN "blog_page_cta_title";
  ALTER TABLE "form_texts" DROP COLUMN "blog_page_cta_text";
  ALTER TABLE "form_texts" DROP COLUMN "blog_page_cta_button";
  ALTER TABLE "form_texts" DROP COLUMN "blog_page_cta_href";`)
}
