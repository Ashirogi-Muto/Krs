import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { logger } from './logger'
import { mergeTexts } from './texts'
import { DEFAULT_STAFF_TEXTS, type StaffTexts } from './staff-texts-defaults'

/** Staff tools / admin screen wording (CMS: Admin tools → Staff & admin texts); empty fields keep the built-in text. */
export async function getStaffTexts(payload?: Payload): Promise<StaffTexts> {
  try {
    const p = payload || (await getPayload({ config }))
    return mergeTexts(await p.findGlobal({ slug: 'staff-texts' as any, depth: 0, overrideAccess: true }), DEFAULT_STAFF_TEXTS)
  } catch (err: any) {
    logger.warn(`Staff texts unavailable, using built-in text: ${err?.message || err}`)
    return DEFAULT_STAFF_TEXTS
  }
}
