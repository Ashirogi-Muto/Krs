import * as migration_20260924_075456_initial from './20260924_075456_initial';
import * as migration_20261001_225520_events_cms_fields from './20261001_225520_events_cms_fields';
import * as migration_20261001_232212_aurix_registrations from './20261001_232212_aurix_registrations';
import * as migration_20261002_030724_shortlinks_member_college_specs from './20261002_030724_shortlinks_member_college_specs';
import * as migration_20261002_032037_event_prize_pool from './20261002_032037_event_prize_pool';
import * as migration_20261002_055251_team_roles from './20261002_055251_team_roles';
import * as migration_20261002_085453_staff_roles from './20261002_085453_staff_roles';
import * as migration_20261002_093147_checkin_schedule_outbox from './20261002_093147_checkin_schedule_outbox';
import * as migration_20261002_104524_content_cms_fields from './20261002_104524_content_cms_fields';
import * as migration_20261002_110159_portal_participants_announcements from './20261002_110159_portal_participants_announcements';
import * as migration_20261002_123749_site_settings_email_status from './20261002_123749_site_settings_email_status';
import * as migration_20261002_131732_cms_phase3_pages_gallery from './20261002_131732_cms_phase3_pages_gallery';
import * as migration_20261002_150438_page_texts_insights from './20261002_150438_page_texts_insights';
import * as migration_20261003_121611_navigation_global from './20261003_121611_navigation_global';
import * as migration_20261003_122327_pages_builder from './20261003_122327_pages_builder';
import * as migration_20261003_124056_pages_phase2_forms from './20261003_124056_pages_phase2_forms';
import * as migration_20261003_125741_aurix_pages_event_labels from './20261003_125741_aurix_pages_event_labels';
import * as migration_20261003_130457_form_texts from './20261003_130457_form_texts';
import * as migration_20261003_153739_signin_texts_home_fee from './20261003_153739_signin_texts_home_fee';
import * as migration_20261003_160947_detail_page_labels from './20261003_160947_detail_page_labels';
import * as migration_20261003_163346_participant_accounts from './20261003_163346_participant_accounts';
import * as migration_20261004_053937_page_visibility_accounts from './20261004_053937_page_visibility_accounts';
import * as migration_20261004_060436_gallery_drive_optional from './20261004_060436_gallery_drive_optional';
import * as migration_20261004_062923_portal_texts_seo from './20261004_062923_portal_texts_seo';
import * as migration_20261007_211829_cms_labels_gallery_photos from './20261007_211829_cms_labels_gallery_photos';
import * as migration_20261008_001859_cms_seo_emails_messages_portal from './20261008_001859_cms_seo_emails_messages_portal';
import * as migration_20261008_004435_cms_staff_texts_defaults from './20261008_004435_cms_staff_texts_defaults';
import * as migration_20261008_053913_cms_edit_guide from './20261008_053913_cms_edit_guide';
import * as migration_20261008_065115_pages_drafts_live_preview from './20261008_065115_pages_drafts_live_preview';
import * as migration_20261008_075802_preview_click_texts from './20261008_075802_preview_click_texts';
import * as migration_20261008_085609_payment_notes from './20261008_085609_payment_notes';
import * as migration_20261008_103330_leader_id_only_member_contacts from './20261008_103330_leader_id_only_member_contacts';

