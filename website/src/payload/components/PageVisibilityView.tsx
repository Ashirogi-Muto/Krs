import React from 'react'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { isAdmin } from '../access/roles'
import { BUILT_IN_PAGES, cleanHiddenPaths, type VisibilityGroup } from '../../lib/visibility'
import { PageVisibilityEditor, type VisibilityRow } from './PageVisibilityEditor'
import { getStaffTexts } from '../../lib/staff-texts'
import { visibilityPageKey } from '../../lib/staff-texts-defaults'

/**
 * CMS screen "Page visibility" (/admin/page-visibility, admins only): one switch per page of the site.
 * Built-in pages come from lib/visibility, competition pages from Events, other pages from Website → Pages.
 */
export default async function PageVisibilityView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const user = req.user
  if (!user) redirect('/admin/login?redirect=%2Fadmin%2Fpage-visibility')
  const payload = req.payload
  const V = (await getStaffTexts(payload)).visibility // wording: CMS → Staff & admin texts → Page visibility
  const pageText = (key: string, fallback?: string) => ((V as Record<string, string>)[key] ?? fallback)

  let rows: VisibilityRow[] = []
  let hidden: string[] = []
  if (isAdmin(user)) {
    const [settings, events, pages] = await Promise.all([
      payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true }) as Promise<any>,
      payload.find({ collection: 'events', limit: 100, depth: 0, overrideAccess: true, sort: 'startDate', select: { slug: true, title: true, status: true } }),
      payload.find({ collection: 'pages', limit: 500, depth: 0, overrideAccess: true, sort: 'path', select: { path: true, title: true, published: true, system: true } }),
    ])
    hidden = Array.isArray(settings?.hiddenPaths) ? cleanHiddenPaths(settings.hiddenPaths) : cleanHiddenPaths(settings?.hiddenPages)
    const builtIn = new Set(BUILT_IN_PAGES.map((p) => p.route))
    rows = [
      ...BUILT_IN_PAGES.map((p) => {
        const key = visibilityPageKey(p.route)
        return { route: p.route, label: pageText(key, p.label)!, group: p.group, note: p.note ? pageText(`n${key.slice(1)}`, p.note) : undefined }
      }),
      ...(events.docs as any[]).map((e) => ({
        route: `/aurix/${e.slug}`,
        label: e.title,
        group: 'Competitions' as VisibilityGroup,
        note: e.status === 'DRAFT' ? V.noteDraft : undefined,
      })),
      ...(pages.docs as any[])
        .filter((p) => typeof p.path === 'string' && !builtIn.has(p.path))
        .map((p) => ({
          route: p.path,
          label: p.title || p.path,
          group: 'Your pages' as const,
          note: p.published === false ? V.noteUnpublished : undefined,
        })),
    ]
    // Hidden paths that match no page any more (e.g. a deleted page) stay listed so they can be cleared
    const known = new Set(rows.map((r) => r.route))
    for (const p of hidden) if (!known.has(p)) rows.push({ route: p, label: p, group: 'Other', note: V.noteMissing })
  }

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      searchParams={searchParams}
      user={user}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <div style={{ maxWidth: 960, padding: '24px 0 64px' }}>
          <h1 style={{ marginBottom: 8 }}>{V.title}</h1>
          {isAdmin(user) ? (
            <>
              <p style={{ color: 'var(--theme-elevation-600)', marginBottom: 24, maxWidth: 720 }}>
                {V.intro}
              </p>
              <PageVisibilityEditor rows={rows} initialHidden={hidden} t={V} />
            </>
          ) : (
            <p>{V.adminsOnly}</p>
          )}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
