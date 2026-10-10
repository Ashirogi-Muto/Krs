import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "gallery_albums_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "media" ALTER COLUMN "alt" DROP NOT NULL;
  ALTER TABLE "gallery_albums" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "gallery_albums" ALTER COLUMN "category" DROP NOT NULL;
  ALTER TABLE "gallery_albums" ALTER COLUMN "caption" DROP NOT NULL;
  ALTER TABLE "events" ADD COLUMN "notice_title" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "team_exact" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "team_range" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "team_operator" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "team_unknown" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "status_draft" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "status_announced" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "status_open" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "status_closed" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "status_live" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "status_judging" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "status_results_pending" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "status_results" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "status_archived" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "countdown_days" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "countdown_hours" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "countdown_mins" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "countdown_secs" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "countdown_over" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "status_code_placeholder" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "status_members_title" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "status_leader_badge" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "status_registered_note" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_confirm_intro" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_confirm_password" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_confirm_button" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_confirm_help" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_confirm_help_link" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_confirm_help_after" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_confirm_wrong_password" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "account_reset_incomplete" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "general_skip_link" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "general_legal_eyebrow" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "general_share_eyebrow" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "general_share_title" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "general_share_subtitle" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "general_coming_soon" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "general_registration_open" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "general_dates_tba" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "general_dates_tba_in_text" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "general_select_placeholder" varchar;
  ALTER TABLE "gallery_albums_rels" ADD CONSTRAINT "gallery_albums_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."gallery_albums"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery_albums_rels" ADD CONSTRAINT "gallery_albums_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "gallery_albums_rels_order_idx" ON "gallery_albums_rels" USING btree ("order");
  CREATE INDEX "gallery_albums_rels_parent_idx" ON "gallery_albums_rels" USING btree ("parent_id");
  CREATE INDEX "gallery_albums_rels_path_idx" ON "gallery_albums_rels" USING btree ("path");
  CREATE INDEX "gallery_albums_rels_media_id_idx" ON "gallery_albums_rels" USING btree ("media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "gallery_albums_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "gallery_albums_rels" CASCADE;
  ALTER TABLE "media" ALTER COLUMN "alt" SET NOT NULL;
  ALTER TABLE "gallery_albums" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "gallery_albums" ALTER COLUMN "category" SET NOT NULL;
  ALTER TABLE "gallery_albums" ALTER COLUMN "caption" SET NOT NULL;
  ALTER TABLE "events" DROP COLUMN "notice_title";
  ALTER TABLE "event_page_labels" DROP COLUMN "team_exact";
  ALTER TABLE "event_page_labels" DROP COLUMN "team_range";
  ALTER TABLE "event_page_labels" DROP COLUMN "team_operator";
  ALTER TABLE "event_page_labels" DROP COLUMN "team_unknown";
  ALTER TABLE "event_page_labels" DROP COLUMN "status_draft";
  ALTER TABLE "event_page_labels" DROP COLUMN "status_announced";
  ALTER TABLE "event_page_labels" DROP COLUMN "status_open";
  ALTER TABLE "event_page_labels" DROP COLUMN "status_closed";
  ALTER TABLE "event_page_labels" DROP COLUMN "status_live";
  ALTER TABLE "event_page_labels" DROP COLUMN "status_judging";
  ALTER TABLE "event_page_labels" DROP COLUMN "status_results_pending";
  ALTER TABLE "event_page_labels" DROP COLUMN "status_results";
  ALTER TABLE "event_page_labels" DROP COLUMN "status_archived";
  ALTER TABLE "event_page_labels" DROP COLUMN "countdown_days";
  ALTER TABLE "event_page_labels" DROP COLUMN "countdown_hours";
  ALTER TABLE "event_page_labels" DROP COLUMN "countdown_mins";
  ALTER TABLE "event_page_labels" DROP COLUMN "countdown_secs";
  ALTER TABLE "event_page_labels" DROP COLUMN "countdown_over";
  ALTER TABLE "form_texts" DROP COLUMN "status_code_placeholder";
  ALTER TABLE "form_texts" DROP COLUMN "status_members_title";
  ALTER TABLE "form_texts" DROP COLUMN "status_leader_badge";
  ALTER TABLE "form_texts" DROP COLUMN "status_registered_note";
  ALTER TABLE "form_texts" DROP COLUMN "account_confirm_intro";
  ALTER TABLE "form_texts" DROP COLUMN "account_confirm_password";
  ALTER TABLE "form_texts" DROP COLUMN "account_confirm_button";
  ALTER TABLE "form_texts" DROP COLUMN "account_confirm_help";
  ALTER TABLE "form_texts" DROP COLUMN "account_confirm_help_link";
  ALTER TABLE "form_texts" DROP COLUMN "account_confirm_help_after";
  ALTER TABLE "form_texts" DROP COLUMN "account_confirm_wrong_password";
  ALTER TABLE "form_texts" DROP COLUMN "account_reset_incomplete";
  ALTER TABLE "form_texts" DROP COLUMN "general_skip_link";
  ALTER TABLE "form_texts" DROP COLUMN "general_legal_eyebrow";
  ALTER TABLE "form_texts" DROP COLUMN "general_share_eyebrow";
  ALTER TABLE "form_texts" DROP COLUMN "general_share_title";
  ALTER TABLE "form_texts" DROP COLUMN "general_share_subtitle";
  ALTER TABLE "form_texts" DROP COLUMN "general_coming_soon";
  ALTER TABLE "form_texts" DROP COLUMN "general_registration_open";
  ALTER TABLE "form_texts" DROP COLUMN "general_dates_tba";
  ALTER TABLE "form_texts" DROP COLUMN "general_dates_tba_in_text";
  ALTER TABLE "form_texts" DROP COLUMN "general_select_placeholder";`)
}
