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
    name: '20261003_124056_pages_phase2_forms'
  },
];
