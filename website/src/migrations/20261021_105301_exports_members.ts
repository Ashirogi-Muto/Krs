import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'exports.members' BEFORE 'paymentReports.manage';
  CREATE TABLE "export_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bar_title" varchar DEFAULT 'Download this list as CSV (filters and search applied):',
  	"bar_title_all" varchar DEFAULT 'Download as CSV (all teams you can see):',
  	"bar_members" varchar DEFAULT 'Team members',
  	"bar_dashboard_members" varchar DEFAULT 'Team members CSV',
  	"bar_full" varchar DEFAULT 'Full',
  	"bar_finance" varchar DEFAULT 'Finance',
  	"bar_checkin" varchar DEFAULT 'Check-in',
  	"bar_roster" varchar DEFAULT 'Roster',
  	"bar_help" varchar DEFAULT 'Team members = one row per person with their details; the other files are as on the dashboard. Contacts, money and notes appear only for the competitions you may see them for.',
  	"bar_bad_filter" varchar DEFAULT 'This filter cannot be used for an export (or uses a field you cannot see). Change the filter and try again.',
  	"csv_role" varchar DEFAULT 'Role',
  	"csv_leader" varchar DEFAULT 'Leader',
  	"csv_member" varchar DEFAULT 'Member',
  	"csv_email" varchar DEFAULT 'Email',
  	"csv_phone" varchar DEFAULT 'Phone',
  	"csv_answers" varchar DEFAULT 'Answers',
  	"csv_id_uploaded" varchar DEFAULT 'Student ID uploaded',
  	"csv_yes" varchar DEFAULT 'Yes',
  	"csv_no" varchar DEFAULT 'No',
  	"csv_team_status" varchar DEFAULT 'Team status',
  	"csv_file" varchar DEFAULT 'aurix-team-members',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "export_texts" CASCADE;
  ALTER TABLE "access_roles_permissions" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_access_roles_permissions";
  CREATE TYPE "public"."enum_access_roles_permissions" AS ENUM('registrations.view', 'registrations.contacts', 'registrations.leaderPhone', 'registrations.ids', 'registrations.money', 'registrations.portalAccounts', 'registrations.notes', 'registrations.editStatus', 'registrations.editIdCheck', 'registrations.editPayment', 'registrations.editDetails', 'registrations.editCheckin', 'registrations.delete', 'idDocuments.edit', 'idDocuments.delete', 'submissions.view', 'submissions.download', 'submissions.review', 'submissions.delete', 'judging.manage', 'judging.results', 'tournaments.manage', 'tournaments.score', 'events.viewDrafts', 'events.editTexts', 'events.editLocked', 'events.create', 'events.delete', 'announcements.create', 'announcements.edit', 'announcements.delete', 'coupons.view', 'coupons.create', 'coupons.edit', 'coupons.delete', 'coupons.editOwn', 'coupons.deleteOwn', 'coupons.usage', 'emailOutbox.view', 'emailOutbox.edit', 'emailOutbox.delete', 'formSubmissions.view', 'formSubmissions.handle', 'formSubmissions.delete', 'shortLinks.view', 'shortLinks.create', 'shortLinks.edit', 'shortLinks.delete', 'pages.view', 'pages.create', 'pages.edit', 'pages.delete', 'pages.versions', 'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'posts.view', 'posts.create', 'posts.edit', 'posts.delete', 'resources.view', 'resources.create', 'resources.edit', 'resources.delete', 'people.view', 'people.create', 'people.edit', 'people.delete', 'gallery.view', 'gallery.create', 'gallery.edit', 'gallery.delete', 'media.create', 'media.edit', 'media.delete', 'globals.siteSettings', 'globals.navigation', 'globals.eventPageLabels', 'globals.formTexts', 'globals.portalTexts', 'globals.pageTexts', 'globals.legalPages', 'globals.aurixSchedule', 'globals.staffTexts', 'tools.checkin', 'tools.paymentMatching', 'tools.idReupload', 'exports.full', 'exports.finance', 'exports.checkin', 'exports.roster', 'paymentReports.manage', 'admin.retention', 'dashboard.overview', 'dashboard.finance', 'dashboard.desk', 'dashboard.events', 'dashboard.counts', 'dashboard.totals', 'admin.pageVisibility', 'admin.participants', 'accounts.team', 'accounts.delete', 'accessRoles.manage');
  ALTER TABLE "access_roles_permissions" ALTER COLUMN "value" SET DATA TYPE "public"."enum_access_roles_permissions" USING "value"::"public"."enum_access_roles_permissions";`)
}
