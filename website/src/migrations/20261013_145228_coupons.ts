import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Owner, 13 Oct 2026: discount coupons (collection `coupons`, global `coupon-settings` = Coupon limits), coupon fields on
 * registrations, optional coupon limits on accounts and access roles, the coupon permissions, checkout and coupon
 * wording. Additive only (new tables, columns and enum values).
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_coupons_type" AS ENUM('PERCENT', 'FLAT');
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'coupons.view' BEFORE 'emailOutbox.view';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'coupons.create' BEFORE 'emailOutbox.view';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'coupons.edit' BEFORE 'emailOutbox.view';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'coupons.delete' BEFORE 'emailOutbox.view';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'coupons.editOwn' BEFORE 'emailOutbox.view';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'coupons.deleteOwn' BEFORE 'emailOutbox.view';
  ALTER TYPE "public"."enum_access_roles_permissions" ADD VALUE 'coupons.usage' BEFORE 'emailOutbox.view';
  CREATE TABLE "coupons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"type" "enum_coupons_type" DEFAULT 'PERCENT' NOT NULL,
  	"percent" numeric,
  	"amount" numeric,
  	"starts_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone,
  	"usage_limit" numeric,
  	"note" varchar,
  	"discount_cap" numeric,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "coupons_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"events_id" integer
  );
  
  CREATE TABLE "coupon_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"max_discount" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users" ADD COLUMN "coupon_max_discount" numeric;
  ALTER TABLE "access_roles" ADD COLUMN "coupon_max_discount" numeric;
  ALTER TABLE "event_registrations" ADD COLUMN "coupon_code" varchar;
  ALTER TABLE "event_registrations" ADD COLUMN "original_fee" numeric;
  ALTER TABLE "event_registrations" ADD COLUMN "discount_amount" numeric;
  ALTER TABLE "event_registrations" ADD COLUMN "coupon_applied_at" timestamp(3) with time zone;
  ALTER TABLE "event_registrations" ADD COLUMN "coupon_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "coupons_id" integer;
  ALTER TABLE "form_texts" ADD COLUMN "checkout_tab_title" varchar DEFAULT 'Pay for your team';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_eyebrow" varchar DEFAULT 'AURIX 2026 · Payment';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_title" varchar DEFAULT 'Pay for your team';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_intro" varchar DEFAULT 'Check the amount, apply a coupon if you have one, then continue to the payment page.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_team_line" varchar DEFAULT '{team} · {code} · {event}';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_row_fee" varchar DEFAULT 'Registration fee';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_row_discount" varchar DEFAULT 'Coupon {code}';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_row_total" varchar DEFAULT 'You pay';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_coupon_label" varchar DEFAULT 'Have a coupon code?';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_coupon_placeholder" varchar DEFAULT 'Coupon code';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_apply" varchar DEFAULT 'Apply';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_applying" varchar DEFAULT 'Applying…';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_remove" varchar DEFAULT 'Remove coupon';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_applied" varchar DEFAULT 'Coupon {code} applied: ₹{discount} off. You now pay ₹{amount}.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_removed" varchar DEFAULT 'Coupon removed. You pay the full fee again.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_replace_note" varchar DEFAULT 'Only one coupon per team. Applying another code replaces the current one.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_proceed" varchar DEFAULT 'Proceed to payment · ₹{amount}';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_exact_note" varchar DEFAULT 'The payment page is filled in with this amount. Pay exactly this amount, or your payment cannot be matched to your team.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_paid_note" varchar DEFAULT 'Your payment is verified. Nothing more to pay.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_no_pay_note" varchar DEFAULT 'There is nothing to pay for this registration.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_not_found" varchar DEFAULT 'This team is not one of the registrations you lead. Log in with the team leader''s account.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_back_link" varchar DEFAULT 'Back to your registrations';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_err_no_team" varchar DEFAULT 'Only the team leader can pay for this team.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_err_paid" varchar DEFAULT 'Your payment is already verified, so the amount can no longer change.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_err_inactive" varchar DEFAULT 'This registration is cancelled.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_err_not_found" varchar DEFAULT 'This coupon code does not exist. Check the spelling.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_err_off" varchar DEFAULT 'This coupon is no longer active.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_err_not_started" varchar DEFAULT 'This coupon is not valid yet.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_err_expired" varchar DEFAULT 'This coupon has expired.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_err_used_up" varchar DEFAULT 'This coupon has been used by as many teams as allowed.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_err_wrong_event" varchar DEFAULT 'This coupon is not valid for this competition.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_err_no_discount" varchar DEFAULT 'This coupon gives no discount on this fee.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_err_too_many" varchar DEFAULT 'Too many tries. Please wait an hour and try again.';
  ALTER TABLE "form_texts" ADD COLUMN "checkout_err_failed" varchar DEFAULT 'Something went wrong. Please try again.';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_nav_active" varchar DEFAULT 'Active coupons';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_usage_title" varchar DEFAULT 'Teams that applied it ({n})';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_usage_none" varchar DEFAULT 'No team has applied this coupon yet.';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_usage_no_access" varchar DEFAULT 'You cannot see which teams used it (access role: "See which teams used a coupon").';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_col_code" varchar DEFAULT 'Team code';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_col_team" varchar DEFAULT 'Team';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_col_event" varchar DEFAULT 'Competition';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_col_discount" varchar DEFAULT 'Discount';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_col_pays" varchar DEFAULT 'Pays';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_col_payment" varchar DEFAULT 'Payment';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_col_applied" varchar DEFAULT 'Applied';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_limit_note" varchar DEFAULT 'Your coupon limit: up to ₹{limit} off per team. Admins can change limits in AURIX → Coupon limits.';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_limit_admin" varchar DEFAULT 'You are an admin: your coupons have no limit (only the ₹1 minimum payment).';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_state_active" varchar DEFAULT 'Active';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_state_off" varchar DEFAULT 'Off';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_state_not_started" varchar DEFAULT 'Not started yet';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_state_expired" varchar DEFAULT 'Expired';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_state_used_up" varchar DEFAULT 'Used up';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_err_code" varchar DEFAULT 'Use 3–30 letters, digits or dashes for the code (it must start with a letter or digit).';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_err_type" varchar DEFAULT 'Choose "Percentage off" or "Flat amount off".';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_err_percent" varchar DEFAULT 'The percentage must be a whole number from 1 to 99 (every team pays at least ₹1).';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_err_flat" varchar DEFAULT 'The amount off must be a whole number of rupees, at least ₹1.';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_err_usage" varchar DEFAULT 'The usage limit must be a whole number of at least 1 (or empty for no limit).';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_err_dates" varchar DEFAULT 'The expiry must be later than the start.';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_err_events" varchar DEFAULT 'You can only make or change coupons for the competitions your access role covers: choose only those competitions (a coupon for every competition needs access to all of them).';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_err_no_site_limit" varchar DEFAULT 'An admin must first set the site-wide coupon limit (AURIX → Coupon limits) before team members can make coupons.';
  ALTER TABLE "staff_texts" ADD COLUMN "coupons_err_over_limit" varchar DEFAULT 'This coupon can take up to ₹{max} off a team, but your limit is ₹{limit}. Lower the discount or limit it to cheaper competitions.';
  ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");
  CREATE INDEX "coupons_created_by_idx" ON "coupons" USING btree ("created_by_id");
  CREATE INDEX "coupons_updated_at_idx" ON "coupons" USING btree ("updated_at");
  CREATE INDEX "coupons_created_at_idx" ON "coupons" USING btree ("created_at");
  CREATE INDEX "coupons_rels_order_idx" ON "coupons_rels" USING btree ("order");
  CREATE INDEX "coupons_rels_parent_idx" ON "coupons_rels" USING btree ("parent_id");
  CREATE INDEX "coupons_rels_path_idx" ON "coupons_rels" USING btree ("path");
  CREATE INDEX "coupons_rels_events_id_idx" ON "coupons_rels" USING btree ("events_id");
  ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_coupons_fk" FOREIGN KEY ("coupons_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "event_registrations_coupon_idx" ON "event_registrations" USING btree ("coupon_id");
  CREATE INDEX "payload_locked_documents_rels_coupons_id_idx" ON "payload_locked_documents_rels" USING btree ("coupons_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "coupons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "coupons_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "coupon_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "coupons" CASCADE;
  DROP TABLE "coupons_rels" CASCADE;
  DROP TABLE "coupon_settings" CASCADE;
  ALTER TABLE "event_registrations" DROP CONSTRAINT "event_registrations_coupon_id_coupons_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_coupons_fk";
  
  ALTER TABLE "access_roles_permissions" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_access_roles_permissions";
  CREATE TYPE "public"."enum_access_roles_permissions" AS ENUM('registrations.view', 'registrations.contacts', 'registrations.leaderPhone', 'registrations.ids', 'registrations.money', 'registrations.portalAccounts', 'registrations.notes', 'registrations.editStatus', 'registrations.editIdCheck', 'registrations.editPayment', 'registrations.editDetails', 'registrations.editCheckin', 'registrations.delete', 'idDocuments.edit', 'idDocuments.delete', 'submissions.view', 'submissions.download', 'submissions.review', 'submissions.delete', 'events.viewDrafts', 'events.editTexts', 'events.editLocked', 'events.create', 'events.delete', 'announcements.create', 'announcements.edit', 'announcements.delete', 'emailOutbox.view', 'emailOutbox.edit', 'emailOutbox.delete', 'formSubmissions.view', 'formSubmissions.handle', 'formSubmissions.delete', 'shortLinks.view', 'shortLinks.create', 'shortLinks.edit', 'shortLinks.delete', 'pages.view', 'pages.create', 'pages.edit', 'pages.delete', 'pages.versions', 'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'posts.view', 'posts.create', 'posts.edit', 'posts.delete', 'resources.view', 'resources.create', 'resources.edit', 'resources.delete', 'people.view', 'people.create', 'people.edit', 'people.delete', 'gallery.view', 'gallery.create', 'gallery.edit', 'gallery.delete', 'media.create', 'media.edit', 'media.delete', 'globals.siteSettings', 'globals.navigation', 'globals.eventPageLabels', 'globals.formTexts', 'globals.portalTexts', 'globals.pageTexts', 'globals.legalPages', 'globals.aurixSchedule', 'globals.staffTexts', 'tools.checkin', 'tools.paymentMatching', 'tools.idReupload', 'exports.full', 'exports.finance', 'exports.checkin', 'exports.roster', 'paymentReports.manage', 'admin.retention', 'dashboard.overview', 'dashboard.finance', 'dashboard.desk', 'dashboard.events', 'dashboard.counts', 'dashboard.totals', 'admin.pageVisibility', 'admin.participants', 'accounts.team', 'accounts.delete', 'accessRoles.manage');
  ALTER TABLE "access_roles_permissions" ALTER COLUMN "value" SET DATA TYPE "public"."enum_access_roles_permissions" USING "value"::"public"."enum_access_roles_permissions";
  DROP INDEX "event_registrations_coupon_idx";
  DROP INDEX "payload_locked_documents_rels_coupons_id_idx";
  ALTER TABLE "users" DROP COLUMN "coupon_max_discount";
  ALTER TABLE "access_roles" DROP COLUMN "coupon_max_discount";
  ALTER TABLE "event_registrations" DROP COLUMN "coupon_code";
  ALTER TABLE "event_registrations" DROP COLUMN "original_fee";
  ALTER TABLE "event_registrations" DROP COLUMN "discount_amount";
  ALTER TABLE "event_registrations" DROP COLUMN "coupon_applied_at";
  ALTER TABLE "event_registrations" DROP COLUMN "coupon_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "coupons_id";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_tab_title";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_eyebrow";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_title";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_intro";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_team_line";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_row_fee";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_row_discount";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_row_total";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_coupon_label";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_coupon_placeholder";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_apply";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_applying";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_remove";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_applied";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_removed";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_replace_note";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_proceed";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_exact_note";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_paid_note";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_no_pay_note";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_not_found";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_back_link";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_err_no_team";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_err_paid";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_err_inactive";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_err_not_found";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_err_off";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_err_not_started";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_err_expired";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_err_used_up";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_err_wrong_event";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_err_no_discount";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_err_too_many";
  ALTER TABLE "form_texts" DROP COLUMN "checkout_err_failed";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_nav_active";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_usage_title";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_usage_none";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_usage_no_access";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_col_code";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_col_team";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_col_event";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_col_discount";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_col_pays";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_col_payment";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_col_applied";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_limit_note";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_limit_admin";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_state_active";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_state_off";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_state_not_started";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_state_expired";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_state_used_up";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_err_code";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_err_type";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_err_percent";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_err_flat";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_err_usage";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_err_dates";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_err_events";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_err_no_site_limit";
  ALTER TABLE "staff_texts" DROP COLUMN "coupons_err_over_limit";
  DROP TYPE "public"."enum_coupons_type";`)
}
