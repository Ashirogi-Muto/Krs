import type { Payload } from 'payload'

/** Registrations an account belongs to: linked as a participant, or registered with its email as team leader. */
export async function linkedRegistrationCount(payload: Payload, user: { id: number | string; email?: string }): Promise<number> {
  const or: any[] = [{ participants: { contains: user.id } }]
  if (user.email) or.push({ leaderEmail: { equals: String(user.email).toLowerCase() } })
  const res = await payload.count({ collection: 'event-registrations', where: { or }, overrideAccess: true })
  return res.totalDocs
}
