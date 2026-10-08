import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_access_roles_permissions" AS ENUM('registrations.view', 'registrations.contacts', 'registrations.leaderPhone', 'registrations.ids', 'registrations.money', 'registrations.portalAccounts', 'registrations.notes', 'registrations.editStatus', 'registrations.editIdCheck', 'registrations.editPayment', 'registrations.editDetails', 'registrations.editCheckin', 'idDocuments.edit', 'submissions.view', 'submissions.download', 'submissions.review', 'submissions.delete', 'events.viewDrafts', 'events.editTexts', 'events.editLocked', 'announcements.create', 'announcements.edit', 'announcements.delete', 'emailOutbox.view', 'formSubmissions.view', 'formSubmissions.handle', 'shortLinks.view', 'shortLinks.create', 'shortLinks.edit', 'shortLinks.delete', 'pages.view', 'pages.create', 'pages.edit', 'pages.delete', 'pages.versions', 'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'posts.view', 'posts.create', 'posts.edit', 'posts.delete', 'resources.view', 'resources.create', 'resources.edit', 'resources.delete', 'people.view', 'people.create', 'people.edit', 'people.delete', 'gallery.view', 'gallery.create', 'gallery.edit', 'gallery.delete', 'media.create', 'media.edit', 'media.delete', 'globals.siteSettings', 'globals.navigation', 'globals.eventPageLabels', 'globals.formTexts', 'globals.portalTexts', 'globals.pageTexts', 'globals.legalPages', 'globals.aurixSchedule', 'tools.checkin', 'tools.paymentMatching', 'tools.idReupload', 'exports.full', 'exports.finance', 'exports.checkin', 'exports.roster', 'dashboard.overview', 'dashboard.finance', 'dashboard.desk', 'dashboard.events', 'dashboard.counts', 'dashboard.totals', 'admin.pageVisibility', 'admin.participants', 'accessRoles.manage');
  CREATE TYPE "public"."enum_access_roles_limited_collections" AS ENUM('pages', 'projects', 'posts', 'resources', 'people', 'gallery-albums', 'short-links', 'announcements');
  CREATE TYPE "public"."enum_access_roles_event_limit" AS ENUM('all', 'assigned', 'chosen');
  CREATE TABLE "access_roles_permissions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_access_roles_permissions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "access_roles_limited_collections" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_access_roles_limited_collections",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "access_roles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"event_limit" "enum_access_roles_event_limit" DEFAULT 'all' NOT NULL,
  	"preset" boolean DEFAULT false,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "access_roles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"events_id" integer,
  	"pages_id" integer,
  	"projects_id" integer,
  	"posts_id" integer,
  	"resources_id" integer,
  	"people_id" integer,
  	"gallery_albums_id" integer,
  	"short_links_id" integer,
  	"announcements_id" integer,
  	"users_id" integer
  );
  
  ALTER TABLE "users" ADD COLUMN "legacy_roles_migrated" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "access_roles_id" integer;
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_matrix_help" varchar DEFAULT 'Tick what people with this role may see and do. A grey box is something you cannot grant (you do not hold it yourself).';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_col_page" varchar DEFAULT 'CMS page';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_col_view" varchar DEFAULT 'View';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_col_create" varchar DEFAULT 'Create';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_col_edit" varchar DEFAULT 'Edit';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_col_delete" varchar DEFAULT 'Delete';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_col_more" varchar DEFAULT 'More';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_not_grantable" varchar DEFAULT 'You cannot grant this: you do not hold it yourself.';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_create_limited" varchar DEFAULT 'Not possible while this page is limited to chosen documents.';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_summary_none" varchar DEFAULT 'This role grants nothing yet.';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_summary" varchar DEFAULT '{n} permission(s) ticked.';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_err_unknown" varchar DEFAULT 'Unknown permission: {key}.';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_err_create_limited" varchar DEFAULT '"Create" is not possible on {page} while it is limited to chosen documents.';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_err_not_within" varchar DEFAULT 'You can only grant what you hold yourself (for the same events and documents): {key}.';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_err_admin_only" varchar DEFAULT '"Manage access roles" can only be granted by an admin.';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_err_own_role" varchar DEFAULT 'You cannot change or delete a role you hold yourself.';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_err_self" varchar DEFAULT 'You cannot add yourself to a role.';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_err_not_team" varchar DEFAULT 'Only team member accounts can be given access roles.';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_err_in_use" varchar DEFAULT 'Remove everyone from this role before deleting it.';
  ALTER TABLE "staff_texts" ADD COLUMN "access_roles_err_preset" varchar DEFAULT 'Only admins can change the preset flag.';
  ALTER TABLE "access_roles_permissions" ADD CONSTRAINT "access_roles_permissions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."access_roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "access_roles_limited_collections" ADD CONSTRAINT "access_roles_limited_collections_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."access_roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "access_roles" ADD CONSTRAINT "access_roles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "access_roles_rels" ADD CONSTRAINT "access_roles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."access_roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "access_roles_rels" ADD CONSTRAINT "access_roles_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "access_roles_rels" ADD CONSTRAINT "access_roles_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "access_roles_rels" ADD CONSTRAINT "access_roles_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "access_roles_rels" ADD CONSTRAINT "access_roles_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "access_roles_rels" ADD CONSTRAINT "access_roles_rels_resources_fk" FOREIGN KEY ("resources_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "access_roles_rels" ADD CONSTRAINT "access_roles_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "access_roles_rels" ADD CONSTRAINT "access_roles_rels_gallery_albums_fk" FOREIGN KEY ("gallery_albums_id") REFERENCES "public"."gallery_albums"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "access_roles_rels" ADD CONSTRAINT "access_roles_rels_short_links_fk" FOREIGN KEY ("short_links_id") REFERENCES "public"."short_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "access_roles_rels" ADD CONSTRAINT "access_roles_rels_announcements_fk" FOREIGN KEY ("announcements_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "access_roles_rels" ADD CONSTRAINT "access_roles_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "access_roles_permissions_order_idx" ON "access_roles_permissions" USING btree ("order");
  CREATE INDEX "access_roles_permissions_parent_idx" ON "access_roles_permissions" USING btree ("parent_id");
  CREATE INDEX "access_roles_limited_collections_order_idx" ON "access_roles_limited_collections" USING btree ("order");
  CREATE INDEX "access_roles_limited_collections_parent_idx" ON "access_roles_limited_collections" USING btree ("parent_id");
  CREATE UNIQUE INDEX "access_roles_name_idx" ON "access_roles" USING btree ("name");
  CREATE INDEX "access_roles_created_by_idx" ON "access_roles" USING btree ("created_by_id");
  CREATE INDEX "access_roles_updated_at_idx" ON "access_roles" USING btree ("updated_at");
  CREATE INDEX "access_roles_created_at_idx" ON "access_roles" USING btree ("created_at");
  CREATE INDEX "access_roles_rels_order_idx" ON "access_roles_rels" USING btree ("order");
  CREATE INDEX "access_roles_rels_parent_idx" ON "access_roles_rels" USING btree ("parent_id");
  CREATE INDEX "access_roles_rels_path_idx" ON "access_roles_rels" USING btree ("path");
  CREATE INDEX "access_roles_rels_events_id_idx" ON "access_roles_rels" USING btree ("events_id");
  CREATE INDEX "access_roles_rels_pages_id_idx" ON "access_roles_rels" USING btree ("pages_id");
  CREATE INDEX "access_roles_rels_projects_id_idx" ON "access_roles_rels" USING btree ("projects_id");
  CREATE INDEX "access_roles_rels_posts_id_idx" ON "access_roles_rels" USING btree ("posts_id");
  CREATE INDEX "access_roles_rels_resources_id_idx" ON "access_roles_rels" USING btree ("resources_id");
  CREATE INDEX "access_roles_rels_people_id_idx" ON "access_roles_rels" USING btree ("people_id");
  CREATE INDEX "access_roles_rels_gallery_albums_id_idx" ON "access_roles_rels" USING btree ("gallery_albums_id");
  CREATE INDEX "access_roles_rels_short_links_id_idx" ON "access_roles_rels" USING btree ("short_links_id");
  CREATE INDEX "access_roles_rels_announcements_id_idx" ON "access_roles_rels" USING btree ("announcements_id");
  CREATE INDEX "access_roles_rels_users_id_idx" ON "access_roles_rels" USING btree ("users_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_access_roles_fk" FOREIGN KEY ("access_roles_id") REFERENCES "public"."access_roles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_access_roles_id_idx" ON "payload_locked_documents_rels" USING btree ("access_roles_id");`)

  // Data (owner, 8 Oct 2026; docs/ACCESS_ROLES_PLAN.md): preset access roles that reproduce the fixed roles, created
  // only when missing; team accounts on the old fixed roles join their presets (create-only, idempotent).
  const { seedAccessRoles } = await import('../payload/seedAccessRoles')
  const result = await seedAccessRoles(payload, req)
  payload.logger.info(`Access roles: created ${result.created.length} preset(s), moved ${result.migrated} team account(s)`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "access_roles_permissions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "access_roles_limited_collections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "access_roles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "access_roles_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "access_roles_permissions" CASCADE;
  DROP TABLE "access_roles_limited_collections" CASCADE;
  DROP TABLE "access_roles" CASCADE;
  DROP TABLE "access_roles_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_access_roles_fk";
  
  DROP INDEX "payload_locked_documents_rels_access_roles_id_idx";
  ALTER TABLE "users" DROP COLUMN "legacy_roles_migrated";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "access_roles_id";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_matrix_help";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_col_page";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_col_view";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_col_create";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_col_edit";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_col_delete";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_col_more";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_not_grantable";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_create_limited";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_summary_none";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_summary";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_err_unknown";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_err_create_limited";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_err_not_within";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_err_admin_only";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_err_own_role";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_err_self";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_err_not_team";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_err_in_use";
  ALTER TABLE "staff_texts" DROP COLUMN "access_roles_err_preset";
  DROP TYPE "public"."enum_access_roles_permissions";
  DROP TYPE "public"."enum_access_roles_limited_collections";
  DROP TYPE "public"."enum_access_roles_event_limit";`)
}
