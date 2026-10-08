import { canAny, canFor } from '../payload/access/permissions'

/**
 * Live preview (docs/LIVE_PREVIEW_PLAN.md): which CMS documents can be previewed, who may preview them and which page
 * shows them. Pure (no Next/Payload runtime), so it is unit-tested. The page address always comes from the document
 * itself or this fixed list, never from the request (no open redirect).
 */

/** keys: any of these access-role permissions (for this document) lets someone preview it. */
type CollectionTarget = { keys: string[]; path: (doc: Record<string, unknown>) => string | null }

const slugPath = (prefix: string) => (doc: Record<string, unknown>) =>
  typeof doc.slug === 'string' && doc.slug ? `${prefix}/${doc.slug}` : null

export const PREVIEW_COLLECTIONS: Record<string, CollectionTarget> = {
  pages: { keys: ['pages.view', 'pages.edit'], path: (doc) => (typeof doc.path === 'string' ? doc.path : null) },
  events: { keys: ['events.viewDrafts', 'events.editTexts', 'events.editLocked'], path: slugPath('/aurix') },
  projects: { keys: ['projects.view', 'projects.edit'], path: slugPath('/projects') },
  posts: { keys: ['posts.view', 'posts.edit'], path: slugPath('/blogs') },
  resources: { keys: ['resources.view', 'resources.edit'], path: slugPath('/learning') },
}

/** Shared wording screens: a sample page that shows that wording (links work inside the preview). */
export const PREVIEW_GLOBALS: Record<string, { keys: string[]; path: string }> = {
  'form-texts': { keys: ['globals.formTexts'], path: '/aurix/register' },
  'event-page-labels': { keys: ['globals.eventPageLabels'], path: '/aurix/hackathon' },
  navigation: { keys: ['globals.navigation'], path: '/' },
  'site-settings': { keys: ['globals.siteSettings'], path: '/' },
  'legal-pages': { keys: ['globals.legalPages'], path: '/privacy' },
}

/** Every permission that allows previewing something. Admins hold them all. */
export const PREVIEW_KEYS = [...new Set([...Object.values(PREVIEW_COLLECTIONS), ...Object.values(PREVIEW_GLOBALS)].flatMap((t) => t.keys))]
/** Anyone who may enter preview for at least one screen. */
export const canPreviewAnything = (user: unknown) => Boolean(user) && canAny(user as any, PREVIEW_KEYS)

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

/** May preview this target: for a document, one of its keys must cover that document (per-document limits). */
export const canPreviewTarget = (user: unknown, t: PreviewTarget) =>
  Boolean(user) &&
  (t.kind === 'collection'
    ? PREVIEW_COLLECTIONS[t.slug].keys.some((k) => canFor(user as any, k, t.id))
    : canAny(user as any, PREVIEW_GLOBALS[t.slug].keys))

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
