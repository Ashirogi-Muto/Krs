/**
 * Live preview, phases 2–3 (docs/LIVE_PREVIEW_PLAN.md §5–§6): invisible `data-cms-*` attributes that tie preview text to
 * CMS fields, and the message schema between the CMS and the preview frame. Pure (no React/Next), unit-tested.
 *
 * Attributes are rendered ONLY in live preview: outside preview every helper returns `{}` (NO_CMS), so React renders
 * nothing and visitors get byte-identical HTML.
 */

export type CmsAttrs = Record<string, string>
/** `cms('title')` → attributes for <base>.title; `cms()` → the base itself (a whole section). */
export type Cms = (field?: string) => CmsAttrs

export const NO_CMS: Cms = () => ({})

/** Field path: dot-separated names / row numbers ("layout.3.cards.1.title"). */
export const PATH_RE = /^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*$/
export const isCmsPath = (p: unknown): p is string => typeof p === 'string' && p.length <= 200 && PATH_RE.test(p)

/** Fields of the document being edited, e.g. doc "pages/8", base "layout.0". */
export function cmsFor(doc: string, base = ''): Cms {
  return (field): CmsAttrs => {
    const path = [base, field].filter(Boolean).join('.')
    return isCmsPath(path) ? { 'data-cms-doc': doc, 'data-cms-path': path } : {}
  }
}

/** Shared wording screens (Labels & messages, Event pages, Navigation & footer…): the same on every page. */
export function cmsGlobal(slug: string, base = ''): Cms {
  return (field): CmsAttrs => {
    const path = [base, field].filter(Boolean).join('.')
    return isCmsPath(path) ? { 'data-cms-global': slug, 'data-cms-path': path } : {}
  }
}

/** An item from another collection shown on this page (gallery photo, person, competition card…). */
export const cmsRef = (preview: boolean, slug: string, id: unknown): CmsAttrs =>
  preview && /^[a-z-]+$/.test(slug) && /^[1-9][0-9]{0,9}$/.test(String(id)) ? { 'data-cms-ref': `${slug}/${id}` } : {}

/** Payload's DOM id of a field: "field-" + path with "." → "__" (field-layout__0__title). */
export const pathToFieldId = (path: string) => `field-${path.replaceAll('.', '__')}`
export function fieldIdToPath(id: string): string | null {
  if (!id.startsWith('field-')) return null
  const path = id.slice('field-'.length).replaceAll('__', '.')
  return isCmsPath(path) ? path : null
}

/** "pages/8" (the document being edited) or "global:form-texts". */
export const DOC_RE = /^(?:[a-z-]+\/[1-9][0-9]{0,9}|global:[a-z-]+)$/

export type CmsToPreview =
  | { type: 'krs-cms:highlight'; doc: string; path: string; value?: string }
  | { type: 'krs-cms:clear' }
export type PreviewToCms =
  | { type: 'krs-cms:focus'; doc: string; path: string }
  | { type: 'krs-cms:text'; text: string }
  | { type: 'krs-cms:open'; target: 'doc' | 'global'; slug: string; id?: number; path?: string }

/** Validates a message from the CMS (preview side). Anything else → null. */
export function parseCmsMessage(data: unknown): CmsToPreview | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (d.type === 'krs-cms:clear') return { type: 'krs-cms:clear' }
  if (d.type !== 'krs-cms:highlight' || typeof d.doc !== 'string' || !DOC_RE.test(d.doc) || !isCmsPath(d.path)) return null
  const value = typeof d.value === 'string' && d.value.trim() ? d.value.trim().slice(0, 300) : undefined
  return { type: 'krs-cms:highlight', doc: d.doc, path: d.path, ...(value ? { value } : {}) }
}

/** Validates a message from the preview frame (CMS side): only "focus this field" / "open this screen". */
export function parsePreviewMessage(data: unknown, allowed: { collections: string[]; globals: string[] }): PreviewToCms | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (d.type === 'krs-cms:focus') return typeof d.doc === 'string' && DOC_RE.test(d.doc) && isCmsPath(d.path) ? { type: d.type, doc: d.doc, path: d.path } : null
  // Text without an attribute (shared wording): the CMS looks for a field on the open screen with exactly this text
  if (d.type === 'krs-cms:text') return typeof d.text === 'string' && d.text.trim().length >= 2 ? { type: d.type, text: d.text.replace(/\s+/g, ' ').trim().slice(0, 300) } : null
  if (d.type !== 'krs-cms:open' || typeof d.slug !== 'string') return null
  const path = d.path === undefined ? undefined : isCmsPath(d.path) ? d.path : null
  if (path === null) return null
  if (d.target === 'global' && allowed.globals.includes(d.slug)) return { type: d.type, target: 'global', slug: d.slug, ...(path ? { path } : {}) }
  if (d.target === 'doc' && allowed.collections.includes(d.slug) && Number.isInteger(d.id) && (d.id as number) > 0)
    return { type: d.type, target: 'doc', slug: d.slug, id: d.id as number, ...(path ? { path } : {}) }
  return null
}

/** The admin URL a validated "open" message leads to (always under /admin). */
export const adminUrlFor = (m: Extract<PreviewToCms, { type: 'krs-cms:open' }>) =>
  (m.target === 'global' ? `/admin/globals/${m.slug}` : `/admin/collections/${m.slug}/${m.id}`) + (m.path ? `#focus=${m.path}` : '')

/** Which document this admin screen edits: "pages/8" or "global:form-texts" (null on lists, dashboard…). */
export function docFromAdminPath(pathname: string): string | null {
  const c = pathname.match(/^\/admin\/collections\/([a-z-]+)\/([1-9][0-9]{0,9})\/?$/)
  if (c) return `${c[1]}/${c[2]}`
  const g = pathname.match(/^\/admin\/globals\/([a-z-]+)\/?$/)
  return g ? `global:${g[1]}` : null
}
