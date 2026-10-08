import type { Payload, PayloadRequest } from 'payload'
import { PRESETS, legacyPresets } from './access/permissions'

const ids = (v: unknown) =>
  (Array.isArray(v) ? v : []).map((x: any) => (x && typeof x === 'object' ? x.id : x)).filter((x) => x !== null && x !== undefined).map(Number)

/**
 * Access roles migration (owner, 8 Oct 2026). Create-only and idempotent:
 * 1. the preset roles (the fixed roles used until 8 Oct, same rights) are created when no role of that name exists;
 * 2. each team account still on the old fixed roles joins its presets and is marked `legacyRolesMigrated`, so from then
 *    on only its access roles count (removing someone from a role really removes the rights).
 * Accounts whose old roles map to no preset (e.g. Team Head alone, which granted nothing) are left as they are.
 */
export async function seedAccessRoles(payload: Payload, req?: Partial<PayloadRequest>): Promise<{ created: string[]; migrated: number }> {
  const opts = { overrideAccess: true, depth: 0, ...(req ? { req } : {}) } as const
  const { docs } = await payload.find({ collection: 'access-roles', limit: 500, pagination: false, ...opts })
  const byName = new Map<string, any>((docs as any[]).map((d) => [d.name, d]))
  const created: string[] = []
  for (const p of PRESETS) {
    if (byName.has(p.name)) continue
    const doc = await payload.create({
      collection: 'access-roles',
      data: { name: p.name, description: p.description, permissions: p.permissions, eventLimit: p.eventLimit, preset: true } as any,
      ...opts,
    })
    byName.set(p.name, doc)
    created.push(p.name)
  }

  const { docs: staff } = await payload.find({
    collection: 'users',
    where: { and: [{ role: { equals: 'STAFF' } }, { legacyRolesMigrated: { not_equals: true } }] },
    pagination: false,
    ...opts,
  })
  let migrated = 0
  for (const u of staff as any[]) {
    const presets = legacyPresets(u.roles)
    if (!presets.length) continue
    for (const p of presets) {
      const role = byName.get(p.name)
      const members = ids(role?.members)
      if (!role || members.includes(Number(u.id))) continue
      const updated = await payload.update({ collection: 'access-roles', id: role.id, data: { members: [...members, Number(u.id)] } as any, ...opts })
      byName.set(p.name, updated)
    }
    await payload.update({ collection: 'users', id: u.id, data: { legacyRolesMigrated: true } as any, ...opts })
    migrated++
  }
  return { created, migrated }
}
