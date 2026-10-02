import { KRS_GENERAL_INFO } from './data/seed-krs'
import { HIDDEN_ROUTES } from './visibility'

/** Built-in site settings (used until the CMS "Site settings" are saved). No CMS imports here. */
export type SiteSettingsData = {
  name: string
  shortName: string
  institution: string
  location: string
  motto: string
  about: string
  domains: string[]
  pillars: { title: string; description: string }[]
  contactEmail?: string
  footerBlurb: string
  socialLinks: { platform: string; url: string }[]
  hiddenPages: string[]
}

export const DEFAULT_SETTINGS: SiteSettingsData = {
  ...KRS_GENERAL_INFO,
  domains: [...KRS_GENERAL_INFO.domains],
  pillars: [...KRS_GENERAL_INFO.pillars],
  contactEmail: undefined,
  footerBlurb: 'Multidisciplinary engineering laboratory and student robotics society affiliated with IILM University, Greater Noida.',
  socialLinks: [],
  hiddenPages: [...HIDDEN_ROUTES],
}

