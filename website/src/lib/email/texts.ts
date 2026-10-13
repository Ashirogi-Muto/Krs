import { getFormTexts } from '../form-texts'
import { getBrandImages } from '../brand-images'
import type { EmailTexts } from './templates'

/**
 * Email wording (CMS → Labels & messages → Emails) plus the logo at the top (Site settings → Logos & icons → "Logo at
 * the top of the emails"; empty = the AURIX logo). Absolute URL: email clients load it from the site.
 */
export async function emailTexts(): Promise<EmailTexts> {
  const [texts, brand] = await Promise.all([getFormTexts(), getBrandImages()])
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com'
  return { ...texts.emails, logoUrl: brand.emailLogo ? `${site}${brand.emailLogo.url}` : undefined }
}
