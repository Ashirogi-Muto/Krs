import { KRS_GENERAL_INFO } from './data/seed-krs'
import { HIDDEN_ROUTES } from './visibility'

/** Built-in site settings (used until the CMS "Site settings" are saved). No CMS imports here. */
export type SiteSettingsData = {
  name: string
  shortName: string
  institution: string
  location: string
  motto: string
  contactEmail?: string
  footerBlurb: string
  socialLinks: { platform: string; url: string }[]
  hiddenPages: string[]
}

export const DEFAULT_SETTINGS: SiteSettingsData = {
  name: KRS_GENERAL_INFO.name,
  shortName: KRS_GENERAL_INFO.shortName,
  institution: KRS_GENERAL_INFO.institution,
  location: KRS_GENERAL_INFO.location,
  motto: KRS_GENERAL_INFO.motto,
  contactEmail: undefined,
  footerBlurb: 'Multidisciplinary engineering laboratory and student robotics society affiliated with IILM University, Greater Noida.',
  socialLinks: [],
  hiddenPages: [...HIDDEN_ROUTES],
}


/** Hero line before the small sponsor logos (Site settings → Sponsors (AURIX) → heroLabel; empty = this). */
export const DEFAULT_HERO_SPONSORS_LABEL = 'In association with'
