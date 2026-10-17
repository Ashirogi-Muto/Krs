import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Owner, 17 Oct 2026: competition pages get a "deadline extended" heading (events.deadline_extended), a Contact Us
 * pop-up (events_contacts), a registration offer (coupon_settings.advertised_coupon_id) and a prize pool banner, with
 * their wording in Event pages (event_page_labels). Additive only.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "events_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar,
  	"phone" varchar NOT NULL
  );
  
  ALTER TABLE "events" ADD COLUMN "deadline_extended" boolean DEFAULT false;
  ALTER TABLE "event_page_labels" ADD COLUMN "extended_title" varchar DEFAULT 'Registration Deadline Extended!';
  ALTER TABLE "event_page_labels" ADD COLUMN "extended_text" varchar DEFAULT 'Registrations now close on {date} IST.';
  ALTER TABLE "event_page_labels" ADD COLUMN "prize_banner_label" varchar DEFAULT 'Total Prize Pool';
  ALTER TABLE "event_page_labels" ADD COLUMN "offer_title" varchar DEFAULT 'Registration Offer';
  ALTER TABLE "event_page_labels" ADD COLUMN "offer_percent" varchar DEFAULT 'Get {percent}% off your registration fee with code {code}';
  ALTER TABLE "event_page_labels" ADD COLUMN "offer_amount" varchar DEFAULT 'Get {amount} off your registration fee with code {code}';
  ALTER TABLE "event_page_labels" ADD COLUMN "offer_price" varchar DEFAULT 'Pay {final} instead of {fee}';
  ALTER TABLE "event_page_labels" ADD COLUMN "offer_until" varchar DEFAULT 'Valid till {date} IST';
  ALTER TABLE "event_page_labels" ADD COLUMN "offer_how" varchar DEFAULT 'Register your team, then enter the code at checkout before paying.';
  ALTER TABLE "event_page_labels" ADD COLUMN "offer_copy" varchar DEFAULT 'Copy code';
  ALTER TABLE "event_page_labels" ADD COLUMN "offer_copied" varchar DEFAULT 'Copied!';
  ALTER TABLE "event_page_labels" ADD COLUMN "contact_button" varchar DEFAULT 'Contact Us';
  ALTER TABLE "event_page_labels" ADD COLUMN "contact_title" varchar DEFAULT 'Contact Us: {name}';
  ALTER TABLE "event_page_labels" ADD COLUMN "contact_intro" varchar DEFAULT 'Questions about registration, payment or the rules? Message us on WhatsApp.';
  ALTER TABLE "event_page_labels" ADD COLUMN "contact_whatsapp" varchar DEFAULT 'Chat on WhatsApp';
  ALTER TABLE "event_page_labels" ADD COLUMN "contact_message" varchar DEFAULT 'Hi, I have a question about {name} at AURIX.';
  ALTER TABLE "event_page_labels" ADD COLUMN "contact_close" varchar DEFAULT 'Close';
  ALTER TABLE "coupon_settings" ADD COLUMN "advertised_coupon_id" integer;
  ALTER TABLE "events_contacts" ADD CONSTRAINT "events_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_contacts_order_idx" ON "events_contacts" USING btree ("_order");
  CREATE INDEX "events_contacts_parent_id_idx" ON "events_contacts" USING btree ("_parent_id");
  ALTER TABLE "coupon_settings" ADD CONSTRAINT "coupon_settings_advertised_coupon_id_coupons_id_fk" FOREIGN KEY ("advertised_coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "coupon_settings_advertised_coupon_idx" ON "coupon_settings" USING btree ("advertised_coupon_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_contacts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "events_contacts" CASCADE;
  ALTER TABLE "coupon_settings" DROP CONSTRAINT "coupon_settings_advertised_coupon_id_coupons_id_fk";
  
  DROP INDEX "coupon_settings_advertised_coupon_idx";
  ALTER TABLE "events" DROP COLUMN "deadline_extended";
  ALTER TABLE "event_page_labels" DROP COLUMN "extended_title";
  ALTER TABLE "event_page_labels" DROP COLUMN "extended_text";
  ALTER TABLE "event_page_labels" DROP COLUMN "prize_banner_label";
  ALTER TABLE "event_page_labels" DROP COLUMN "offer_title";
  ALTER TABLE "event_page_labels" DROP COLUMN "offer_percent";
  ALTER TABLE "event_page_labels" DROP COLUMN "offer_amount";
  ALTER TABLE "event_page_labels" DROP COLUMN "offer_price";
  ALTER TABLE "event_page_labels" DROP COLUMN "offer_until";
  ALTER TABLE "event_page_labels" DROP COLUMN "offer_how";
  ALTER TABLE "event_page_labels" DROP COLUMN "offer_copy";
  ALTER TABLE "event_page_labels" DROP COLUMN "offer_copied";
  ALTER TABLE "event_page_labels" DROP COLUMN "contact_button";
  ALTER TABLE "event_page_labels" DROP COLUMN "contact_title";
  ALTER TABLE "event_page_labels" DROP COLUMN "contact_intro";
  ALTER TABLE "event_page_labels" DROP COLUMN "contact_whatsapp";
  ALTER TABLE "event_page_labels" DROP COLUMN "contact_message";
  ALTER TABLE "event_page_labels" DROP COLUMN "contact_close";
  ALTER TABLE "coupon_settings" DROP COLUMN "advertised_coupon_id";`)
}
