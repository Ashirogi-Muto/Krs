import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * ui-update-upcoming (17 Oct 2026): wording of the Hackathon coupon ticker, prize section and offer pop-up in Event pages
 * (event_page_labels), defaults = the designed text. Additive only.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_page_labels" ADD COLUMN "prize_section_label" varchar DEFAULT 'Total prize pool';
  ALTER TABLE "event_page_labels" ADD COLUMN "offer_headline_percent" varchar DEFAULT '{percent}% OFF';
  ALTER TABLE "event_page_labels" ADD COLUMN "offer_headline_amount" varchar DEFAULT '{amount} OFF';
  ALTER TABLE "event_page_labels" ADD COLUMN "ticker_text" varchar DEFAULT 'Coupon live: {headline} with code';
  ALTER TABLE "event_page_labels" ADD COLUMN "ticker_after" varchar DEFAULT 'Limited time';
  ALTER TABLE "event_page_labels" ADD COLUMN "popup_badge" varchar DEFAULT 'Exclusive offer';
  ALTER TABLE "event_page_labels" ADD COLUMN "popup_text" varchar DEFAULT 'Register your team and apply this code at checkout.';
  ALTER TABLE "event_page_labels" ADD COLUMN "popup_copy" varchar DEFAULT 'Copy';
  ALTER TABLE "event_page_labels" ADD COLUMN "popup_copied" varchar DEFAULT 'Copied';
  ALTER TABLE "event_page_labels" ADD COLUMN "popup_register" varchar DEFAULT 'Register now';
  ALTER TABLE "event_page_labels" ADD COLUMN "popup_footer" varchar DEFAULT 'Limited time · Apply at checkout';
  ALTER TABLE "event_page_labels" ADD COLUMN "popup_label" varchar DEFAULT 'Coupon offer';
  ALTER TABLE "event_page_labels" ADD COLUMN "popup_close" varchar DEFAULT 'Close';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_page_labels" DROP COLUMN "prize_section_label";
  ALTER TABLE "event_page_labels" DROP COLUMN "offer_headline_percent";
  ALTER TABLE "event_page_labels" DROP COLUMN "offer_headline_amount";
  ALTER TABLE "event_page_labels" DROP COLUMN "ticker_text";
  ALTER TABLE "event_page_labels" DROP COLUMN "ticker_after";
  ALTER TABLE "event_page_labels" DROP COLUMN "popup_badge";
  ALTER TABLE "event_page_labels" DROP COLUMN "popup_text";
  ALTER TABLE "event_page_labels" DROP COLUMN "popup_copy";
  ALTER TABLE "event_page_labels" DROP COLUMN "popup_copied";
  ALTER TABLE "event_page_labels" DROP COLUMN "popup_register";
  ALTER TABLE "event_page_labels" DROP COLUMN "popup_footer";
  ALTER TABLE "event_page_labels" DROP COLUMN "popup_label";
  ALTER TABLE "event_page_labels" DROP COLUMN "popup_close";`)
}
