import { CONTENT_EDITORS, EVENT_EDITORS, REG_MANAGERS, hasRole, type StaffRole } from '../payload/access/roles'

/**
 * Live preview (docs/LIVE_PREVIEW_PLAN.md): which CMS documents can be previewed, who may preview them and which page
 * shows them. Pure (no Next/Payload runtime), so it is unit-tested. The page address always comes from the document
 * itself or this fixed list, never from the request (no open redirect).
 */

type CollectionTarget = { roles: StaffRole[]; path: (doc: Record<string, unknown>) => string | null }

const slugPath = (prefix: string) => (doc: Record<string, unknown>) =>
  typeof doc.slug === 'string' && doc.slug ? `${prefix}/${doc.slug}` : null

export const PREVIEW_COLLECTIONS: Record<string, CollectionTarget> = {
  pages: { roles: CONTENT_EDITORS, path: (doc) => (typeof doc.path === 'string' ? doc.path : null) },
  events: { roles: [...EVENT_EDITORS, ...REG_MANAGERS], path: slugPath('/aurix') },
  projects: { roles: CONTENT_EDITORS, path: slugPath('/projects') },
  posts: { roles: CONTENT_EDITORS, path: slugPath('/blogs') },
  resources: { roles: CONTENT_EDITORS, path: slugPath('/learning') },
}

/** Shared wording screens: a sample page that shows that wording (links work inside the preview). */
export const PREVIEW_GLOBALS: Record<string, { roles: StaffRole[]; path: string }> = {
  'form-texts': { roles: CONTENT_EDITORS, path: '/aurix/register' },
  'event-page-labels': { roles: [...CONTENT_EDITORS, ...EVENT_EDITORS], path: '/aurix/hackathon' },
  navigation: { roles: CONTENT_EDITORS, path: '/' },
  'site-settings': { roles: CONTENT_EDITORS, path: '/' },
  'legal-pages': { roles: CONTENT_EDITORS, path: '/privacy' },
}

/** Anyone who may enter preview for at least one screen. Admins always (hasRole). */
export const PREVIEW_ROLES: StaffRole[] = [...new Set([...CONTENT_EDITORS, ...EVENT_EDITORS, ...REG_MANAGERS])]
export const canPreviewAnything = (user: unknown) => Boolean(user) && hasRole(user as any, PREVIEW_ROLES)

export type PreviewTarget = { kind: 'collection'; slug: string; id: number } | { kind: 'global'; slug: string }

/** `?c=pages&id=18` or `?g=form-texts` → a target, or null when anything is off. */
export function parsePreviewTarget(params: URLSearchParams): PreviewTarget | null {
  const c = params.get('c')
  const g = params.get('g')
  if (c && !g) {
    const id = params.get('id') || ''
    if (!Object.hasOwn(PREVIEW_COLLECTIONS, c) || !/^[1-9][0-9]{0,9}$/.test(id)) return null
    return { kind: 'collection', slug: c, id: Number(id) }
  }
  if (g && !c && !params.has('id')) return Object.hasOwn(PREVIEW_GLOBALS, g) ? { kind: 'global', slug: g } : null
  return null
}

export const canPreviewTarget = (user: unknown, t: PreviewTarget) =>
  Boolean(user) && hasRole(user as any, t.kind === 'collection' ? PREVIEW_COLLECTIONS[t.slug].roles : PREVIEW_GLOBALS[t.slug].roles)

/** A same-site path: "/" or "/a/b-c_1", nothing that could leave the site ("//x", "/\x", "http:"). */
export const isSafeSitePath = (p: unknown): p is string =>
  typeof p === 'string' && p.length <= 200 && /^\/(?:[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*)?$/.test(p)

/** The live-preview iframe URL for a CMS screen (`admin.livePreview.url`); null hides the panel (e.g. unsaved doc). */
export function previewUrl(target: { collection?: string; global?: string; id?: unknown }): string | null {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com').replace(/\/$/, '')
  if (target.global) return Object.hasOwn(PREVIEW_GLOBALS, target.global) ? `${site}/api/preview?g=${target.global}` : null
  const id = Number(target.id)
  if (!target.collection || !Object.hasOwn(PREVIEW_COLLECTIONS, target.collection) || !Number.isInteger(id) || id <= 0) return null
  return `${site}/api/preview?c=${target.collection}&id=${id}`
}
