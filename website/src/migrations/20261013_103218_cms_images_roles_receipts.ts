import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Owner, 13 Oct 2026. Additive except one approved removal:
 * - new access-role permissions (enum values): delete registrations / ID files / events / emails, add events, edit the
 *   email queue, delete form submissions, Staff & admin texts, stored payment reports, data retention, team accounts;
 * - Site settings → Logos & icons (5 optional images), Competitions hub background picture, blog cards' pictures for
 *   posts without a cover (pages_rels), new CMS wording (receipt rule, team accounts, Super Admin refusal);
 * - REMOVED (owner approved, 13 Oct 2026): the old fixed staff `roles` field (table users_roles, enum) and its
 *   `legacy_roles_migrated` flag. Replaced by access roles on 8 Oct; one row left (account 29, Team Head: no rights).
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'registrations.delete' BEFORE 'idDocuments.edit';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'idDocuments.delete' BEFORE 'submissions.view';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'events.create' BEFORE 'announcements.create';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'events.delete' BEFORE 'announcements.create';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'emailOutbox.edit' BEFORE 'formSubmissions.view';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'emailOutbox.delete' BEFORE 'formSubmissions.view';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'formSubmissions.delete' BEFORE 'shortLinks.view';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'globals.staffTexts' BEFORE 'tools.checkin';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'paymentReports.manage' BEFORE 'dashboard.overview';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'admin.retention' BEFORE 'dashboard.overview';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'accounts.team' BEFORE 'accessRoles.manage';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'accounts.delete' BEFORE 'accessRoles.manage';
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "users_roles" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_roles" CASCADE;
  ALTER TABLE "staff_texts" ALTER COLUMN "access_roles_err_admin_only" SET DEFAULT '"Manage access roles" and "Team accounts" can only be granted by an admin.';
  ALTER TABLE "pages_blocks_competitions_hub" ADD COLUMN "background_image_id" integer;
  ALTER TABLE "_pages_v_blocks_competitions_hub" ADD COLUMN "background_image_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "brand_images_krs_icon_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "brand_images_aurix_icon_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "brand_images_share_logo_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "brand_images_email_logo_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "brand_images_search_logo_id" integer;
  ALTER TABLE "form_texts" ADD COLUMN "messages_cms_team_account_type" varchar DEFAULT 'With "Team accounts" you can create Team member and Judge accounts only.';
  ALTER TABLE "form_texts" ADD COLUMN "messages_cms_account_has_teams" varchar DEFAULT 'This account is linked to a team registration and cannot be deleted.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_receipt_first" varchar DEFAULT 'Upload your payment receipt first. Once it is uploaded (or your payment is verified by the organisers), you can submit here.';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_receipt_button" varchar DEFAULT 'Upload payment receipt';
  ALTER TABLE "portal_texts" ADD COLUMN "submissions_err_receipt" varchar DEFAULT 'Upload your payment receipt first (on the payment-done page), then submit.';
  ALTER TABLE "staff_texts" ADD COLUMN "checkin_block_receipt" varchar DEFAULT 'No payment receipt and payment not verified: the team must upload its receipt at /aurix/payment-done (or the finance team verifies the payment) before check-in.';
  ALTER TABLE "staff_texts" ADD COLUMN "admin_api_checkin_receipt" varchar DEFAULT 'This team has not uploaded its payment receipt and its payment is not verified: it cannot be checked in yet.';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_err_super_only" varchar DEFAULT 'Only the Super Admin can create, change or add people to a role with permanent deletions: {key}.';
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_media_id_idx" ON "pages_rels" USING btree ("media_id");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_media_id_idx" ON "_pages_v_rels" USING btree ("media_id");
  ALTER TABLE "pages_blocks_competitions_hub" ADD CONSTRAINT "pages_blocks_competitions_hub_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_competitions_hub" ADD CONSTRAINT "_pages_v_blocks_competitions_hub_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_brand_images_krs_icon_id_media_id_fk" FOREIGN KEY ("brand_images_krs_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_brand_images_aurix_icon_id_media_id_fk" FOREIGN KEY ("brand_images_aurix_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_brand_images_share_logo_id_media_id_fk" FOREIGN KEY ("brand_images_share_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_brand_images_email_logo_id_media_id_fk" FOREIGN KEY ("brand_images_email_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_brand_images_search_logo_id_media_id_fk" FOREIGN KEY ("brand_images_search_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_competitions_hub_background_image_idx" ON "pages_blocks_competitions_hub" USING btree ("background_image_id");
  CREATE INDEX "_pages_v_blocks_competitions_hub_background_image_idx" ON "_pages_v_blocks_competitions_hub" USING btree ("background_image_id");
  CREATE INDEX "site_settings_brand_images_brand_images_krs_icon_idx" ON "site_settings" USING btree ("brand_images_krs_icon_id");
  CREATE INDEX "site_settings_brand_images_brand_images_aurix_icon_idx" ON "site_settings" USING btree ("brand_images_aurix_icon_id");
  CREATE INDEX "site_settings_brand_images_brand_images_share_logo_idx" ON "site_settings" USING btree ("brand_images_share_logo_id");
  CREATE INDEX "site_settings_brand_images_brand_images_email_logo_idx" ON "site_settings" USING btree ("brand_images_email_logo_id");
  CREATE INDEX "site_settings_brand_images_brand_images_search_logo_idx" ON "site_settings" USING btree ("brand_images_search_logo_id");
  ALTER TABLE "users" DROP COLUMN "legacy_roles_migrated";
  DROP TYPE "public"."enum_users_roles";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('REGISTRATION', 'TECH_EVENT', 'LOGISTICS', 'DISCIPLINE', 'TECH_SUPPORT', 'MEDIA', 'SPONSORS', 'DECORATION', 'FINANCE', 'TEAM_HEAD', 'CORE_MEMBER', 'SUPERVISOR', 'PRESIDENT', 'EVENT_HEAD', 'TREASURER');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "pages_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  ALTER TABLE "pages_blocks_competitions_hub" DROP CONSTRAINT "pages_blocks_competitions_hub_background_image_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_competitions_hub" DROP CONSTRAINT "_pages_v_blocks_competitions_hub_background_image_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_brand_images_krs_icon_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_brand_images_aurix_icon_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_brand_images_share_logo_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_brand_images_email_logo_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_brand_images_search_logo_id_media_id_fk";
  
  ALTER TABLE "access_roles_permissions" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_access_roles_permissions";
  CREATE TYPE "public"."enum_access_roles_permissions" AS ENUM('registrations.view', 'registrations.contacts', 'registrations.leaderPhone', 'registrations.ids', 'registrations.money', 'registrations.portalAccounts', 'registrations.notes', 'registrations.editStatus', 'registrations.editIdCheck', 'registrations.editPayment', 'registrations.editDetails', 'registrations.editCheckin', 'idDocuments.edit', 'submissions.view', 'submissions.download', 'submissions.review', 'submissions.delete', 'events.viewDrafts', 'events.editTexts', 'events.editLocked', 'announcements.create', 'announcements.edit', 'announcements.delete', 'emailOutbox.view', 'formSubmissions.view', 'formSubmissions.handle', 'shortLinks.view', 'shortLinks.create', 'shortLinks.edit', 'shortLinks.delete', 'pages.view', 'pages.create', 'pages.edit', 'pages.delete', 'pages.versions', 'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'posts.view', 'posts.create', 'posts.edit', 'posts.delete', 'resources.view', 'resources.create', 'resources.edit', 'resources.delete', 'people.view', 'people.create', 'people.edit', 'people.delete', 'gallery.view', 'gallery.create', 'gallery.edit', 'gallery.delete', 'media.create', 'media.edit', 'media.delete', 'globals.siteSettings', 'globals.navigation', 'globals.eventPageLabels', 'globals.formTexts', 'globals.portalTexts', 'globals.pageTexts', 'globals.legalPages', 'globals.aurixSchedule', 'tools.checkin', 'tools.paymentMatching', 'tools.idReupload', 'exports.full', 'exports.finance', 'exports.checkin', 'exports.roster', 'dashboard.overview', 'dashboard.finance', 'dashboard.desk', 'dashboard.events', 'dashboard.counts', 'dashboard.totals', 'admin.pageVisibility', 'admin.participants', 'accessRoles.manage');
  ALTER TABLE "access_roles_permissions" ALTER COLUMN "value" SET DATA TYPE "public"."enum_access_roles_permissions" USING "value"::"public"."enum_access_roles_permissions";
  DROP INDEX "pages_blocks_competitions_hub_background_image_idx";
  DROP INDEX "_pages_v_blocks_competitions_hub_background_image_idx";
  DROP INDEX "site_settings_brand_images_brand_images_krs_icon_idx";
  DROP INDEX "site_settings_brand_images_brand_images_aurix_icon_idx";
  DROP INDEX "site_settings_brand_images_brand_images_share_logo_idx";
  DROP INDEX "site_settings_brand_images_brand_images_email_logo_idx";
  DROP INDEX "site_settings_brand_images_brand_images_search_logo_idx";
  ALTER TABLE "staff_texts" ALTER COLUMN "access_roles_err_admin_only" SET DEFAULT '"Manage access roles" can only be granted by an admin.';
  ALTER TABLE "users" ADD COLUMN "legacy_roles_migrated" boolean DEFAULT false;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  ALTER TABLE "pages_blocks_competitions_hub" DROP COLUMN "background_image_id";
  ALTER TABLE "_pages_v_blocks_competitions_hub" DROP COLUMN "background_image_id";
  ALTER TABLE "site_settings" DROP COLUMN "brand_images_krs_icon_id";
  ALTER TABLE "site_settings" DROP COLUMN "brand_images_aurix_icon_id";
  ALTER TABLE "site_settings" DROP COLUMN "brand_images_share_logo_id";
  ALTER TABLE "site_settings" DROP COLUMN "brand_images_email_logo_id";
  ALTER TABLE "site_settings" DROP COLUMN "brand_images_search_logo_id";
  ALTER TABLE "form_texts" DROP COLUMN "messages_cms_team_account_type";
  ALTER TABLE "form_texts" DROP COLUMN "messages_cms_account_has_teams";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_receipt_first";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_receipt_button";
  ALTER TABLE "portal_texts" DROP COLUMN "submissions_err_receipt";
  ALTER TABLE "staff_texts" DROP COLUMN "checkin_block_receipt";
  ALTER TABLE "staff_texts" DROP COLUMN "admin_api_checkin_receipt";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_err_super_only";`)
}
