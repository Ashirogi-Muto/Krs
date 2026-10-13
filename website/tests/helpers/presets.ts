import { legacyPresets } from '../../src/payload/access/permissions'

/** A team member's `accessRoles` holding the preset role(s) of fixed roles of 2 Oct 2026 (e.g. 'MEDIA', 'FINANCE'). */
export const presetRoles = (...fixed: string[]) => ({
  docs: legacyPresets(fixed).map((p) => ({ name: p.name, permissions: p.permissions, eventLimit: p.eventLimit })),
})
