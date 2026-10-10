import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_registrations" ADD COLUMN "receipt_uploaded_at" timestamp(3) with time zone;
  ALTER TABLE "event_registrations" ADD COLUMN "receipt_payment_id" varchar;
  ALTER TABLE "event_registrations" ADD COLUMN "receipt_filename" varchar;
  ALTER TABLE "event_registrations" ADD COLUMN "receipt_size" numeric;
  ALTER TABLE "event_registrations" ADD COLUMN "receipt_type" varchar;
  ALTER TABLE "event_registrations" ADD COLUMN "receipt_key" varchar;
  ALTER TABLE "form_texts" ADD COLUMN "receipt_pop_title" varchar DEFAULT 'Before you pay';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_pop_text" varchar DEFAULT 'After paying, download the payment receipt (PDF) from Razorpay or take a screenshot of the payment-successful screen. You must upload it on our website afterwards — it is required to complete your registration.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_pop_where" varchar DEFAULT 'Upload it at {link} (log in with the team leader’s account).';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_pop_continue" varchar DEFAULT 'I understand — continue to payment';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_pop_cancel" varchar DEFAULT 'Go back';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_tab_title" varchar DEFAULT 'Upload your payment receipt';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_eyebrow" varchar DEFAULT 'AURIX 2026 // Payment';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_title" varchar DEFAULT 'Upload your payment receipt';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_intro" varchar DEFAULT 'Upload the Razorpay receipt (PDF) or a screenshot of the payment-successful screen for each team you paid for. It is required: we use it to verify your payment if it is missing from our payment records.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_unconfirmed" varchar DEFAULT 'Please confirm your account email first (check your inbox), then come back to this page.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_none" varchar DEFAULT 'You have no active registration to upload a receipt for. Register a team first, or log in with the team leader’s account.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_status_link" varchar DEFAULT 'Check your registration status';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_amount" varchar DEFAULT 'Registration fee: {amount}';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_verified" varchar DEFAULT 'Payment verified — no receipt needed (you can still upload one).';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_missing" varchar DEFAULT 'Receipt missing — please upload it.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_uploaded" varchar DEFAULT 'Receipt uploaded on {date}: {file}';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_replace_note" varchar DEFAULT 'Uploading again replaces the earlier receipt.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_payment_id_label" varchar DEFAULT 'Razorpay payment ID (optional, starts with pay_)';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_choose" varchar DEFAULT 'Choose receipt (PDF or image)';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_no_file" varchar DEFAULT 'No file chosen';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_submit" varchar DEFAULT 'Upload receipt';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_uploading" varchar DEFAULT 'Uploading… {pct}%';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_saving" varchar DEFAULT 'Saving…';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_done" varchar DEFAULT 'Thank you! Your receipt was uploaded.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_err_none" varchar DEFAULT 'Choose the receipt file first.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_err_type" varchar DEFAULT 'Upload a PDF, JPG, PNG or WebP file.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_err_size" varchar DEFAULT 'The receipt must be 5 MB or smaller.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_err_content" varchar DEFAULT 'This file is not a real PDF or image. Please download the receipt again or take a new screenshot.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_err_payment_id" varchar DEFAULT 'A Razorpay payment ID starts with "pay_" followed by letters and numbers.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_err_upload" varchar DEFAULT 'The upload did not complete. Please try again.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_err_network" varchar DEFAULT 'The upload was interrupted. Please check your connection and try again.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_err_no_team" varchar DEFAULT 'This registration is not yours or no longer active.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_err_not_configured" varchar DEFAULT 'Uploads are not available right now. Please contact the organizers.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_err_too_many" varchar DEFAULT 'Too many uploads. Please try again later.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_err_failed" varchar DEFAULT 'Could not upload. Please try again.';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_row_receipt" varchar DEFAULT 'Payment receipt';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_row_uploaded" varchar DEFAULT 'Uploaded {date}';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_row_missing" varchar DEFAULT 'Missing — required';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_row_not_needed" varchar DEFAULT 'Not needed (payment verified)';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_row_button" varchar DEFAULT 'Upload receipt';
  ALTER TABLE "form_texts" ADD COLUMN "receipt_done_step" varchar DEFAULT 'After paying, upload the receipt (PDF or screenshot) at {link} — it is required.';
  ALTER TABLE "form_texts" ADD COLUMN "emails_receipt_line" varchar DEFAULT 'After paying, download the receipt (PDF) or take a screenshot, and upload it at {link} — it is required.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_registrations" DROP COLUMN "receipt_uploaded_at";
  ALTER TABLE "event_registrations" DROP COLUMN "receipt_payment_id";
  ALTER TABLE "event_registrations" DROP COLUMN "receipt_filename";
  ALTER TABLE "event_registrations" DROP COLUMN "receipt_size";
  ALTER TABLE "event_registrations" DROP COLUMN "receipt_type";
  ALTER TABLE "event_registrations" DROP COLUMN "receipt_key";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_pop_title";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_pop_text";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_pop_where";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_pop_continue";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_pop_cancel";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_tab_title";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_eyebrow";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_title";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_intro";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_unconfirmed";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_none";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_status_link";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_amount";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_verified";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_missing";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_uploaded";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_replace_note";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_payment_id_label";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_choose";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_no_file";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_submit";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_uploading";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_saving";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_done";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_err_none";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_err_type";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_err_size";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_err_content";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_err_payment_id";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_err_upload";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_err_network";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_err_no_team";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_err_not_configured";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_err_too_many";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_err_failed";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_row_receipt";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_row_uploaded";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_row_missing";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_row_not_needed";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_row_button";
  ALTER TABLE "form_texts" DROP COLUMN "receipt_done_step";
  ALTER TABLE "form_texts" DROP COLUMN "emails_receipt_line";`)
}
