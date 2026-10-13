import type { Payload, PayloadRequest } from 'payload'
import { PRESETS } from './access/permissions'

/**
 * Access roles migration (owner, 8 Oct 2026). Create-only and idempotent:
 * 1. the preset roles (the fixed roles used until 8 Oct, same rights) are created when no role of that name exists;
 * 2. (8 Oct only) each team account on the old fixed roles joined its presets. The old `roles` field and its
 *    `legacyRolesMigrated` flag were removed on 13 Oct 2026 (owner), so this step is gone; `migrated` stays for the
 *    8 Oct migration's log line.
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

  // Step 2 (moving accounts off the old fixed `roles` field) ran on 8 Oct; that field was removed on 13 Oct 2026
  const migrated = 0
  return { created, migrated }
}
