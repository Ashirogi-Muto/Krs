import * as migration_20260924_075456_initial from './20260924_075456_initial';
import * as migration_20261001_225520_events_cms_fields from './20261001_225520_events_cms_fields';
import * as migration_20261001_232212_aurix_registrations from './20261001_232212_aurix_registrations';

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
    name: '20261001_232212_aurix_registrations'
  },
];