export const migrations = [
  {
    up: migration_20260924_075456_initial.up,
    down: migration_20260924_075456_initial.down,
    name: '20260924_075456_initial',
  },
  {
    up: migration_20261001_225520_events_cms_fields.up,
    down: migration_20261001_225520_events_cms_fields.down,
    name: '20261001_225520_events_cms_fields',
  },
  {
    up: migration_20261001_232212_aurix_registrations.up,
    down: migration_20261001_232212_aurix_registrations.down,
    name: '20261001_232212_aurix_registrations',
  },
  {
    up: migration_20261002_030724_shortlinks_member_college_specs.up,
    down: migration_20261002_030724_shortlinks_member_college_specs.down,
    name: '20261002_030724_shortlinks_member_college_specs',
  },
  {
    up: migration_20261002_032037_event_prize_pool.up,
    down: migration_20261002_032037_event_prize_pool.down,
    name: '20261002_032037_event_prize_pool',
  },
  {
    up: migration_20261002_055251_team_roles.up,
    down: migration_20261002_055251_team_roles.down,
    name: '20261002_055251_team_roles',
  },
  {
    up: migration_20261002_085453_staff_roles.up,
    down: migration_20261002_085453_staff_roles.down,
    name: '20261002_085453_staff_roles',
  },
  {
    up: migration_20261002_093147_checkin_schedule_outbox.up,
    down: migration_20261002_093147_checkin_schedule_outbox.down,
    name: '20261002_093147_checkin_schedule_outbox',
  },
  {
    up: migration_20261002_104524_content_cms_fields.up,
    down: migration_20261002_104524_content_cms_fields.down,
    name: '20261002_104524_content_cms_fields',
  },
  {
    up: migration_20261002_110159_portal_participants_announcements.up,
    down: migration_20261002_110159_portal_participants_announcements.down,
    name: '20261002_110159_portal_participants_announcements',
  },
  {
    up: migration_20261002_123749_site_settings_email_status.up,
    down: migration_20261002_123749_site_settings_email_status.down,
    name: '20261002_123749_site_settings_email_status',
  },
  {
    up: migration_20261002_131732_cms_phase3_pages_gallery.up,
    down: migration_20261002_131732_cms_phase3_pages_gallery.down,
    name: '20261002_131732_cms_phase3_pages_gallery',
  },
  {
    up: migration_20261002_150438_page_texts_insights.up,
    down: migration_20261002_150438_page_texts_insights.down,
    name: '20261002_150438_page_texts_insights',
  },
  {
    up: migration_20261003_121611_navigation_global.up,
    down: migration_20261003_121611_navigation_global.down,
    name: '20261003_121611_navigation_global',
  },
  {
    up: migration_20261003_122327_pages_builder.up,
    down: migration_20261003_122327_pages_builder.down,
    name: '20261003_122327_pages_builder',
  },
  {
    up: migration_20261003_124056_pages_phase2_forms.up,
    down: migration_20261003_124056_pages_phase2_forms.down,
    name: '20261003_124056_pages_phase2_forms',
  },
  {
    up: migration_20261003_125741_aurix_pages_event_labels.up,
    down: migration_20261003_125741_aurix_pages_event_labels.down,
    name: '20261003_125741_aurix_pages_event_labels',
  },
  {
    up: migration_20261003_130457_form_texts.up,
    down: migration_20261003_130457_form_texts.down,
    name: '20261003_130457_form_texts',
  },
  {
    up: migration_20261003_153739_signin_texts_home_fee.up,
    down: migration_20261003_153739_signin_texts_home_fee.down,
    name: '20261003_153739_signin_texts_home_fee',
  },
  {
    up: migration_20261003_160947_detail_page_labels.up,
    down: migration_20261003_160947_detail_page_labels.down,
    name: '20261003_160947_detail_page_labels',
  },
  {
    up: migration_20261003_163346_participant_accounts.up,
    down: migration_20261003_163346_participant_accounts.down,
    name: '20261003_163346_participant_accounts',
  },
  {
    up: migration_20261004_053937_page_visibility_accounts.up,
    down: migration_20261004_053937_page_visibility_accounts.down,
    name: '20261004_053937_page_visibility_accounts',
  },
  {
    up: migration_20261004_060436_gallery_drive_optional.up,
    down: migration_20261004_060436_gallery_drive_optional.down,
    name: '20261004_060436_gallery_drive_optional',
  },
  {
    up: migration_20261004_062923_portal_texts_seo.up,
    down: migration_20261004_062923_portal_texts_seo.down,
    name: '20261004_062923_portal_texts_seo',
  },
  {
    up: migration_20261007_211829_cms_labels_gallery_photos.up,
    down: migration_20261007_211829_cms_labels_gallery_photos.down,
    name: '20261007_211829_cms_labels_gallery_photos',
  },
  {
    up: migration_20261008_001859_cms_seo_emails_messages_portal.up,
    down: migration_20261008_001859_cms_seo_emails_messages_portal.down,
    name: '20261008_001859_cms_seo_emails_messages_portal',
  },
  {
    up: migration_20261008_004435_cms_staff_texts_defaults.up,
    down: migration_20261008_004435_cms_staff_texts_defaults.down,
    name: '20261008_004435_cms_staff_texts_defaults',
  },
  {
    up: migration_20261008_053913_cms_edit_guide.up,
    down: migration_20261008_053913_cms_edit_guide.down,
    name: '20261008_053913_cms_edit_guide',
  },
  {
    up: migration_20261008_065115_pages_drafts_live_preview.up,
    down: migration_20261008_065115_pages_drafts_live_preview.down,
    name: '20261008_065115_pages_drafts_live_preview',
  },
  {
    up: migration_20261008_075802_preview_click_texts.up,
    down: migration_20261008_075802_preview_click_texts.down,
    name: '20261008_075802_preview_click_texts',
  },
  {
    up: migration_20261008_085609_payment_notes.up,
    down: migration_20261008_085609_payment_notes.down,
    name: '20261008_085609_payment_notes',
  },
  {
    up: migration_20261008_103330_leader_id_only_member_contacts.up,
    down: migration_20261008_103330_leader_id_only_member_contacts.down,
    name: '20261008_103330_leader_id_only_member_contacts'
  },
];
