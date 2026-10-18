import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Owner, 18 Oct 2026: entry options per competition (events_entry_options; BGMI Solo / Squad, coupon switch per option),
 * the team's option (event_registrations.entry_option), a coupon per competition page (events.page_coupon_id: the
 * Hackathon shows SPECIAL50, the rest the site-wide AURIX20) and their wording. Additive only.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "events_entry_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"fee" numeric NOT NULL,
  	"fee_suffix" varchar,
  	"min_team_size" numeric DEFAULT 1 NOT NULL,
  	"max_team_size" numeric DEFAULT 1 NOT NULL,
  	"coupons_allowed" boolean DEFAULT true
  );
  
  ALTER TABLE "events" ADD COLUMN "page_coupon_id" integer;
  ALTER TABLE "event_registrations" ADD COLUMN "entry_option" varchar;
  ALTER TABLE "event_page_labels" ADD COLUMN "entry_title" varchar DEFAULT 'Entry type';
  ALTER TABLE "event_page_labels" ADD COLUMN "entry_err_choose" varchar DEFAULT 'Choose an entry type (for example Solo or Squad).';
  ALTER TABLE "event_page_labels" ADD COLUMN "entry_one_player" varchar DEFAULT '1 player';
  ALTER TABLE "event_page_labels" ADD COLUMN "entry_players" varchar DEFAULT '{min}–{max} players';
  ALTER TABLE "event_page_labels" ADD COLUMN "entry_exact" varchar DEFAULT '{count} players';
  ALTER TABLE "event_page_labels" ADD COLUMN "entry_no_coupon" varchar DEFAULT 'Coupon codes can''t be used for {option} entries.';
  ALTER TABLE "event_page_labels" ADD COLUMN "offer_only_for" varchar DEFAULT 'Valid for {options} entries only.';
  ALTER TABLE "staff_texts" ADD COLUMN "csv_entry_option" varchar DEFAULT 'Entry';
  ALTER TABLE "events_entry_options" ADD CONSTRAINT "events_entry_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_entry_options_order_idx" ON "events_entry_options" USING btree ("_order");
  CREATE INDEX "events_entry_options_parent_id_idx" ON "events_entry_options" USING btree ("_parent_id");
  ALTER TABLE "events" ADD CONSTRAINT "events_page_coupon_id_coupons_id_fk" FOREIGN KEY ("page_coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "events_page_coupon_idx" ON "events" USING btree ("page_coupon_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_entry_options" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "events_entry_options" CASCADE;
  ALTER TABLE "events" DROP CONSTRAINT "events_page_coupon_id_coupons_id_fk";
  
  DROP INDEX "events_page_coupon_idx";
  ALTER TABLE "events" DROP COLUMN "page_coupon_id";
  ALTER TABLE "event_registrations" DROP COLUMN "entry_option";
  ALTER TABLE "event_page_labels" DROP COLUMN "entry_title";
  ALTER TABLE "event_page_labels" DROP COLUMN "entry_err_choose";
  ALTER TABLE "event_page_labels" DROP COLUMN "entry_one_player";
  ALTER TABLE "event_page_labels" DROP COLUMN "entry_players";
  ALTER TABLE "event_page_labels" DROP COLUMN "entry_exact";
  ALTER TABLE "event_page_labels" DROP COLUMN "entry_no_coupon";
  ALTER TABLE "event_page_labels" DROP COLUMN "offer_only_for";
  ALTER TABLE "staff_texts" DROP COLUMN "csv_entry_option";`)
}
