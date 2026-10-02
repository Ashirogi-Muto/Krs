import type { Payload } from 'payload'

/**
 * Data retention (privacy promise): participants' records are kept for one month after the event they
 * registered for. After that, registrations, their student ID files and their emails in the outbox are deleted.
 * Deletion is started by the Super Admin from /retention (the CMS dashboard shows when an event is due).
 */
export const RETENTION_DAYS = 30

/** The moment an event's records become due for deletion (end date, or start date, + RETENTION_DAYS). */
export function deleteAfter(event: { startDate?: string | null; endDate?: string | null }): Date | null {
  const base = event.endDate || event.startDate
  if (!base) return null
  return new Date(new Date(base).getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000)
}

export type DueEvent = { id: number; title: string; slug: string; deleteAfter: string; registrations: number; idFiles: number; emails: number }

/** Events whose retention period is over and that still hold participant data. */
export async function findDue(payload: Payload, now = new Date()): Promise<DueEvent[]> {
  const { docs: events } = await payload.find({ collection: 'events', overrideAccess: true, depth: 0, pagination: false, select: { title: true, slug: true, startDate: true, endDate: true } })
  const due: DueEvent[] = []
  for (const ev of events as any[]) {
    const after = deleteAfter(ev)
    if (!after || after > now) continue
    const { docs: regs } = await payload.find({
      collection: 'event-registrations',
      overrideAccess: true,
      depth: 0,
      pagination: false,
      where: { event: { equals: ev.id } },
      select: { registrationCode: true },
    })
    if (!regs.length) continue
    const codes = (regs as any[]).map((r) => r.registrationCode)
    const ids = (regs as any[]).map((r) => r.id)
    const [idFiles, emails] = await Promise.all([
      payload.count({ collection: 'id-documents', overrideAccess: true, where: { registrationCode: { in: codes } } }),
      payload.count({ collection: 'email-outbox', overrideAccess: true, where: { registration: { in: ids } } }),
    ])
    due.push({ id: ev.id, title: ev.title, slug: ev.slug, deleteAfter: after.toISOString(), registrations: regs.length, idFiles: idFiles.totalDocs, emails: emails.totalDocs })
  }
  return due
}

/** Deletes one due event's participant data (emails, then registrations, then ID files incl. the stored files). */
export async function purgeEvent(payload: Payload, eventId: number, now = new Date()) {
  const ev: any = await payload.findByID({ collection: 'events', id: eventId, overrideAccess: true, depth: 0 })
  const after = deleteAfter(ev)
  if (!after || after > now) throw new Error('This event is not due for deletion yet')
  const { docs: regs } = await payload.find({
    collection: 'event-registrations',
    overrideAccess: true,
    depth: 0,
    pagination: false,
    where: { event: { equals: eventId } },
    select: { registrationCode: true },
  })
  const codes = (regs as any[]).map((r) => r.registrationCode)
  const ids = (regs as any[]).map((r) => r.id)
  const emails = ids.length ? await payload.delete({ collection: 'email-outbox', overrideAccess: true, where: { registration: { in: ids } } }) : { docs: [] }
  const registrations = ids.length ? await payload.delete({ collection: 'event-registrations', overrideAccess: true, where: { id: { in: ids } } }) : { docs: [] }
  // Payload removes the stored files of an upload collection together with the documents
  const idFiles = codes.length ? await payload.delete({ collection: 'id-documents', overrideAccess: true, where: { registrationCode: { in: codes } } }) : { docs: [] }
  return { event: ev.title, registrations: registrations.docs.length, idFiles: idFiles.docs.length, emails: emails.docs.length }
}
