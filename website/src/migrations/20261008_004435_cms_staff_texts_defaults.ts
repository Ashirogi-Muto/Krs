import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "staff_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"checkin_tab_title" varchar DEFAULT 'Check-in desk',
  	"checkin_eyebrow" varchar DEFAULT 'AURIX 2026',
  	"checkin_title" varchar DEFAULT 'Check-in desk',
  	"checkin_cms_link" varchar DEFAULT 'CMS →',
  	"checkin_no_access" varchar DEFAULT 'Your account has no check-in access. Ask an admin to give you the Registration, Logistics or Technical event role.',
  	"checkin_search_placeholder" varchar DEFAULT 'Registration code (AX26-…) or team name',
  	"checkin_find" varchar DEFAULT 'Find',
  	"checkin_search_failed" varchar DEFAULT 'Search failed — are you still signed in?',
  	"checkin_no_team_limited" varchar DEFAULT 'No team found in your events.',
  	"checkin_no_team" varchar DEFAULT 'No team found.',
  	"checkin_save_failed" varchar DEFAULT 'Could not save',
  	"checkin_checked_in" varchar DEFAULT '{team} checked in.',
  	"checkin_undone" varchar DEFAULT 'Check-in undone for {team}.',
  	"checkin_undo" varchar DEFAULT 'Undo',
  	"checkin_mark_arrived" varchar DEFAULT 'Mark arrived',
  	"checkin_arrived_at" varchar DEFAULT 'Arrived {time}',
  	"checkin_arrived_by" varchar DEFAULT ' · by {name}',
  	"checkin_warn_registration" varchar DEFAULT 'Registration {status}',
  	"checkin_warn_payment" varchar DEFAULT 'Payment not verified',
  	"checkin_warn_id" varchar DEFAULT 'ID check {status}',
  	"checkin_arrivals_title" varchar DEFAULT 'Arrivals',
  	"checkin_arrivals_limited" varchar DEFAULT ' (your events)',
  	"checkin_col_event" varchar DEFAULT 'Event',
  	"checkin_col_arrived" varchar DEFAULT 'Arrived',
  	"checkin_col_confirmed" varchar DEFAULT 'Confirmed',
  	"checkin_col_registered" varchar DEFAULT 'Registered',
  	"payments_tab_title" varchar DEFAULT 'Payment matching',
  	"payments_eyebrow" varchar DEFAULT 'AURIX 2026 · Finance',
  	"payments_title" varchar DEFAULT 'Payment matching',
  	"payments_no_access" varchar DEFAULT 'Only the Finance team and registration managers can match payments.',
  	"payments_step1" varchar DEFAULT '1. Download the payments report from Razorpay as {csv} and choose it here. Nothing is saved until you press Apply.',
  	"payments_csv_word" varchar DEFAULT 'CSV',
  	"payments_not_csv" varchar DEFAULT 'Please export the Razorpay report as CSV.',
  	"payments_rows" varchar DEFAULT '{file}: {count} rows',
  	"payments_step2" varchar DEFAULT '2. Check which column holds what (guessed from the headers):',
  	"payments_field_payment_id" varchar DEFAULT 'Payment ID',
  	"payments_field_email" varchar DEFAULT 'Email',
  	"payments_field_phone" varchar DEFAULT 'Phone',
  	"payments_field_amount" varchar DEFAULT 'Amount',
  	"payments_field_event" varchar DEFAULT 'Event (dropdown)',
  	"payments_field_status" varchar DEFAULT 'Status',
  	"payments_field_paid_at" varchar DEFAULT 'Paid at',
  	"payments_paise" varchar DEFAULT 'Amounts are in paise (e.g. 49900 for ₹499)',
  	"payments_first_row" varchar DEFAULT 'First row reads as:',
  	"payments_no_status" varchar DEFAULT 'no status',
  	"payments_preview" varchar DEFAULT 'Preview matches',
  	"payments_preview_failed" varchar DEFAULT 'Preview failed',
  	"payments_confirm_apply" varchar DEFAULT 'Mark {count} team(s) as Paid (verified)?',
  	"payments_save_failed" varchar DEFAULT 'Saving failed — nothing or only part was saved; preview again to see the current state.',
  	"payments_saved" varchar DEFAULT '{count} team(s) marked paid.',
  	"payments_skipped" varchar DEFAULT ' Skipped: {list}',
  	"payments_apply" varchar DEFAULT 'Apply {count} selected',
  	"payments_hint" varchar DEFAULT 'Exact matches are ticked. Tick a “Check by hand” row only after confirming it is the right team.',
  	"payments_col_result" varchar DEFAULT 'Result',
  	"payments_col_payment" varchar DEFAULT 'Payment',
  	"payments_col_payer" varchar DEFAULT 'Payer',
  	"payments_col_registration" varchar DEFAULT 'Registration',
  	"payments_col_why" varchar DEFAULT 'Why',
  	"payments_kind_match" varchar DEFAULT 'Match',
  	"payments_kind_check" varchar DEFAULT 'Check by hand',
  	"payments_kind_recorded" varchar DEFAULT 'Already recorded',
  	"payments_kind_duplicate" varchar DEFAULT 'Duplicate',
  	"payments_kind_not_paid" varchar DEFAULT 'Not paid',
  	"payments_kind_no_match" varchar DEFAULT 'No registration found',
  	"payments_why_duplicate_id" varchar DEFAULT 'Same payment ID appears earlier in this report',
  	"payments_why_status" varchar DEFAULT 'Status "{status}"',
  	"payments_why_email" varchar DEFAULT 'email differs',
  	"payments_why_phone" varchar DEFAULT 'phone differs',
  	"payments_why_event" varchar DEFAULT 'event "{paid}" ≠ "{due}"',
  	"payments_why_amount" varchar DEFAULT 'amount ₹{paid} ≠ due ₹{due}',
  	"payments_why_no_contact" varchar DEFAULT 'No registration with this email or phone',
  	"payments_why_already_paid" varchar DEFAULT 'Team is already marked paid — possible second payment',
  	"payments_why_twice" varchar DEFAULT '{count} registrations fit (same leader registered twice for this event?)',
  	"retention_tab_title" varchar DEFAULT 'Data retention',
  	"retention_eyebrow" varchar DEFAULT 'Privacy',
  	"retention_title" varchar DEFAULT 'Data retention',
  	"retention_intro" varchar DEFAULT 'Participants are told their data is kept for {days} days after their event. Events listed here are past that date. Deleting removes the event''s registrations, student ID files and confirmation emails permanently (copies in server backups age out within 7 days). Download an export first if you need one.',
  	"retention_no_access" varchar DEFAULT 'Only the Super Admin can delete participant data.',
  	"retention_loading" varchar DEFAULT 'Loading…',
  	"retention_nothing_due" varchar DEFAULT 'Nothing is due for deletion.',
  	"retention_due_since" varchar DEFAULT 'Due since {date}: {registrations} registrations, {files} ID files, {emails} emails.',
  	"retention_export" varchar DEFAULT 'Download full export (CSV) first',
  	"retention_confirm_placeholder" varchar DEFAULT 'Type "{title}" to confirm',
  	"retention_delete" varchar DEFAULT 'Delete permanently',
  	"retention_delete_failed" varchar DEFAULT 'Deletion failed',
  	"retention_deleted" varchar DEFAULT '{event}: deleted {registrations} registrations, {files} ID files, {emails} emails.',
  	"admin_api_outbox_redacted" varchar DEFAULT 'Account email (contents not stored: the link inside is a one-time credential).',
  	"admin_api_outbox_queued" varchar DEFAULT 'Queued account confirmation (the link is created when the email is sent and is never stored).',
  	"admin_api_bad_origin" varchar DEFAULT 'Bad origin',
  	"admin_api_not_allowed" varchar DEFAULT 'Not allowed',
  	"admin_api_slow_down" varchar DEFAULT 'Too many requests. Please slow down.',
  	"admin_api_bad_request" varchar DEFAULT 'Bad request',
  	"admin_api_invalid_request" varchar DEFAULT 'Invalid request.',
  	"admin_api_checkin_too_many" varchar DEFAULT 'Too many check-in requests. Please slow down.',
  	"admin_api_checkin_not_found" varchar DEFAULT 'Team not found or not one of your events',
  	"admin_api_visibility_admins_only" varchar DEFAULT 'Only admins can hide or show pages.',
  	"admin_api_visibility_too_many" varchar DEFAULT 'Too many changes. Please slow down.',
  	"admin_api_visibility_cannot_hide" varchar DEFAULT 'These can''t be hidden: {paths}',
  	"admin_api_visibility_failed" varchar DEFAULT 'Could not save. Please try again.',
  	"admin_api_export_too_many" varchar DEFAULT 'Too many export requests. Please slow down.',
  	"admin_api_export_no_events" varchar DEFAULT 'No events are assigned to your account',
  	"admin_api_retention_nothing" varchar DEFAULT 'Nothing to delete for this event (not due yet, or already deleted)',
  	"admin_api_retention_confirm" varchar DEFAULT 'Type the event name exactly to confirm',
  	"admin_api_accounts_admins_only" varchar DEFAULT 'Only admins can manage accounts.',
  	"admin_api_accounts_too_many" varchar DEFAULT 'Too many actions. Please slow down.',
  	"admin_api_account_gone" varchar DEFAULT 'This account no longer exists.',
  	"admin_api_account_super_only" varchar DEFAULT 'Only the Super Admin can manage this account.',
  	"admin_api_only_participants" varchar DEFAULT 'Only participant accounts need email confirmation.',
  	"admin_api_already_confirmed" varchar DEFAULT 'Already confirmed.',
  	"admin_api_already_confirmed_error" varchar DEFAULT 'This account is already confirmed.',
  	"admin_api_confirmed_by_admin" varchar DEFAULT 'Email confirmed. The participant can use the portal and register teams now.',
  	"admin_api_mail_sent" varchar DEFAULT 'Email sent.',
  	"admin_api_mail_queued" varchar DEFAULT 'Today''s email limit is reached: the email is queued and goes out as soon as the limit allows.',
  	"admin_api_mail_limit" varchar DEFAULT 'Today''s email limit is reached; reset links expire within an hour, so none was sent. Try again tomorrow.',
  	"admin_api_mail_not_configured" varchar DEFAULT 'Email is not configured on this server.',
  	"admin_api_mail_failed" varchar DEFAULT 'The email could not be sent. Please try again later.',
  	"admin_api_reset_sent" varchar DEFAULT 'Password reset email sent (the link works for 60 minutes).',
  	"admin_api_unlocked" varchar DEFAULT 'Unlocked. They can sign in again.',
  	"admin_api_delete_super_only" varchar DEFAULT 'Only the Super Admin can delete accounts.',
  	"admin_api_delete_self" varchar DEFAULT 'You can''t delete your own account.',
  	"admin_api_delete_super" varchar DEFAULT 'Super Admin accounts are not deleted from here.',
  	"admin_api_delete_linked" varchar DEFAULT 'This account is linked to {count} registration(s), so it is kept.',
  	"admin_api_deleted" varchar DEFAULT 'Account deleted.',
  	"admin_api_action_failed" varchar DEFAULT 'The action failed. Please try again.',
  	"dashboard_overview_title" varchar DEFAULT 'AURIX registrations — overview',
  	"dashboard_overview_note" varchar DEFAULT 'Live numbers from team registrations. Click a number to open the matching list.',
  	"dashboard_finance_title" varchar DEFAULT 'Finance',
  	"dashboard_finance_note" varchar DEFAULT 'Set payment status in Event Registrations once a payment is matched.',
  	"dashboard_finance_read_only" varchar DEFAULT 'Read-only finance view.',
  	"dashboard_desk_title" varchar DEFAULT 'Registration desk',
  	"dashboard_desk_note" varchar DEFAULT 'Check ID cards, then confirm or reject teams in Event Registrations.',
  	"dashboard_your_events_title" varchar DEFAULT 'Your events',
  	"dashboard_your_events_none" varchar DEFAULT 'No events are assigned to your account yet — ask an admin to add them under Users → Assigned events.',
  	"dashboard_your_events_note" varchar DEFAULT 'Rosters are in Event Registrations; download the check-in list below.',
  	"dashboard_per_event_title" varchar DEFAULT 'Teams per event',
  	"dashboard_per_event_note" varchar DEFAULT 'Registered teams and participants per event.',
  	"dashboard_numbers_title" varchar DEFAULT 'AURIX in numbers',
  	"dashboard_numbers_note" varchar DEFAULT 'Totals only. Colleges counts distinct college names of active teams.',
  	"dashboard_teams" varchar DEFAULT 'Teams',
  	"dashboard_participants" varchar DEFAULT 'Participants',
  	"dashboard_confirmed" varchar DEFAULT 'Confirmed',
  	"dashboard_awaiting_payment" varchar DEFAULT 'Awaiting payment',
  	"dashboard_ids_to_check" varchar DEFAULT 'IDs to check',
  	"dashboard_verified_revenue" varchar DEFAULT 'Verified revenue',
  	"dashboard_paid" varchar DEFAULT 'Paid',
  	"dashboard_ids_pending" varchar DEFAULT 'IDs pending',
  	"dashboard_ids_approved" varchar DEFAULT 'IDs approved',
  	"dashboard_expected" varchar DEFAULT 'Expected',
  	"dashboard_verified" varchar DEFAULT 'Verified',
  	"dashboard_expected_active" varchar DEFAULT 'Expected (active teams)',
  	"dashboard_awaiting_confirmation" varchar DEFAULT 'Awaiting confirmation',
  	"dashboard_registrations_teams" varchar DEFAULT 'Registrations (teams)',
  	"dashboard_colleges" varchar DEFAULT 'Colleges',
  	"dashboard_events" varchar DEFAULT 'Events',
  	"dashboard_prize_pools" varchar DEFAULT 'Prize pools',
  	"dashboard_event_column" varchar DEFAULT 'Event',
  	"dashboard_event_fallback" varchar DEFAULT 'Event {id}',
  	"dashboard_due_title" varchar DEFAULT 'Participant data is due for deletion',
  	"dashboard_due_text" varchar DEFAULT '({events}): the privacy policy promises deletion one month after the event. Open the retention page →',
  	"dashboard_checkin_button" varchar DEFAULT 'Check-in desk',
  	"dashboard_payments_button" varchar DEFAULT 'Match Razorpay payments',
  	"dashboard_export_full" varchar DEFAULT 'Full export (CSV)',
  	"dashboard_export_finance" varchar DEFAULT 'Finance (CSV)',
  	"dashboard_export_checkin" varchar DEFAULT 'Check-in list (CSV)',
  	"dashboard_export_roster" varchar DEFAULT 'Roster: names, teams, colleges (CSV)',
  	"accounts_title_participants" varchar DEFAULT 'Participants',
  	"accounts_title_team" varchar DEFAULT 'Team accounts',
  	"accounts_admins_only" varchar DEFAULT 'Only admins can manage accounts.',
  	"accounts_intro_participants" varchar DEFAULT '{count}, {unconfirmed} not confirmed yet. Participants get at most 2 confirmation emails a day on their own; a resend from here is not limited but still counts toward today''s email limit. Unconfirmed accounts are deleted 7 days after sign-up unless they are linked to a team. Team and admin accounts are under {link}.',
  	"accounts_intro_team" varchar DEFAULT '{count}. To add someone or change their account type, roles or assigned events, use {link}. Participants are under {link2}.',
  	"accounts_link_team_accounts" varchar DEFAULT 'Team accounts',
  	"accounts_link_users" varchar DEFAULT 'Team & admin accounts',
  	"accounts_link_participants" varchar DEFAULT 'Participants',
  	"accounts_participant_one" varchar DEFAULT 'participant account',
  	"accounts_participant_many" varchar DEFAULT 'participant accounts',
  	"accounts_team_one" varchar DEFAULT 'team or admin account',
  	"accounts_team_many" varchar DEFAULT 'team and admin accounts',
  	"accounts_match_one" varchar DEFAULT 'match',
  	"accounts_match_many" varchar DEFAULT 'matches',
  	"accounts_account_one" varchar DEFAULT 'account',
  	"accounts_account_many" varchar DEFAULT 'accounts',
  	"accounts_search_participants" varchar DEFAULT 'Search name, email, college or phone',
  	"accounts_search_team" varchar DEFAULT 'Search name or email',
  	"accounts_aria_search" varchar DEFAULT 'Search',
  	"accounts_aria_status" varchar DEFAULT 'Status',
  	"accounts_aria_team" varchar DEFAULT 'Team',
  	"accounts_aria_type" varchar DEFAULT 'Account type',
  	"accounts_aria_role" varchar DEFAULT 'Role',
  	"accounts_aria_sort" varchar DEFAULT 'Sort',
  	"accounts_any_status" varchar DEFAULT 'Any status',
  	"accounts_locked_or_not" varchar DEFAULT 'Locked or not',
  	"accounts_not_confirmed_option" varchar DEFAULT 'Email not confirmed',
  	"accounts_confirmed_option" varchar DEFAULT 'Email confirmed',
  	"accounts_locked_option" varchar DEFAULT 'Locked (failed sign-ins)',
  	"accounts_team_any" varchar DEFAULT 'With or without a team',
  	"accounts_team_yes" varchar DEFAULT 'Has registered a team',
  	"accounts_team_no" varchar DEFAULT 'No team yet',
  	"accounts_any_type" varchar DEFAULT 'Any account type',
  	"accounts_any_role" varchar DEFAULT 'Any role',
  	"accounts_sort_newest" varchar DEFAULT 'Newest first',
  	"accounts_sort_oldest" varchar DEFAULT 'Oldest first',
  	"accounts_sort_name" varchar DEFAULT 'Name A–Z',
  	"accounts_sort_email" varchar DEFAULT 'Email A–Z',
  	"accounts_apply" varchar DEFAULT 'Apply',
  	"accounts_clear" varchar DEFAULT 'Clear',
  	"accounts_col_account" varchar DEFAULT 'Account',
  	"accounts_col_college" varchar DEFAULT 'College',
  	"accounts_col_type_roles" varchar DEFAULT 'Type & roles',
  	"accounts_col_confirmed" varchar DEFAULT 'Email confirmed',
  	"accounts_col_signed_up" varchar DEFAULT 'Signed up',
  	"accounts_col_created" varchar DEFAULT 'Created',
  	"accounts_col_teams" varchar DEFAULT 'Teams',
  	"accounts_col_actions" varchar DEFAULT 'Actions',
  	"accounts_no_match" varchar DEFAULT 'No accounts match.',
  	"accounts_locked_until" varchar DEFAULT 'Locked until {date}',
  	"accounts_no_name" varchar DEFAULT '(no name)',
  	"accounts_confirmed_on" varchar DEFAULT 'Confirmed {date}',
  	"accounts_not_confirmed" varchar DEFAULT 'Not confirmed',
  	"accounts_mails_line" varchar DEFAULT '{count} email(s) in 24 h · deleted on {date} if not confirmed',
  	"accounts_super_only" varchar DEFAULT 'Super Admin only',
  	"accounts_previous" varchar DEFAULT '← Previous',
  	"accounts_next" varchar DEFAULT 'Next →',
  	"accounts_page_of" varchar DEFAULT 'Page {page} of {pages}',
  	"accounts_act_confirm" varchar DEFAULT 'Confirm email',
  	"accounts_act_confirm_question" varchar DEFAULT 'Mark {label} as confirmed without the email link? Only do this if you know the address is theirs.',
  	"accounts_act_resend" varchar DEFAULT 'Resend confirmation',
  	"accounts_act_resend_question" varchar DEFAULT 'Send {label} a new confirmation link? Older links stop working.',
  	"accounts_act_reset" varchar DEFAULT 'Send password reset',
  	"accounts_act_reset_question" varchar DEFAULT 'Email {label} a link to choose a new password (valid 60 minutes)?',
  	"accounts_act_unlock" varchar DEFAULT 'Unlock',
  	"accounts_act_delete" varchar DEFAULT 'Delete',
  	"accounts_act_delete_question" varchar DEFAULT 'Permanently delete the account {label}? This cannot be undone.',
  	"accounts_act_failed" varchar DEFAULT 'The action failed.',
  	"accounts_act_done" varchar DEFAULT 'Done.',
  	"csv_code" varchar DEFAULT 'Registration code',
  	"csv_event" varchar DEFAULT 'Event',
  	"csv_team" varchar DEFAULT 'Team',
  	"csv_member_no" varchar DEFAULT 'Member #',
  	"csv_name" varchar DEFAULT 'Name',
  	"csv_college" varchar DEFAULT 'College',
  	"csv_status" varchar DEFAULT 'Status',
  	"csv_leader_phone" varchar DEFAULT 'Leader phone',
  	"csv_payment" varchar DEFAULT 'Payment',
  	"csv_id_check" varchar DEFAULT 'ID check',
  	"csv_arrived" varchar DEFAULT 'Arrived',
  	"csv_arrived_yes" varchar DEFAULT 'yes',
  	"csv_leader" varchar DEFAULT 'Leader',
  	"csv_leader_email" varchar DEFAULT 'Leader email',
  	"csv_leader_college" varchar DEFAULT 'Leader college',
  	"csv_members" varchar DEFAULT 'Members',
  	"csv_amount" varchar DEFAULT 'Amount (INR)',
  	"csv_payment_status" varchar DEFAULT 'Payment status',
  	"csv_payment_ref" varchar DEFAULT 'Payment reference',
  	"csv_verified_at" varchar DEFAULT 'Verified at',
  	"csv_registered_at" varchar DEFAULT 'Registered at',
  	"csv_member_names" varchar DEFAULT 'Member names',
  	"csv_member_colleges" varchar DEFAULT 'Member colleges',
  	"csv_admin_notes" varchar DEFAULT 'Admin notes',
  	"csv_form_fallback_name" varchar DEFAULT 'Website form',
  	"visibility_title" varchar DEFAULT 'Page visibility',
  	"visibility_intro" varchar DEFAULT 'Hidden pages show "not found" to visitors and disappear from menus, footers, buttons and the sitemap. Hiding a page also hides the pages under it (for example Projects hides every project page), except the two home pages. Changes appear on the site within about a minute.',
  	"visibility_admins_only" varchar DEFAULT 'Only admins can hide or show pages.',
  	"visibility_save" varchar DEFAULT 'Save',
  	"visibility_saving" varchar DEFAULT 'Saving…',
  	"visibility_saved" varchar DEFAULT 'Saved. The site shows the change within about a minute.',
  	"visibility_save_failed" varchar DEFAULT 'Could not save.',
  	"visibility_search_placeholder" varchar DEFAULT 'Search page name or address',
  	"visibility_aria_search" varchar DEFAULT 'Search pages',
  	"visibility_aria_show" varchar DEFAULT 'Show',
  	"visibility_aria_section" varchar DEFAULT 'Section',
  	"visibility_show_all" varchar DEFAULT 'Visible and hidden',
  	"visibility_show_visible" varchar DEFAULT 'Visible only',
  	"visibility_show_hidden" varchar DEFAULT 'Hidden only',
  	"visibility_all_sections" varchar DEFAULT 'All sections',
  	"visibility_no_match" varchar DEFAULT 'No pages match.',
  	"visibility_hidden_count" varchar DEFAULT '{n} hidden',
  	"visibility_unsaved" varchar DEFAULT ' · unsaved changes',
  	"visibility_visible" varchar DEFAULT 'Visible',
  	"visibility_hidden" varchar DEFAULT 'Hidden',
  	"visibility_aria_switch" varchar DEFAULT '{page}: {state}',
  	"visibility_group_krs" varchar DEFAULT 'KRS site',
  	"visibility_group_aurix" varchar DEFAULT 'AURIX site',
  	"visibility_group_competitions" varchar DEFAULT 'Competitions',
  	"visibility_group_your_pages" varchar DEFAULT 'Your pages',
  	"visibility_group_accounts" varchar DEFAULT 'Accounts & portals',
  	"visibility_group_legal" varchar DEFAULT 'Legal',
  	"visibility_group_other" varchar DEFAULT 'Other',
  	"visibility_note_draft" varchar DEFAULT 'Draft in Events: not on the site whatever this switch says.',
  	"visibility_note_unpublished" varchar DEFAULT 'Unpublished in Website → Pages: not on the site whatever this switch says.',
  	"visibility_note_missing" varchar DEFAULT 'No page at this address right now.',
  	"visibility_p_root" varchar DEFAULT 'KRS home',
  	"visibility_n_root" varchar DEFAULT 'Hiding it leaves the KRS site without a home page.',
  	"visibility_p_projects" varchar DEFAULT 'Projects (and every project page)',
  	"visibility_p_learning" varchar DEFAULT 'Learning (and every resource page)',
  	"visibility_p_blogs" varchar DEFAULT 'Blogs (and every post)',
  	"visibility_p_gallery" varchar DEFAULT 'Gallery',
  	"visibility_p_events" varchar DEFAULT 'KRS events',
  	"visibility_p_insights" varchar DEFAULT 'Insights',
  	"visibility_p_team" varchar DEFAULT 'Team',
  	"visibility_p_join" varchar DEFAULT 'Join KRS form',
  	"visibility_p_contact" varchar DEFAULT 'Contact form',
  	"visibility_p_aurix" varchar DEFAULT 'AURIX home',
  	"visibility_n_aurix" varchar DEFAULT 'Hides only the AURIX home page, not the pages under it.',
  	"visibility_p_aurix_competitions" varchar DEFAULT 'Competitions overview',
  	"visibility_p_aurix_rules" varchar DEFAULT 'Rules',
  	"visibility_p_aurix_faq" varchar DEFAULT 'FAQ',
  	"visibility_p_aurix_schedule" varchar DEFAULT 'Schedule',
  	"visibility_p_aurix_results" varchar DEFAULT 'Results',
  	"visibility_p_aurix_register" varchar DEFAULT 'Team registration form',
  	"visibility_p_aurix_status" varchar DEFAULT 'Registration status lookup',
  	"visibility_p_register" varchar DEFAULT 'Participant sign-up',
  	"visibility_p_login" varchar DEFAULT 'Participant sign-in',
  	"visibility_p_forgot_password" varchar DEFAULT 'Forgot password',
  	"visibility_p_aurix_portal" varchar DEFAULT 'Participant portal',
  	"visibility_p_judge" varchar DEFAULT 'Judging portal',
  	"visibility_p_privacy" varchar DEFAULT 'Privacy policy',
  	"visibility_p_terms" varchar DEFAULT 'Terms',
  	"admin_nav_group" varchar DEFAULT 'Admin tools',
  	"admin_nav_page_visibility" varchar DEFAULT 'Page visibility',
  	"admin_nav_participants" varchar DEFAULT 'Participants',
  	"admin_nav_team_accounts" varchar DEFAULT 'Team accounts',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "countdown_label" SET DEFAULT 'Starts In';
  ALTER TABLE "pages_blocks_event_cards" ALTER COLUMN "button_label" SET DEFAULT 'View Details';
  ALTER TABLE "pages_blocks_event_cards" ALTER COLUMN "prize_label" SET DEFAULT 'Prize pool';
  ALTER TABLE "pages_blocks_event_cards" ALTER COLUMN "team_fallback" SET DEFAULT 'Team';
  ALTER TABLE "pages_blocks_blog_cards" ALTER COLUMN "read_label" SET DEFAULT 'min read';
  ALTER TABLE "pages_blocks_project_grid" ALTER COLUMN "button_label" SET DEFAULT 'Dossier';
  ALTER TABLE "pages_blocks_blog_grid" ALTER COLUMN "read_label" SET DEFAULT 'min read';
  ALTER TABLE "pages_blocks_blog_grid" ALTER COLUMN "read_more_label" SET DEFAULT 'Read Article';
  ALTER TABLE "pages_blocks_gallery_grid" ALTER COLUMN "all_label" SET DEFAULT 'All';
  ALTER TABLE "pages_blocks_gallery_grid" ALTER COLUMN "empty_text" SET DEFAULT 'No photos in this category yet.';
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "member_singular" SET DEFAULT 'Member';
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "member_plural" SET DEFAULT 'Members';
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "since_label" SET DEFAULT 'Since';
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "status_label" SET DEFAULT 'Status:';
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "active_label" SET DEFAULT 'Active';
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "alumni_label" SET DEFAULT 'Alumni';
  ALTER TABLE "pages_blocks_comparison_table" ALTER COLUMN "col_name" SET DEFAULT 'Competition';
  ALTER TABLE "pages_blocks_comparison_table" ALTER COLUMN "col_team" SET DEFAULT 'Team Composition';
  ALTER TABLE "pages_blocks_comparison_table" ALTER COLUMN "col_fee" SET DEFAULT 'Registration Fee';
  ALTER TABLE "pages_blocks_comparison_table" ALTER COLUMN "col_prize" SET DEFAULT 'Prize Pool';
  ALTER TABLE "pages_blocks_comparison_table" ALTER COLUMN "col_specs" SET DEFAULT 'Robot Constraints';
  ALTER TABLE "pages_blocks_comparison_table" ALTER COLUMN "col_dates" SET DEFAULT 'Dates';
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "button_label" SET DEFAULT 'View Full Event Page';
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "fee_label" SET DEFAULT 'Fee';
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "team_label" SET DEFAULT 'Team Size';
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "dates_label" SET DEFAULT 'Dates';
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "version_label" SET DEFAULT 'Version';
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "version_value" SET DEFAULT 'v1.0 (Official)';
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "unpriced_label" SET DEFAULT 'Unpriced';
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "notice_label" SET DEFAULT 'Notice:';
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "team_fallback" SET DEFAULT 'Team Entry';
  ALTER TABLE "pages_blocks_registration_form" ALTER COLUMN "closed_text" SET DEFAULT 'Registration is not open right now. Please check back soon.';
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_label" SET DEFAULT 'Status:';
  ALTER TABLE "event_page_labels" ALTER COLUMN "countdown_label" SET DEFAULT 'Tournament Commences In';
  ALTER TABLE "event_page_labels" ALTER COLUMN "stat_date" SET DEFAULT 'Date';
  ALTER TABLE "event_page_labels" ALTER COLUMN "stat_venue" SET DEFAULT 'Venue';
  ALTER TABLE "event_page_labels" ALTER COLUMN "venue_value" SET DEFAULT 'IILM University, Greater Noida';
  ALTER TABLE "event_page_labels" ALTER COLUMN "stat_team" SET DEFAULT 'Composition';
  ALTER TABLE "event_page_labels" ALTER COLUMN "stat_fee" SET DEFAULT 'Entry Fee';
  ALTER TABLE "event_page_labels" ALTER COLUMN "fee_suffix" SET DEFAULT ' / team';
  ALTER TABLE "event_page_labels" ALTER COLUMN "unpriced" SET DEFAULT 'Unpriced';
  ALTER TABLE "event_page_labels" ALTER COLUMN "stat_prize" SET DEFAULT 'Prize Pool';
  ALTER TABLE "event_page_labels" ALTER COLUMN "prize_tba" SET DEFAULT 'To be announced';
  ALTER TABLE "event_page_labels" ALTER COLUMN "rules_button" SET DEFAULT 'Read Technical Rules';
  ALTER TABLE "event_page_labels" ALTER COLUMN "footage_button" SET DEFAULT 'View Tournament Footage';
  ALTER TABLE "event_page_labels" ALTER COLUMN "notice_title" SET DEFAULT 'Official Arena Confidentiality Notice';
  ALTER TABLE "event_page_labels" ALTER COLUMN "team_exact" SET DEFAULT 'Exactly {count} Members';
  ALTER TABLE "event_page_labels" ALTER COLUMN "team_range" SET DEFAULT '{min}–{max} Members';
  ALTER TABLE "event_page_labels" ALTER COLUMN "team_operator" SET DEFAULT '{count} Operator';
  ALTER TABLE "event_page_labels" ALTER COLUMN "team_unknown" SET DEFAULT 'Team';
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_draft" SET DEFAULT 'DRAFT';
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_announced" SET DEFAULT 'ANNOUNCED';
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_open" SET DEFAULT 'REGISTRATION OPEN';
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_closed" SET DEFAULT 'REGISTRATION CLOSED';
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_live" SET DEFAULT 'IN PROGRESS';
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_judging" SET DEFAULT 'JUDGING';
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_results_pending" SET DEFAULT 'RESULTS PENDING';
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_results" SET DEFAULT 'RESULTS PUBLISHED';
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_archived" SET DEFAULT 'ARCHIVED';
  ALTER TABLE "event_page_labels" ALTER COLUMN "countdown_days" SET DEFAULT 'Days';
  ALTER TABLE "event_page_labels" ALTER COLUMN "countdown_hours" SET DEFAULT 'Hours';
  ALTER TABLE "event_page_labels" ALTER COLUMN "countdown_mins" SET DEFAULT 'Mins';
  ALTER TABLE "event_page_labels" ALTER COLUMN "countdown_secs" SET DEFAULT 'Secs';
  ALTER TABLE "event_page_labels" ALTER COLUMN "countdown_over" SET DEFAULT 'Event is Live or Concluded';
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_open" SET DEFAULT 'Register Team Now';
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_closed" SET DEFAULT 'Registration Closed';
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_live" SET DEFAULT 'Event Live in Progress';
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_results_pending" SET DEFAULT 'Results Pending';
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_results" SET DEFAULT 'View Official Results';
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_archived" SET DEFAULT 'Event Archived';
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_announced" SET DEFAULT 'Announced — Learn More';
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_title" SET DEFAULT 'Ready to Compete in {name}?';
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_text" SET DEFAULT 'Form your team, prepare your hardware and software, and secure your place in the national arena at IILM University Greater Noida.';
  ALTER TABLE "event_page_labels" ALTER COLUMN "overview_eyebrow" SET DEFAULT 'Section 01 // Overview & Scope';
  ALTER TABLE "event_page_labels" ALTER COLUMN "overview_title" SET DEFAULT 'Competition Mission';
  ALTER TABLE "event_page_labels" ALTER COLUMN "eligibility_label" SET DEFAULT 'Eligibility Invariants:';
  ALTER TABLE "event_page_labels" ALTER COLUMN "tracks_eyebrow" SET DEFAULT 'Section 02 // Challenge Tracks';
  ALTER TABLE "event_page_labels" ALTER COLUMN "tracks_title" SET DEFAULT 'Nine Problem Domains';
  ALTER TABLE "event_page_labels" ALTER COLUMN "tracks_intro" SET DEFAULT 'Teams select one primary track for proposal evaluation and prototyping.';
  ALTER TABLE "event_page_labels" ALTER COLUMN "track_label" SET DEFAULT 'Track';
  ALTER TABLE "event_page_labels" ALTER COLUMN "target_focus" SET DEFAULT 'Target Focus:';
  ALTER TABLE "event_page_labels" ALTER COLUMN "rounds_eyebrow" SET DEFAULT 'Section 03 // Progression';
  ALTER TABLE "event_page_labels" ALTER COLUMN "rounds_title" SET DEFAULT 'Multi-Round Progression';
  ALTER TABLE "event_page_labels" ALTER COLUMN "round_label" SET DEFAULT 'Round';
  ALTER TABLE "event_page_labels" ALTER COLUMN "submission_label" SET DEFAULT 'Submission:';
  ALTER TABLE "event_page_labels" ALTER COLUMN "schedule_eyebrow" SET DEFAULT 'Section 04 // Sprint Timeline';
  ALTER TABLE "event_page_labels" ALTER COLUMN "schedule_title" SET DEFAULT '12-Hour Build Flow & Milestone Checkpoints';
  ALTER TABLE "event_page_labels" ALTER COLUMN "rubric_eyebrow" SET DEFAULT 'Section 05 // Evaluation Matrix';
  ALTER TABLE "event_page_labels" ALTER COLUMN "rubric_title" SET DEFAULT 'Official Scoring Rubric';
  ALTER TABLE "event_page_labels" ALTER COLUMN "criterion_label" SET DEFAULT 'Criterion';
  ALTER TABLE "event_page_labels" ALTER COLUMN "marks_label" SET DEFAULT 'Marks';
  ALTER TABLE "event_page_labels" ALTER COLUMN "rules_eyebrow" SET DEFAULT 'Section 06 // Technical Policy';
  ALTER TABLE "event_page_labels" ALTER COLUMN "rules_title" SET DEFAULT 'Competition Rules & Policy Invariants';
  ALTER TABLE "event_page_labels" ALTER COLUMN "faq_eyebrow" SET DEFAULT 'Section 07 // Inquiries';
  ALTER TABLE "event_page_labels" ALTER COLUMN "faq_title" SET DEFAULT 'Frequently Asked Questions';
  ALTER TABLE "event_page_labels" ALTER COLUMN "coming_soon_text" SET DEFAULT 'Coming Soon';
  ALTER TABLE "event_page_labels" ALTER COLUMN "coming_soon_prize" SET DEFAULT 'Prize pool';
  ALTER TABLE "event_page_labels" ALTER COLUMN "coming_soon_button" SET DEFAULT 'Explore Other Competitions';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_step1" SET DEFAULT '1. Competition & team';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_competition" SET DEFAULT 'Competition';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_members_word" SET DEFAULT 'members';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_team_name" SET DEFAULT 'Team name';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_step2" SET DEFAULT '2. Team members';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_min_note" SET DEFAULT '(min {min})';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_id_help" SET DEFAULT 'Every member must upload a clear photo or PDF of their student ID card (max 2 MB; photos are resized automatically).';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_leader" SET DEFAULT 'Team leader';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_member" SET DEFAULT 'Member {n}';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_remove" SET DEFAULT 'Remove';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_full_name" SET DEFAULT 'Full name';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_email" SET DEFAULT 'Email';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_email_optional" SET DEFAULT 'Email (optional)';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_phone" SET DEFAULT 'Phone';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_phone_optional" SET DEFAULT 'Phone (optional)';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_college" SET DEFAULT 'University / college';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_student_id" SET DEFAULT 'Student ID';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_no_file" SET DEFAULT 'No file chosen';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_add_member" SET DEFAULT 'Add member';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_step3" SET DEFAULT '3. Declaration';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_declaration" SET DEFAULT 'I confirm the details above are correct, all members are currently enrolled students, and we agree to the competition rules. I understand our student ID cards are collected only to verify eligibility, are visible only to the organizers, and will be deleted one month after the event.';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_submit" SET DEFAULT 'Register & continue to payment';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_submitting" SET DEFAULT 'Submitting…';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_choose" SET DEFAULT 'Please choose a competition.';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_members" SET DEFAULT 'This competition needs {count} team members.';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_college" SET DEFAULT 'Please enter the university / college for every team member.';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_id" SET DEFAULT 'Please upload a student ID card for every team member.';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_consent" SET DEFAULT 'Please accept the declaration to continue.';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_file_size" SET DEFAULT 'The ID file for {name} is larger than 2 MB. Please use a smaller photo.';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_failed" SET DEFAULT 'Registration failed. Please try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_title" SET DEFAULT 'Registration received';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_code" SET DEFAULT 'Your registration code';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_save" SET DEFAULT 'Save this code. Check your status anytime at';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_next" SET DEFAULT 'Next step: pay the registration fee';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_amount" SET DEFAULT 'Amount:';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_amount_unknown" SET DEFAULT 'as shown on the payment page';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_per_team" SET DEFAULT 'per team.';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_prefilled" SET DEFAULT 'Your details are pre-filled on the payment page. Please keep the same email and phone so we can match your payment.';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_confirm" SET DEFAULT 'Your registration is confirmed only after your payment and student IDs are verified. You will receive an email once it is confirmed.';
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_pay" SET DEFAULT 'Proceed to payment';
  ALTER TABLE "form_texts" ALTER COLUMN "status_code" SET DEFAULT 'Registration code';
  ALTER TABLE "form_texts" ALTER COLUMN "status_email" SET DEFAULT 'Team leader email';
  ALTER TABLE "form_texts" ALTER COLUMN "status_check" SET DEFAULT 'Check status';
  ALTER TABLE "form_texts" ALTER COLUMN "status_per_team" SET DEFAULT '/ team';
  ALTER TABLE "form_texts" ALTER COLUMN "status_row_registration" SET DEFAULT 'Registration';
  ALTER TABLE "form_texts" ALTER COLUMN "status_row_payment" SET DEFAULT 'Payment';
  ALTER TABLE "form_texts" ALTER COLUMN "status_row_ids" SET DEFAULT 'Student IDs';
  ALTER TABLE "form_texts" ALTER COLUMN "status_unknown" SET DEFAULT 'Unknown';
  ALTER TABLE "form_texts" ALTER COLUMN "status_reg_pending" SET DEFAULT 'Pending verification';
  ALTER TABLE "form_texts" ALTER COLUMN "status_reg_confirmed" SET DEFAULT 'Confirmed';
  ALTER TABLE "form_texts" ALTER COLUMN "status_reg_rejected" SET DEFAULT 'Rejected — please contact the organizers';
  ALTER TABLE "form_texts" ALTER COLUMN "status_reg_cancelled" SET DEFAULT 'Cancelled';
  ALTER TABLE "form_texts" ALTER COLUMN "status_pay_awaiting" SET DEFAULT 'Not yet verified (payments are checked once a day)';
  ALTER TABLE "form_texts" ALTER COLUMN "status_pay_verified" SET DEFAULT 'Payment verified';
  ALTER TABLE "form_texts" ALTER COLUMN "status_pay_not_found" SET DEFAULT 'Payment not found — please contact the organizers';
  ALTER TABLE "form_texts" ALTER COLUMN "status_pay_refunded" SET DEFAULT 'Refunded';
  ALTER TABLE "form_texts" ALTER COLUMN "status_id_pending" SET DEFAULT 'Being checked';
  ALTER TABLE "form_texts" ALTER COLUMN "status_id_approved" SET DEFAULT 'Approved';
  ALTER TABLE "form_texts" ALTER COLUMN "status_id_rejected" SET DEFAULT 'Rejected — please contact the organizers';
  ALTER TABLE "form_texts" ALTER COLUMN "status_code_placeholder" SET DEFAULT 'AX26-SOC-XXXXXX';
  ALTER TABLE "form_texts" ALTER COLUMN "status_members_title" SET DEFAULT 'Team members';
  ALTER TABLE "form_texts" ALTER COLUMN "status_leader_badge" SET DEFAULT 'Leader';
  ALTER TABLE "form_texts" ALTER COLUMN "status_registered_note" SET DEFAULT 'Registered on {date} IST. Payments are verified once a day, so a new payment can take up to 24–48 hours to show here.';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_login_title" SET DEFAULT 'AURIX Portal Access';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_login_subtitle" SET DEFAULT 'Kalam Robotics Society // Participant & Judge Gateway';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_email" SET DEFAULT 'Email Address';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_email_placeholder" SET DEFAULT 'participant@iilm.edu';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_password" SET DEFAULT 'Password';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_forgot" SET DEFAULT 'Forgot?';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_login_button" SET DEFAULT 'Sign In to Portal';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_login_busy" SET DEFAULT 'Authenticating...';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_login_error" SET DEFAULT 'Invalid email or password.';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_no_account" SET DEFAULT 'Don''t have an account?';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_register_link" SET DEFAULT 'Register here';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_title" SET DEFAULT 'Create Participant Account';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_subtitle" SET DEFAULT 'AURIX 2026 // National Competition Ecosystem';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_name" SET DEFAULT 'Full Legal Name *';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_name_placeholder" SET DEFAULT 'e.g. Alex Sharma';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_email" SET DEFAULT 'Institutional / Personal Email *';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_email_placeholder" SET DEFAULT 'alex@example.edu';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_college" SET DEFAULT 'College / Institution *';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_college_placeholder" SET DEFAULT 'IILM University';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_phone" SET DEFAULT 'Mobile Number *';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_phone_placeholder" SET DEFAULT '+91 98765 43210';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_password" SET DEFAULT 'Password (Minimum 8 Characters) *';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_button" SET DEFAULT 'Complete Registration';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_busy" SET DEFAULT 'Creating Account...';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_error" SET DEFAULT 'Registration failed.';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_have_account" SET DEFAULT 'Already registered?';
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_login_link" SET DEFAULT 'Log in to Portal';
  ALTER TABLE "form_texts" ALTER COLUMN "account_reg_notice" SET DEFAULT 'We''ll email you a link to confirm your address. You need a confirmed account to register a team. Accounts not confirmed within 7 days are deleted automatically.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_check_title" SET DEFAULT 'Check your email';
  ALTER TABLE "form_texts" ALTER COLUMN "account_check_text" SET DEFAULT 'We sent a confirmation link to {email}. Open it to activate your account. If you do not confirm by {date}, the account is deleted and you can sign up again.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_check_spam" SET DEFAULT 'Nothing after a few minutes? Check your spam folder, or send a new link.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_resend" SET DEFAULT 'Send a new confirmation link';
  ALTER TABLE "form_texts" ALTER COLUMN "account_resent" SET DEFAULT 'A new link is on its way. Older links no longer work.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_mail_limit" SET DEFAULT 'Today''s email limit is reached. Your confirmation email is queued and will be sent automatically as soon as the limit resets (usually within 24 hours). Please check your inbox tomorrow and confirm then.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_gate_title" SET DEFAULT 'Confirm your email to continue';
  ALTER TABLE "form_texts" ALTER COLUMN "account_gate_text" SET DEFAULT 'Your account ({email}) is not confirmed yet. Open the link we emailed you to use the AURIX portal and register teams. Unconfirmed accounts are deleted on {date}.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_wrong_address" SET DEFAULT 'Wrong address? Log out and sign up again with the right one.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_verified_title" SET DEFAULT 'Email confirmed';
  ALTER TABLE "form_texts" ALTER COLUMN "account_verified_text" SET DEFAULT 'Your AURIX account is active. You can now register your team.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_verified_button" SET DEFAULT 'Register a team';
  ALTER TABLE "form_texts" ALTER COLUMN "account_portal_button" SET DEFAULT 'Go to my portal';
  ALTER TABLE "form_texts" ALTER COLUMN "account_verify_invalid" SET DEFAULT 'This confirmation link is not valid. It may have been replaced by a newer one.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_verify_expired" SET DEFAULT 'This confirmation link has expired. Log in to get a new one.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_forgot_title" SET DEFAULT 'Reset your password';
  ALTER TABLE "form_texts" ALTER COLUMN "account_forgot_text" SET DEFAULT 'Enter the email of your account and we will send you a link to choose a new password.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_forgot_button" SET DEFAULT 'Send reset link';
  ALTER TABLE "form_texts" ALTER COLUMN "account_forgot_done" SET DEFAULT 'If an account exists for this email, a reset link has been sent. Check your inbox and spam folder.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_reset_title" SET DEFAULT 'Choose a new password';
  ALTER TABLE "form_texts" ALTER COLUMN "account_reset_label" SET DEFAULT 'New password (at least 8 characters)';
  ALTER TABLE "form_texts" ALTER COLUMN "account_reset_button" SET DEFAULT 'Save new password';
  ALTER TABLE "form_texts" ALTER COLUMN "account_reset_done" SET DEFAULT 'Your password has been changed and you are logged in.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_back_to_login" SET DEFAULT 'Back to log in';
  ALTER TABLE "form_texts" ALTER COLUMN "account_logout" SET DEFAULT 'Log out';
  ALTER TABLE "form_texts" ALTER COLUMN "account_login_to_register" SET DEFAULT 'Log in to register your team';
  ALTER TABLE "form_texts" ALTER COLUMN "account_login_to_register_text" SET DEFAULT 'Team registration needs an AURIX account for the team leader. Create one in a minute, confirm your email, and come back to this form.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_login_button" SET DEFAULT 'Log in';
  ALTER TABLE "form_texts" ALTER COLUMN "account_signup_button" SET DEFAULT 'Create an account';
  ALTER TABLE "form_texts" ALTER COLUMN "account_leader_from_account" SET DEFAULT 'The team leader is your account. To register with another leader email, log in with that account.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_confirm_intro" SET DEFAULT 'Enter the password you chose when you signed up to confirm this email address.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_confirm_password" SET DEFAULT 'Password';
  ALTER TABLE "form_texts" ALTER COLUMN "account_confirm_button" SET DEFAULT 'Confirm my email';
  ALTER TABLE "form_texts" ALTER COLUMN "account_confirm_help" SET DEFAULT 'Didn''t create this account, or forgot the password?';
  ALTER TABLE "form_texts" ALTER COLUMN "account_confirm_help_link" SET DEFAULT 'Reset the password';
  ALTER TABLE "form_texts" ALTER COLUMN "account_confirm_help_after" SET DEFAULT ': it confirms this address and lets you choose your own password.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_confirm_wrong_password" SET DEFAULT 'That password doesn''t match this account. If you didn''t create the account, or forgot the password, use "Forgot password": it confirms your email and lets you choose your own password.';
  ALTER TABLE "form_texts" ALTER COLUMN "account_reset_incomplete" SET DEFAULT 'This reset link is incomplete. Please request a new one.';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_back" SET DEFAULT 'Back to Project Portfolio';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_status" SET DEFAULT 'Status:';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_year" SET DEFAULT 'Year:';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_video" SET DEFAULT 'Watch Demonstration Video';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_photos" SET DEFAULT 'Browse Photo & Chassis Archives';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_repo" SET DEFAULT 'Repository';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_demo" SET DEFAULT 'Live Demo';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_team_lead" SET DEFAULT 'Team lead:';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_hardware" SET DEFAULT 'Hardware Architecture & Mechatronics';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_software" SET DEFAULT 'Software Perception & Kinematics';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_results_eyebrow" SET DEFAULT 'Empirical Validation & Field Trials';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_results_title" SET DEFAULT 'Tested Operational Benchmarks';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_tech" SET DEFAULT 'Integrated Technologies & Stacks';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_tutorials" SET DEFAULT 'Read related robotics tutorials';
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_aurix_button" SET DEFAULT 'Compete in AURIX Competitions';
  ALTER TABLE "form_texts" ALTER COLUMN "learning_page_back" SET DEFAULT 'Back to Knowledge Hub';
  ALTER TABLE "form_texts" ALTER COLUMN "learning_page_difficulty" SET DEFAULT 'Difficulty:';
  ALTER TABLE "form_texts" ALTER COLUMN "learning_page_drive" SET DEFAULT 'Open the material in Google Drive';
  ALTER TABLE "form_texts" ALTER COLUMN "learning_page_cta_title" SET DEFAULT 'See these concepts deployed in real hardware';
  ALTER TABLE "form_texts" ALTER COLUMN "learning_page_cta_text" SET DEFAULT 'Explore the YUVAAN semi-autonomous rover engineering case study.';
  ALTER TABLE "form_texts" ALTER COLUMN "learning_page_cta_button" SET DEFAULT 'Explore YUVAAN Rover';
  ALTER TABLE "form_texts" ALTER COLUMN "learning_page_cta_href" SET DEFAULT '/projects/yuvaan';
  ALTER TABLE "form_texts" ALTER COLUMN "blog_page_back" SET DEFAULT 'Back to All Articles';
  ALTER TABLE "form_texts" ALTER COLUMN "blog_page_read_label" SET DEFAULT 'min read';
  ALTER TABLE "form_texts" ALTER COLUMN "blog_page_cta_title" SET DEFAULT 'Ready to build competition-grade systems?';
  ALTER TABLE "form_texts" ALTER COLUMN "blog_page_cta_text" SET DEFAULT 'Apply to join the technical teams at Kalam Robotics Society.';
  ALTER TABLE "form_texts" ALTER COLUMN "blog_page_cta_button" SET DEFAULT 'Apply for Membership';
  ALTER TABLE "form_texts" ALTER COLUMN "blog_page_cta_href" SET DEFAULT '/join';
  ALTER TABLE "form_texts" ALTER COLUMN "not_found_eyebrow" SET DEFAULT 'Error 404 // Trajectory Deviation';
  ALTER TABLE "form_texts" ALTER COLUMN "not_found_title" SET DEFAULT 'Coordinates Not Found';
  ALTER TABLE "form_texts" ALTER COLUMN "not_found_text" SET DEFAULT 'The requested subsystem or page is not available. Please verify the URL or return to the main navigation telemetry.';
  ALTER TABLE "form_texts" ALTER COLUMN "not_found_home_button" SET DEFAULT 'Return to KRS Home';
  ALTER TABLE "form_texts" ALTER COLUMN "not_found_aurix_button" SET DEFAULT 'Explore AURIX Arena';
  ALTER TABLE "form_texts" ALTER COLUMN "general_skip_link" SET DEFAULT 'Skip to main content';
  ALTER TABLE "form_texts" ALTER COLUMN "general_legal_eyebrow" SET DEFAULT 'Compliance & Protection // Legal';
  ALTER TABLE "form_texts" ALTER COLUMN "general_share_eyebrow" SET DEFAULT 'KALAM ROBOTICS SOCIETY · IILM UNIVERSITY';
  ALTER TABLE "form_texts" ALTER COLUMN "general_share_title" SET DEFAULT 'AURIX 2026';
  ALTER TABLE "form_texts" ALTER COLUMN "general_share_subtitle" SET DEFAULT 'Robo Soccer · Robo Race · Robo Expo · Robo Ideathon';
  ALTER TABLE "form_texts" ALTER COLUMN "general_coming_soon" SET DEFAULT 'Coming Soon';
  ALTER TABLE "form_texts" ALTER COLUMN "general_registration_open" SET DEFAULT 'Registration Open';
  ALTER TABLE "form_texts" ALTER COLUMN "general_dates_tba" SET DEFAULT 'Dates to be announced';
  ALTER TABLE "form_texts" ALTER COLUMN "general_dates_tba_in_text" SET DEFAULT 'dates to be announced';
  ALTER TABLE "form_texts" ALTER COLUMN "general_select_placeholder" SET DEFAULT 'Select';
  ALTER TABLE "form_texts" ALTER COLUMN "general_menu_button" SET DEFAULT 'Toggle navigation menu';
  ALTER TABLE "form_texts" ALTER COLUMN "general_linkedin_text" SET DEFAULT 'LinkedIn';
  ALTER TABLE "form_texts" ALTER COLUMN "general_github_text" SET DEFAULT 'GitHub';
  ALTER TABLE "form_texts" ALTER COLUMN "general_linkedin_label" SET DEFAULT '{name} on LinkedIn';
  ALTER TABLE "form_texts" ALTER COLUMN "general_github_label" SET DEFAULT '{name} on GitHub';
  ALTER TABLE "form_texts" ALTER COLUMN "general_hero_image_alt" SET DEFAULT 'AURIX — Innovate | Build | Beyond';
  ALTER TABLE "form_texts" ALTER COLUMN "general_crumb_home" SET DEFAULT 'Home';
  ALTER TABLE "form_texts" ALTER COLUMN "general_crumb_aurix" SET DEFAULT 'AURIX';
  ALTER TABLE "form_texts" ALTER COLUMN "general_crumb_competitions" SET DEFAULT 'Competitions';
  ALTER TABLE "form_texts" ALTER COLUMN "general_org_description" SET DEFAULT 'Premier multidisciplinary student robotics society and research laboratory at IILM University, Greater Noida.';
  ALTER TABLE "form_texts" ALTER COLUMN "general_err_try_again" SET DEFAULT 'Please try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "general_err_try_later" SET DEFAULT 'Please try again later.';
  ALTER TABLE "form_texts" ALTER COLUMN "general_err_lookup" SET DEFAULT 'Lookup failed. Please try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "general_err_email" SET DEFAULT 'Could not send the email.';
  ALTER TABLE "form_texts" ALTER COLUMN "general_err_form" SET DEFAULT 'Could not send the form. Please try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_not_found" SET DEFAULT 'Not found.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_bad_origin" SET DEFAULT 'Bad origin.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_invalid_request" SET DEFAULT 'Invalid request.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_auth_required" SET DEFAULT 'Authentication required.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_login_first" SET DEFAULT 'Please log in first.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_confirm_first" SET DEFAULT 'Please confirm your email address first.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_too_many_requests" SET DEFAULT 'Too many requests. Please try again later.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_too_many_attempts" SET DEFAULT 'Too many attempts. Please try again later.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_bot_check" SET DEFAULT 'The anti-bot check did not pass. Please wait for the check to finish (or reload the page) and try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_name_rule" SET DEFAULT 'Use letters, spaces and . '' - only in the name (2–80 characters).';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_login_too_many_ip" SET DEFAULT 'Too many login attempts. Please wait a minute and try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_login_too_many_account" SET DEFAULT 'Too many attempts for this account. Please wait a minute and try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_login_invalid" SET DEFAULT 'Invalid email or password.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_signup_too_many" SET DEFAULT 'Too many registration attempts. Please try again later.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_signup_check_fields" SET DEFAULT 'Please check all fields and try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_signup_exists" SET DEFAULT 'An account with this email already exists. Please sign in.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_signup_failed" SET DEFAULT 'Registration failed. Please try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_forgot_sent" SET DEFAULT 'If an account exists for this email, a reset link has been sent. Check your inbox and spam folder.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_forgot_invalid_email" SET DEFAULT 'Please enter a valid email address.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_forgot_limit" SET DEFAULT 'Today''s email limit is reached, so no reset email can be sent. Please try again tomorrow.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reset_short" SET DEFAULT 'Use at least 8 characters for the new password.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reset_invalid" SET DEFAULT 'This reset link is invalid or has expired. Please request a new one.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_resend_ip_limit" SET DEFAULT 'Too many emails requested from this network. Please try again in an hour.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_resend_moments" SET DEFAULT 'A link was sent moments ago. Please check your inbox and spam folder.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_resend_cooldown" SET DEFAULT 'A link was sent moments ago. Please check your inbox and spam folder; you can ask for another one in {wait}.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_resend_daily" SET DEFAULT 'You have had {count} confirmation emails in the last 24 hours. Please check your spam folder; you can ask for a new link after {when} IST.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_unit_minutes" SET DEFAULT '{n} minutes';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_unit_seconds" SET DEFAULT '{n} seconds';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_resend_failed" SET DEFAULT 'The email could not be sent. Please try again later.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_status_too_many" SET DEFAULT 'Too many lookups. Please try again later.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_status_not_found" SET DEFAULT 'No registration found with that code and email. Check both and try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_claim_too_many_ip" SET DEFAULT 'Too many claim attempts from this IP. Please try again later.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_claim_too_many_user" SET DEFAULT 'Too many claim attempts for this account. Please try again later.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_claim_not_found" SET DEFAULT 'No registration found matching this code and team leader email.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_claim_done" SET DEFAULT 'Registration successfully claimed and linked to your account.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_claim_failed" SET DEFAULT 'An error occurred while claiming registration. Please try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_profile_too_many" SET DEFAULT 'Too many profile update attempts. Please try again later.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_profile_invalid_body" SET DEFAULT 'Invalid request body.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_profile_invalid" SET DEFAULT 'Please provide valid profile details.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_profile_saved" SET DEFAULT 'Profile updated successfully.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_profile_failed" SET DEFAULT 'Unable to update profile. Please try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_password_min" SET DEFAULT 'New password must be at least 8 characters long.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_password_invalid" SET DEFAULT 'Invalid password payload.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_password_wrong" SET DEFAULT 'Current password is incorrect.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_password_changed" SET DEFAULT 'Password changed successfully. You were signed out on your other devices.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_password_failed" SET DEFAULT 'Failed to update password. Please try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_invalid_action" SET DEFAULT 'Invalid action.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_too_many_network" SET DEFAULT 'Too many registration attempts from your network. Please try again later.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_login" SET DEFAULT 'Please log in to register your team.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_confirm" SET DEFAULT 'Please confirm your email address before registering a team.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_too_many" SET DEFAULT 'Too many registration attempts. Please try again later.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_invalid_form" SET DEFAULT 'Invalid form submission.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_check_fields" SET DEFAULT 'Please check all fields and try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_leader_contact" SET DEFAULT 'The team leader needs an email address and phone number.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_too_many_email" SET DEFAULT 'Too many registrations for this email address. Please try again later.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_not_open" SET DEFAULT 'Registration is not open for this event.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_closed" SET DEFAULT 'Registration for this event has closed.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_team_size" SET DEFAULT '{event} teams must have {count} members.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_id_missing" SET DEFAULT 'Please upload a student ID for {name}.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_id_too_big" SET DEFAULT 'The ID file for {name} is larger than 2 MB.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_id_type" SET DEFAULT 'The ID file for {name} must be a JPG, PNG, WebP or PDF.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_duplicate" SET DEFAULT 'A registration for this event already exists with this team leader email. Please contact the organizers if you need to change it.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_id_unreadable" SET DEFAULT 'We couldn''t read one of the ID files (member {n}). Please upload a clear JPG, PNG or PDF and try again.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_save_failed" SET DEFAULT 'Registration could not be saved. Please try again in a few minutes.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_too_many" SET DEFAULT 'Too many submissions. Please try again later.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_invalid" SET DEFAULT 'Invalid form data.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_unavailable" SET DEFAULT 'This form is not available.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_required" SET DEFAULT 'Please fill in "{label}".';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_too_long" SET DEFAULT '"{label}" is too long.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_email" SET DEFAULT '"{label}" is not a valid email address.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_phone" SET DEFAULT '"{label}" is not a valid phone number.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_choose" SET DEFAULT 'Choose an option for "{label}".';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_empty" SET DEFAULT 'The form is empty.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_failed" SET DEFAULT 'Could not send the form right now. Please try again later.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_cms_email_admin_only" SET DEFAULT 'Your email address can only be changed by an admin.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_cms_password_portal" SET DEFAULT 'Change your password on the portal profile page.';
  ALTER TABLE "form_texts" ALTER COLUMN "messages_cms_forgot_page" SET DEFAULT 'Use the "Forgot password" page at /forgot-password.';
  ALTER TABLE "form_texts" ALTER COLUMN "seo_site_name" SET DEFAULT 'Kalam Robotics Society';
  ALTER TABLE "form_texts" ALTER COLUMN "seo_share_site_name" SET DEFAULT 'Kalam Robotics Society (KRS)';
  ALTER TABLE "form_texts" ALTER COLUMN "seo_default_title" SET DEFAULT 'Kalam Robotics Society (KRS) | IILM University, Greater Noida';
  ALTER TABLE "form_texts" ALTER COLUMN "seo_default_description" SET DEFAULT 'Official digital platform and engineering lab for Kalam Robotics Society (KRS) and the flagship AURIX robotics competition series at IILM University, Greater Noida.';
  ALTER TABLE "form_texts" ALTER COLUMN "seo_keywords" SET DEFAULT 'Kalam Robotics Society, KRS IILM, AURIX 2026, Robotics Society Greater Noida, Robotics & AI Hackathon, Robo Soccer, Robo Race, Robo Expo, Robo Ideathon, IILM University Engineering';
  ALTER TABLE "form_texts" ALTER COLUMN "seo_tab_project" SET DEFAULT '{title} | Engineering Project Dossier';
  ALTER TABLE "form_texts" ALTER COLUMN "seo_tab_learning" SET DEFAULT '{title} | KRS Learning';
  ALTER TABLE "form_texts" ALTER COLUMN "seo_tab_blog" SET DEFAULT '{title} | KRS Blog';
  ALTER TABLE "form_texts" ALTER COLUMN "seo_tab_confirm" SET DEFAULT 'Confirm email | AURIX';
  ALTER TABLE "form_texts" ALTER COLUMN "seo_tab_reset" SET DEFAULT 'Choose a new password | AURIX';
  ALTER TABLE "form_texts" ALTER COLUMN "seo_tab_forgot" SET DEFAULT 'Reset password | AURIX';
  ALTER TABLE "form_texts" ALTER COLUMN "seo_tab_judge" SET DEFAULT 'Judge Evaluation Portal | AURIX 2026';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_footer_org" SET DEFAULT 'AURIX 2026 · Kalam Robotics Society, IILM University, Greater Noida';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_copy_link" SET DEFAULT 'If the button does not work, copy this link into your browser:';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reg_subject" SET DEFAULT 'Registration received: {event} — {code}';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reg_kicker" SET DEFAULT 'Registration received';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reg_intro" SET DEFAULT 'Hi {name}, thank you for registering team {team}. Keep your registration code — you will need it to check your status and at the event.';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reg_code_label" SET DEFAULT 'Registration code';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_row_event" SET DEFAULT 'Event';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_row_date" SET DEFAULT 'Date';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_row_venue" SET DEFAULT 'Venue';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_row_team" SET DEFAULT 'Team';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_row_leader" SET DEFAULT 'Leader';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_row_college" SET DEFAULT 'College';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_row_fee" SET DEFAULT 'Fee';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_members_title" SET DEFAULT 'Team members';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_leader_suffix" SET DEFAULT ' (leader)';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_pay_text" SET DEFAULT 'Your registration fee is {amount}. If you have not paid yet, use this link (your details are pre-filled):';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_pay_button" SET DEFAULT 'Pay {amount}';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_pay_text_short" SET DEFAULT 'If you have not paid yet';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_next_title" SET DEFAULT 'What happens next';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_next1" SET DEFAULT 'Our team checks the student ID cards and your payment.';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_next2" SET DEFAULT 'Once both are verified, your registration is confirmed.';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_next3" SET DEFAULT 'Check your status any time at {link} with your code and this email address.';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reg_footer" SET DEFAULT 'You received this email because this address was used to register a team at {site}.';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_verify_subject" SET DEFAULT 'Confirm your email for your AURIX account';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_verify_kicker" SET DEFAULT 'Confirm your email';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_verify_title" SET DEFAULT 'One step left';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_verify_intro" SET DEFAULT 'Hi {name}, please confirm this email address to activate your AURIX account. You need a confirmed account to register a team.';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_verify_button" SET DEFAULT 'Confirm my email';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_verify_note" SET DEFAULT 'This link works for {hours} hours. Accounts that are not confirmed are deleted on {date} (7 days after sign-up); you can sign up again any time.';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_verify_footer" SET DEFAULT 'You received this email because this address was used to create an account. If that was not you, ignore it and the account will be deleted.';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reset_subject" SET DEFAULT 'Reset your AURIX account password';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reset_kicker" SET DEFAULT 'Password reset';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reset_title" SET DEFAULT 'Choose a new password';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reset_intro" SET DEFAULT 'Hi {name}, we received a request to reset the password of your account.';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reset_button" SET DEFAULT 'Choose a new password';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reset_note" SET DEFAULT 'This link works for {minutes} minutes and only once. If you did not ask for this, ignore this email; your password stays the same.';
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reset_footer" SET DEFAULT 'You received this email because a password reset was requested for this address.';
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_subtitle" SET DEFAULT 'Participant Portal';
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_dashboard" SET DEFAULT 'Dashboard';
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_claim" SET DEFAULT 'Claim Registration';
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_events" SET DEFAULT 'My Events';
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_teams" SET DEFAULT 'Team Rosters';
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_submissions" SET DEFAULT 'Submissions';
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_announcements" SET DEFAULT 'Announcements';
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_results" SET DEFAULT 'My Results';
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_profile" SET DEFAULT 'Profile & Security';
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_public_site" SET DEFAULT 'Public Arena';
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_sign_out" SET DEFAULT 'Sign Out';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_tab_title" SET DEFAULT 'Dashboard | AURIX Participant Portal';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_fallback_event" SET DEFAULT 'AURIX 2026';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_fallback_venue" SET DEFAULT 'IILM University Greater Noida';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_eyebrow" SET DEFAULT 'Participant Operations // Dashboard';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_welcome" SET DEFAULT 'Welcome, {name}';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_session" SET DEFAULT 'AURIX Participant Session';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_register_button" SET DEFAULT 'Register a Team';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_claim_button" SET DEFAULT 'Claim Registration';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_empty_title" SET DEFAULT 'No Registrations Yet';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_empty_text" SET DEFAULT 'Register your team to see its payment, ID verification and event details here. Teams registered earlier with this account''s email appear automatically; if a team used a different email, claim it with its registration code.';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_empty_claim" SET DEFAULT 'Claim with a Code';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_empty_explore" SET DEFAULT 'Explore Competitions';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_list_title" SET DEFAULT 'Claimed Competitions ({n})';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_schedules_link" SET DEFAULT 'View Schedules & Rules →';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_fee_label" SET DEFAULT 'Registration Fee';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_statuses_title" SET DEFAULT 'Verification Statuses';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_row_entry" SET DEFAULT 'Entry Status';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_row_payment" SET DEFAULT 'Payment';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_row_ids" SET DEFAULT 'Student IDs';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_team_prefix" SET DEFAULT 'Team:';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_member_one" SET DEFAULT 'Member';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_member_many" SET DEFAULT 'Members';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_leader_badge" SET DEFAULT 'Leader';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_registered_on" SET DEFAULT 'Registered on {date}';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_pay_button" SET DEFAULT 'Pay Fee Online';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_rules_button" SET DEFAULT 'Event Rules & Specs';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_status_pending" SET DEFAULT 'Pending verification';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_status_confirmed" SET DEFAULT 'Confirmed';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_status_rejected" SET DEFAULT 'Rejected — please contact the organizers';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_status_cancelled" SET DEFAULT 'Cancelled';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_pay_awaiting" SET DEFAULT 'Not yet verified (payments are checked once a day)';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_pay_verified" SET DEFAULT 'Payment verified';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_pay_not_found" SET DEFAULT 'Payment not found — please contact the organizers';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_pay_refunded" SET DEFAULT 'Refunded';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_id_pending" SET DEFAULT 'Being checked';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_id_approved" SET DEFAULT 'Approved';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_id_rejected" SET DEFAULT 'Rejected — please contact the organizers';
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_unknown" SET DEFAULT 'Unknown';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_tab_title" SET DEFAULT 'Claim Registration | AURIX Portal';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_eyebrow" SET DEFAULT 'Account Linkage // Verification';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_title" SET DEFAULT 'Claim Your Team Registration';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_intro" SET DEFAULT 'Connect your team registration code to your personal account dashboard.';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_how_title" SET DEFAULT 'How registration claiming works';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_how_text" SET DEFAULT 'Team leaders receive a registration code (format AX26-XXX-XXXXXX) upon registering at the public registration page. Both the team leader and any registered team member can claim the registration into their personal portal dashboard using their registered email.';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_form_title" SET DEFAULT 'Claim Team Registration';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_form_intro" SET DEFAULT 'Your account email ({email}) must match either the team leader or one of the registered team members.';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_code_label" SET DEFAULT 'Registration code *';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_code_placeholder" SET DEFAULT 'AX26-SOC-XXXXXX';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_email_label" SET DEFAULT 'Team leader email *';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_email_placeholder" SET DEFAULT 'leader@college.edu';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_submit" SET DEFAULT 'Claim & Link Registration';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_back" SET DEFAULT 'Back to Dashboard';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_success_title" SET DEFAULT 'Registration Claimed!';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_success_text" SET DEFAULT 'Team {team} ({code}) has been successfully linked to your participant account.';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_dashboard_button" SET DEFAULT 'Go to Dashboard';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_another" SET DEFAULT 'Claim Another Registration';
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_failed" SET DEFAULT 'Unable to claim registration. Check details and try again.';
  ALTER TABLE "portal_texts" ALTER COLUMN "events_tab_title" SET DEFAULT 'My Events | AURIX Participant Portal';
  ALTER TABLE "portal_texts" ALTER COLUMN "events_fallback_type" SET DEFAULT 'COMPETITION';
  ALTER TABLE "portal_texts" ALTER COLUMN "events_eyebrow" SET DEFAULT 'Tournament Dossier // Event Guidelines';
  ALTER TABLE "portal_texts" ALTER COLUMN "events_title" SET DEFAULT 'My Registered Events';
  ALTER TABLE "portal_texts" ALTER COLUMN "events_intro" SET DEFAULT 'Official schedules, venue requirements, and rulebooks for your registered competitions.';
  ALTER TABLE "portal_texts" ALTER COLUMN "events_empty_title" SET DEFAULT 'No Registered Events Linked';
  ALTER TABLE "portal_texts" ALTER COLUMN "events_empty_text" SET DEFAULT 'You haven''t claimed any registrations under your account yet. Link your team registration code to view your schedule and reporting details.';
  ALTER TABLE "portal_texts" ALTER COLUMN "events_empty_button" SET DEFAULT 'Claim a Registration';
  ALTER TABLE "portal_texts" ALTER COLUMN "events_date_tba" SET DEFAULT 'Date TBA';
  ALTER TABLE "portal_texts" ALTER COLUMN "events_rulebook_button" SET DEFAULT 'Official Rulebook & Specs →';
  ALTER TABLE "portal_texts" ALTER COLUMN "events_notice_title" SET DEFAULT 'Special Event Notice';
  ALTER TABLE "portal_texts" ALTER COLUMN "events_requirements_title" SET DEFAULT 'Reporting & Participant Requirements';
  ALTER TABLE "portal_texts" ALTER COLUMN "events_schedule_title" SET DEFAULT 'Official Schedule';
  ALTER TABLE "portal_texts" ALTER COLUMN "events_schedule_empty" SET DEFAULT 'Detailed day schedule will be updated here as event dates approach.';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_tab_title" SET DEFAULT 'Teams | AURIX Participant Portal';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_fallback_event" SET DEFAULT 'AURIX Competition';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_eyebrow" SET DEFAULT 'Squad Operations // Team Rosters';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_title" SET DEFAULT 'Registered Team Rosters';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_intro" SET DEFAULT 'Rosters and verified team members for your claimed tournament registrations.';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_empty_title" SET DEFAULT 'No Teams Claimed Yet';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_empty_text" SET DEFAULT 'No team is linked to this account yet. Register a team, or claim one with its registration code if it was registered with a different email.';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_empty_button" SET DEFAULT 'Claim a Registration';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_code_label" SET DEFAULT 'Code:';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_col_name" SET DEFAULT 'Member Name';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_col_college" SET DEFAULT 'Institution / College';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_col_role" SET DEFAULT 'Role';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_leader" SET DEFAULT 'Team Leader';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_teammate" SET DEFAULT 'Teammate';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_size_one" SET DEFAULT 'Squad Size: 1 Registered Member';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_size_many" SET DEFAULT 'Squad Size: {n} Registered Members';
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_status_label" SET DEFAULT 'Status:';
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_tab_title" SET DEFAULT 'Announcements | AURIX Participant Portal';
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_fallback_event" SET DEFAULT 'Event';
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_eyebrow" SET DEFAULT 'Bulletins & Dispatches // Announcements';
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_title" SET DEFAULT 'Official Tournament Bulletins';
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_intro" SET DEFAULT 'Official tournament updates, scheduling notices, and operational announcements.';
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_empty_title" SET DEFAULT 'No Bulletins Published Yet';
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_empty_text" SET DEFAULT 'Official announcements, schedule changes, and technical updates will be posted here by organizers as the tournament approaches.';
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_pinned" SET DEFAULT 'Pinned';
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_all_badge" SET DEFAULT 'All Participants';
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_targeted_badge" SET DEFAULT 'Targeted Notice';
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_applicable" SET DEFAULT 'Applicable to:';
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_tab_title" SET DEFAULT 'Submissions | AURIX Participant Portal';
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_fallback_event" SET DEFAULT 'AURIX Competition';
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_eyebrow" SET DEFAULT 'Artifacts & Dossiers // Submissions';
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_title" SET DEFAULT 'Competition Submissions';
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_intro" SET DEFAULT 'Upload and review technical proposals, circuit diagrams, and project repositories.';
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_closed_title" SET DEFAULT 'Submission Windows Not Yet Open';
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_closed_text" SET DEFAULT 'Uploads for technical proposals and project files will open here once the organizers announce the submission deadlines.';
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_now_title" SET DEFAULT 'What you need to do now';
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_now_text" SET DEFAULT 'Ensure your team registration is claimed, payment is completed, and all student ID cards are verified. Organizers will announce submission deadlines via the portal Announcements page.';
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_bulletins_button" SET DEFAULT 'Check Bulletins';
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_dashboard_button" SET DEFAULT 'Dashboard';
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_active_title" SET DEFAULT 'Your Active Registrations';
  ALTER TABLE "portal_texts" ALTER COLUMN "results_tab_title" SET DEFAULT 'Results | AURIX Participant Portal';
  ALTER TABLE "portal_texts" ALTER COLUMN "results_eyebrow" SET DEFAULT 'Adjudication // Scorecards & Standings';
  ALTER TABLE "portal_texts" ALTER COLUMN "results_title" SET DEFAULT 'Competition Results & Standings';
  ALTER TABLE "portal_texts" ALTER COLUMN "results_intro" SET DEFAULT 'Official jury scores, mentor feedback, and tournament standings.';
  ALTER TABLE "portal_texts" ALTER COLUMN "results_pending_title" SET DEFAULT 'Results Pending Adjudication';
  ALTER TABLE "portal_texts" ALTER COLUMN "results_pending_text" SET DEFAULT 'Official scorecards, jury evaluations, and podium standings will appear here once the judging process for your registered competitions concludes and results are published by tournament organizers.';
  ALTER TABLE "portal_texts" ALTER COLUMN "results_back_button" SET DEFAULT 'Back to Dashboard';
  ALTER TABLE "portal_texts" ALTER COLUMN "results_published_text" SET DEFAULT 'Official results published. Visit the event details page for detailed tournament announcements.';
  ALTER TABLE "portal_texts" ALTER COLUMN "results_view_event" SET DEFAULT 'View Event Page →';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_tab_title" SET DEFAULT 'Profile Settings | AURIX Participant Portal';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_eyebrow" SET DEFAULT 'Account Administration // Profile';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_title" SET DEFAULT 'Participant Profile & Security';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_intro" SET DEFAULT 'Manage your personal details and authentication credentials.';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_details_title" SET DEFAULT 'Personal Details';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_details_intro" SET DEFAULT 'Keep your contact information up to date for official tournament communication.';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_name" SET DEFAULT 'Full name *';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_email" SET DEFAULT 'Account email';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_email_note" SET DEFAULT 'Email is your identity identifier and cannot be changed.';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_role" SET DEFAULT 'Role';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_phone" SET DEFAULT 'Phone number *';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_college" SET DEFAULT 'University / College *';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_save" SET DEFAULT 'Save Changes';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_saved" SET DEFAULT 'Profile details successfully updated.';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_security_title" SET DEFAULT 'Security & Password';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_security_intro" SET DEFAULT 'Update your account password. Requires verification of your current password.';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_current" SET DEFAULT 'Current password *';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_new_password" SET DEFAULT 'New password (min 8 chars) *';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_confirm_password" SET DEFAULT 'Confirm new password *';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_update" SET DEFAULT 'Update Password';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_mismatch" SET DEFAULT 'New password and confirmation do not match.';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_err_profile" SET DEFAULT 'Failed to update profile.';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_err_password" SET DEFAULT 'Failed to change password.';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_too_short" SET DEFAULT 'New password must be at least 8 characters long.';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_changed" SET DEFAULT 'Password successfully updated.';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_forgot_title" SET DEFAULT 'Forgot your current password?';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_forgot_text" SET DEFAULT 'Sign out and use "Forgot password" on the sign-in page: we email you a link to choose a new one.';
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_forgot_link" SET DEFAULT 'Reset it by email';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_eyebrow" SET DEFAULT 'Adjudication Suite // AURIX Jury Panel';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_title" SET DEFAULT 'Judge Evaluation Dashboard';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_evaluator" SET DEFAULT 'Evaluator: {name} // Assigned: AURIX Hackathon 2026';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_evaluator_fallback" SET DEFAULT 'Verified Jury Member';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_exit" SET DEFAULT 'Exit to Public Arena';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_queue_title" SET DEFAULT 'Assigned Teams Pending Evaluation';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_sample_round" SET DEFAULT 'Round 1 Online Screening';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_sample_team" SET DEFAULT 'Team: CyberKinetic Squad (Code: #KRS-HACK-88)';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_sample_status" SET DEFAULT 'Evaluation Pending';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_project_label" SET DEFAULT 'Project Title';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_sample_project" SET DEFAULT 'Autonomous Campus Infrastructure Inspector';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_track_label" SET DEFAULT 'Selected Track';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_sample_track" SET DEFAULT 'Track 1: Autonomous Campus & Smart Infrastructure';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_rubric_title" SET DEFAULT 'Scoring Rubric (Server-Enforced Calculation)';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_criterion1" SET DEFAULT 'Innovation & Feasibility (Max 40)';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_criterion2" SET DEFAULT 'Architecture & Schematics (Max 35)';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_criterion3" SET DEFAULT 'Real-World Relevance (Max 25)';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_remarks_label" SET DEFAULT 'Confidential Judge Remarks (Never exposed to participants)';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_sample_remarks" SET DEFAULT 'Solid mechanical design. Recommend testing motor driver thermal dissipation under continuous load.';
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_submit" SET DEFAULT 'Submit Verified Scorecard';
  ALTER TABLE "legal_pages" ALTER COLUMN "privacy_seo_title" SET DEFAULT 'Privacy Policy | Kalam Robotics Society';
  ALTER TABLE "legal_pages" ALTER COLUMN "privacy_seo_description" SET DEFAULT 'Data protection policies and participant privacy standards enforced by Kalam Robotics Society and AURIX at IILM University Greater Noida.';
  ALTER TABLE "legal_pages" ALTER COLUMN "terms_seo_title" SET DEFAULT 'Terms of Service & Rules | Kalam Robotics Society';
  ALTER TABLE "legal_pages" ALTER COLUMN "terms_seo_description" SET DEFAULT 'Official code of conduct, competition regulations, originality requirements, and terms of service for Kalam Robotics Society and AURIX.';
  ALTER TABLE "event_page_labels" ADD COLUMN "coming_soon_details" varchar DEFAULT 'Full details will be announced soon.';
  ALTER TABLE "form_texts" ADD COLUMN "registration_spam_trap" varchar DEFAULT 'Website';
  ALTER TABLE "form_texts" ADD COLUMN "registration_done_status_link" varchar DEFAULT 'kalamroboticssociety.com/aurix/status';
  ALTER TABLE "form_texts" ADD COLUMN "general_fmt_tba" varchar DEFAULT 'To be announced';
  ALTER TABLE "form_texts" ADD COLUMN "general_fmt_fee" varchar DEFAULT '{amount} / team';
  ALTER TABLE "form_texts" ADD COLUMN "general_fmt_fee_tba" varchar DEFAULT 'Fee to be announced';
  ALTER TABLE "form_texts" ADD COLUMN "general_fmt_members" varchar DEFAULT '{count} members';
  ALTER TABLE "form_texts" ADD COLUMN "general_fmt_up_to" varchar DEFAULT 'Up to {max} members';
  ALTER TABLE "form_texts" ADD COLUMN "general_fmt_team_entry" varchar DEFAULT 'Team entry';
  ALTER TABLE "form_texts" ADD COLUMN "general_share_prize_pool" varchar DEFAULT '{amount} prize pool';
  ALTER TABLE "form_texts" ADD COLUMN "general_share_domain" varchar DEFAULT 'kalamroboticssociety.com';
  ALTER TABLE "form_texts" ADD COLUMN "general_spam_trap" varchar DEFAULT 'Website';
  ALTER TABLE "form_texts" ADD COLUMN "general_gallery_alt" varchar DEFAULT 'Kalam Robotics Society gallery photo';
  ALTER TABLE "form_texts" ADD COLUMN "general_crumb_privacy" varchar DEFAULT 'Privacy Policy';
  ALTER TABLE "form_texts" ADD COLUMN "general_crumb_terms" varchar DEFAULT 'Terms of Service';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "staff_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "staff_texts" CASCADE;
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "countdown_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_event_cards" ALTER COLUMN "button_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_event_cards" ALTER COLUMN "prize_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_event_cards" ALTER COLUMN "team_fallback" DROP DEFAULT;
  ALTER TABLE "pages_blocks_blog_cards" ALTER COLUMN "read_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_project_grid" ALTER COLUMN "button_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_blog_grid" ALTER COLUMN "read_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_blog_grid" ALTER COLUMN "read_more_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_gallery_grid" ALTER COLUMN "all_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_gallery_grid" ALTER COLUMN "empty_text" DROP DEFAULT;
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "member_singular" DROP DEFAULT;
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "member_plural" DROP DEFAULT;
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "since_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "status_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "active_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "alumni_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_comparison_table" ALTER COLUMN "col_name" DROP DEFAULT;
  ALTER TABLE "pages_blocks_comparison_table" ALTER COLUMN "col_team" DROP DEFAULT;
  ALTER TABLE "pages_blocks_comparison_table" ALTER COLUMN "col_fee" DROP DEFAULT;
  ALTER TABLE "pages_blocks_comparison_table" ALTER COLUMN "col_prize" DROP DEFAULT;
  ALTER TABLE "pages_blocks_comparison_table" ALTER COLUMN "col_specs" DROP DEFAULT;
  ALTER TABLE "pages_blocks_comparison_table" ALTER COLUMN "col_dates" DROP DEFAULT;
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "button_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "fee_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "team_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "dates_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "version_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "version_value" DROP DEFAULT;
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "unpriced_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "notice_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_event_rulebooks" ALTER COLUMN "team_fallback" DROP DEFAULT;
  ALTER TABLE "pages_blocks_registration_form" ALTER COLUMN "closed_text" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_label" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "countdown_label" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "stat_date" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "stat_venue" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "venue_value" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "stat_team" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "stat_fee" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "fee_suffix" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "unpriced" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "stat_prize" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "prize_tba" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "rules_button" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "footage_button" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "notice_title" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "team_exact" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "team_range" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "team_operator" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "team_unknown" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_draft" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_announced" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_open" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_closed" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_live" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_judging" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_results_pending" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_results" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "status_archived" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "countdown_days" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "countdown_hours" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "countdown_mins" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "countdown_secs" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "countdown_over" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_open" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_closed" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_live" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_results_pending" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_results" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_archived" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_announced" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_title" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "cta_text" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "overview_eyebrow" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "overview_title" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "eligibility_label" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "tracks_eyebrow" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "tracks_title" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "tracks_intro" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "track_label" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "target_focus" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "rounds_eyebrow" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "rounds_title" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "round_label" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "submission_label" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "schedule_eyebrow" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "schedule_title" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "rubric_eyebrow" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "rubric_title" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "criterion_label" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "marks_label" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "rules_eyebrow" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "rules_title" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "faq_eyebrow" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "faq_title" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "coming_soon_text" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "coming_soon_prize" DROP DEFAULT;
  ALTER TABLE "event_page_labels" ALTER COLUMN "coming_soon_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_step1" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_competition" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_members_word" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_team_name" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_step2" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_min_note" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_id_help" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_leader" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_member" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_remove" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_full_name" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_email" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_email_optional" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_phone" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_phone_optional" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_college" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_student_id" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_no_file" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_add_member" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_step3" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_declaration" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_submit" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_submitting" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_choose" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_members" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_college" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_id" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_consent" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_file_size" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_err_failed" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_code" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_save" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_next" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_amount" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_amount_unknown" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_per_team" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_prefilled" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_confirm" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "registration_done_pay" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_code" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_email" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_check" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_per_team" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_row_registration" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_row_payment" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_row_ids" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_unknown" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_reg_pending" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_reg_confirmed" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_reg_rejected" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_reg_cancelled" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_pay_awaiting" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_pay_verified" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_pay_not_found" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_pay_refunded" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_id_pending" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_id_approved" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_id_rejected" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_code_placeholder" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_members_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_leader_badge" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "status_registered_note" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_login_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_login_subtitle" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_email" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_email_placeholder" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_password" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_forgot" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_login_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_login_busy" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_login_error" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_no_account" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_register_link" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_subtitle" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_name" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_name_placeholder" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_email" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_email_placeholder" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_college" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_college_placeholder" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_phone" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_phone_placeholder" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_password" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_busy" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_reg_error" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_have_account" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "sign_in_login_link" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_reg_notice" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_check_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_check_text" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_check_spam" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_resend" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_resent" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_mail_limit" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_gate_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_gate_text" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_wrong_address" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_verified_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_verified_text" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_verified_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_portal_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_verify_invalid" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_verify_expired" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_forgot_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_forgot_text" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_forgot_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_forgot_done" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_reset_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_reset_label" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_reset_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_reset_done" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_back_to_login" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_logout" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_login_to_register" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_login_to_register_text" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_login_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_signup_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_leader_from_account" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_confirm_intro" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_confirm_password" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_confirm_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_confirm_help" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_confirm_help_link" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_confirm_help_after" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_confirm_wrong_password" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "account_reset_incomplete" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_back" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_status" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_year" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_video" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_photos" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_repo" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_demo" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_team_lead" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_hardware" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_software" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_results_eyebrow" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_results_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_tech" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_tutorials" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "project_page_aurix_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "learning_page_back" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "learning_page_difficulty" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "learning_page_drive" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "learning_page_cta_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "learning_page_cta_text" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "learning_page_cta_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "learning_page_cta_href" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "blog_page_back" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "blog_page_read_label" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "blog_page_cta_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "blog_page_cta_text" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "blog_page_cta_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "blog_page_cta_href" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "not_found_eyebrow" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "not_found_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "not_found_text" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "not_found_home_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "not_found_aurix_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_skip_link" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_legal_eyebrow" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_share_eyebrow" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_share_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_share_subtitle" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_coming_soon" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_registration_open" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_dates_tba" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_dates_tba_in_text" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_select_placeholder" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_menu_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_linkedin_text" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_github_text" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_linkedin_label" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_github_label" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_hero_image_alt" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_crumb_home" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_crumb_aurix" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_crumb_competitions" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_org_description" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_err_try_again" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_err_try_later" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_err_lookup" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_err_email" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "general_err_form" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_not_found" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_bad_origin" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_invalid_request" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_auth_required" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_login_first" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_confirm_first" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_too_many_requests" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_too_many_attempts" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_bot_check" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_name_rule" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_login_too_many_ip" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_login_too_many_account" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_login_invalid" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_signup_too_many" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_signup_check_fields" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_signup_exists" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_signup_failed" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_forgot_sent" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_forgot_invalid_email" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_forgot_limit" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reset_short" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reset_invalid" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_resend_ip_limit" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_resend_moments" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_resend_cooldown" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_resend_daily" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_unit_minutes" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_unit_seconds" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_resend_failed" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_status_too_many" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_status_not_found" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_claim_too_many_ip" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_claim_too_many_user" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_claim_not_found" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_claim_done" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_claim_failed" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_profile_too_many" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_profile_invalid_body" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_profile_invalid" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_profile_saved" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_profile_failed" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_password_min" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_password_invalid" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_password_wrong" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_password_changed" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_password_failed" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_invalid_action" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_too_many_network" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_login" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_confirm" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_too_many" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_invalid_form" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_check_fields" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_leader_contact" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_too_many_email" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_not_open" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_closed" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_team_size" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_id_missing" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_id_too_big" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_id_type" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_duplicate" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_id_unreadable" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_reg_save_failed" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_too_many" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_invalid" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_unavailable" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_required" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_too_long" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_email" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_phone" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_choose" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_empty" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_form_failed" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_cms_email_admin_only" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_cms_password_portal" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "messages_cms_forgot_page" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "seo_site_name" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "seo_share_site_name" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "seo_default_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "seo_default_description" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "seo_keywords" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "seo_tab_project" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "seo_tab_learning" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "seo_tab_blog" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "seo_tab_confirm" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "seo_tab_reset" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "seo_tab_forgot" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "seo_tab_judge" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_footer_org" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_copy_link" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reg_subject" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reg_kicker" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reg_intro" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reg_code_label" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_row_event" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_row_date" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_row_venue" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_row_team" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_row_leader" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_row_college" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_row_fee" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_members_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_leader_suffix" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_pay_text" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_pay_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_pay_text_short" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_next_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_next1" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_next2" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_next3" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reg_footer" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_verify_subject" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_verify_kicker" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_verify_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_verify_intro" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_verify_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_verify_note" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_verify_footer" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reset_subject" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reset_kicker" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reset_title" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reset_intro" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reset_button" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reset_note" DROP DEFAULT;
  ALTER TABLE "form_texts" ALTER COLUMN "emails_reset_footer" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_subtitle" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_dashboard" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_claim" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_events" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_teams" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_submissions" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_announcements" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_results" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_profile" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_public_site" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "nav_sign_out" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_tab_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_fallback_event" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_fallback_venue" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_eyebrow" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_welcome" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_session" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_register_button" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_claim_button" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_empty_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_empty_text" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_empty_claim" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_empty_explore" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_list_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_schedules_link" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_fee_label" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_statuses_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_row_entry" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_row_payment" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_row_ids" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_team_prefix" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_member_one" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_member_many" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_leader_badge" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_registered_on" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_pay_button" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_rules_button" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_status_pending" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_status_confirmed" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_status_rejected" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_status_cancelled" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_pay_awaiting" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_pay_verified" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_pay_not_found" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_pay_refunded" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_id_pending" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_id_approved" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_id_rejected" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "dashboard_unknown" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_tab_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_eyebrow" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_intro" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_how_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_how_text" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_form_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_form_intro" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_code_label" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_code_placeholder" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_email_label" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_email_placeholder" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_submit" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_back" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_success_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_success_text" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_dashboard_button" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_another" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "claim_failed" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "events_tab_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "events_fallback_type" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "events_eyebrow" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "events_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "events_intro" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "events_empty_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "events_empty_text" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "events_empty_button" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "events_date_tba" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "events_rulebook_button" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "events_notice_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "events_requirements_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "events_schedule_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "events_schedule_empty" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_tab_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_fallback_event" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_eyebrow" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_intro" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_empty_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_empty_text" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_empty_button" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_code_label" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_col_name" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_col_college" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_col_role" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_leader" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_teammate" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_size_one" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_size_many" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "teams_status_label" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_tab_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_fallback_event" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_eyebrow" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_intro" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_empty_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_empty_text" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_pinned" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_all_badge" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_targeted_badge" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "announcements_applicable" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_tab_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_fallback_event" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_eyebrow" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_intro" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_closed_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_closed_text" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_now_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_now_text" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_bulletins_button" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_dashboard_button" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "submissions_active_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "results_tab_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "results_eyebrow" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "results_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "results_intro" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "results_pending_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "results_pending_text" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "results_back_button" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "results_published_text" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "results_view_event" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_tab_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_eyebrow" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_intro" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_details_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_details_intro" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_name" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_email" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_email_note" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_role" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_phone" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_college" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_save" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_saved" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_security_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_security_intro" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_current" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_new_password" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_confirm_password" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_update" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_mismatch" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_err_profile" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_err_password" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_too_short" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_changed" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_forgot_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_forgot_text" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "profile_forgot_link" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_eyebrow" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_evaluator" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_evaluator_fallback" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_exit" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_queue_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_sample_round" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_sample_team" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_sample_status" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_project_label" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_sample_project" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_track_label" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_sample_track" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_rubric_title" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_criterion1" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_criterion2" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_criterion3" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_remarks_label" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_sample_remarks" DROP DEFAULT;
  ALTER TABLE "portal_texts" ALTER COLUMN "judge_submit" DROP DEFAULT;
  ALTER TABLE "legal_pages" ALTER COLUMN "privacy_seo_title" DROP DEFAULT;
  ALTER TABLE "legal_pages" ALTER COLUMN "privacy_seo_description" DROP DEFAULT;
  ALTER TABLE "legal_pages" ALTER COLUMN "terms_seo_title" DROP DEFAULT;
  ALTER TABLE "legal_pages" ALTER COLUMN "terms_seo_description" DROP DEFAULT;
  ALTER TABLE "event_page_labels" DROP COLUMN "coming_soon_details";
  ALTER TABLE "form_texts" DROP COLUMN "registration_spam_trap";
  ALTER TABLE "form_texts" DROP COLUMN "registration_done_status_link";
  ALTER TABLE "form_texts" DROP COLUMN "general_fmt_tba";
  ALTER TABLE "form_texts" DROP COLUMN "general_fmt_fee";
  ALTER TABLE "form_texts" DROP COLUMN "general_fmt_fee_tba";
  ALTER TABLE "form_texts" DROP COLUMN "general_fmt_members";
  ALTER TABLE "form_texts" DROP COLUMN "general_fmt_up_to";
  ALTER TABLE "form_texts" DROP COLUMN "general_fmt_team_entry";
  ALTER TABLE "form_texts" DROP COLUMN "general_share_prize_pool";
  ALTER TABLE "form_texts" DROP COLUMN "general_share_domain";
  ALTER TABLE "form_texts" DROP COLUMN "general_spam_trap";
  ALTER TABLE "form_texts" DROP COLUMN "general_gallery_alt";
  ALTER TABLE "form_texts" DROP COLUMN "general_crumb_privacy";
  ALTER TABLE "form_texts" DROP COLUMN "general_crumb_terms";`)
}
