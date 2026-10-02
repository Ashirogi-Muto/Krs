import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from '@/lib/logger'

export type ScheduleItem = { time: string; title: string; tag?: string; eventSlug?: string; location?: string; description?: string }
export type ScheduleDay = { date: string; title?: string; items: ScheduleItem[] }
export type AurixScheduleData = { intro?: string; days: ScheduleDay[] }

/** The AURIX timeline from the CMS global "AURIX Schedule" (empty when not set up or the CMS is unreachable). */
export async function getAurixSchedule(): Promise<AurixScheduleData> {
  try {
    const payload = await getPayload({ config })
    const doc: any = await payload.findGlobal({ slug: 'aurix-schedule', depth: 1 })
    const days: ScheduleDay[] = (doc?.days || [])
      .filter((d: any) => d?.date)
      .map((d: any) => ({
        date: String(d.date),
        title: d.title || undefined,
        items: (d.items || []).map((i: any) => {
          const ev = i.event && typeof i.event === 'object' && i.event.status !== 'DRAFT' ? i.event : null
          return {
            time: i.time,
            title: i.title,
            tag: i.label || ev?.shortName || ev?.title || undefined,
            eventSlug: ev?.slug || undefined,
            location: i.location || undefined,
            description: i.description || undefined,
          }
        }),
      }))
      .sort((a: ScheduleDay, b: ScheduleDay) => a.date.localeCompare(b.date))
    return { intro: doc?.intro || undefined, days }
  } catch (err: any) {
    logger.warn(`AURIX schedule unavailable: ${err?.message || err}`)
    return { days: [] }
  }
}
