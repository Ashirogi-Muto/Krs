import type { CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import { logger } from '../../lib/logger'

/** A short, non-personal label for the deleted item (users: only the id). */
export function deletedLabel(slug: string, doc: Record<string, unknown> | undefined): string {
  if (!doc) return ''
  if (slug === 'users') return ''
  for (const k of ['registrationCode', 'slug', 'path', 'title', 'filename', 'key', 'subject', 'name']) {
    const v = doc[k]
    if (typeof v === 'string' && v.trim()) return v.replace(/[\r\n]+/g, ' ').slice(0, 120)
  }
  return ''
}

/**
 * Every delete is written to the audit log (audit gap, 8 Oct 2026): who (CMS user's email, or "system" for the site's
 * own clean-ups such as retention or unconfirmed accounts), which collection and item, and through which API.
 */
export const auditDelete =
  (slug: string): CollectionAfterDeleteHook =>
  ({ doc, req, id }) => {
    const actor = req.user ? String((req.user as any).email || `user:${req.user.id}`) : 'system'
    logger.audit(actor, 'DELETED', slug, String(id ?? (doc as any)?.id ?? ''), { label: deletedLabel(slug, doc as any), via: req.payloadAPI || 'local' })
  }

export const withDeleteAudit = (collections: CollectionConfig[]): CollectionConfig[] =>
  collections.map((c) => ({ ...c, hooks: { ...c.hooks, afterDelete: [...(c.hooks?.afterDelete || []), auditDelete(c.slug)] } }))
