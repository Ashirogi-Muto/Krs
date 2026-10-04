import React from 'react'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { isAdmin } from '../access/roles'
import { BUILT_IN_PAGES, cleanHiddenPaths, type VisibilityGroup } from '../../lib/visibility'
import { PageVisibilityEditor, type VisibilityRow } from './PageVisibilityEditor'

/**
 * CMS screen "Page visibility" (/admin/page-visibility, admins only): one switch per page of the site.
 * Built-in pages come from lib/visibility, competition pages from Events, other pages from Website → Pages.
 */
export default async function PageVisibilityView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const user = req.user
  if (!user) redirect('/admin/login?redirect=%2Fadmin%2Fpage-visibility')
  const payload = req.payload

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
      ...BUILT_IN_PAGES.map((p) => ({ route: p.route, label: p.label, group: p.group, note: p.note })),
      ...(events.docs as any[]).map((e) => ({
        route: `/aurix/${e.slug}`,
        label: e.title,
        group: 'Competitions' as VisibilityGroup,
        note: e.status === 'DRAFT' ? 'Draft in Events: not on the site whatever this switch says.' : undefined,
      })),
      ...(pages.docs as any[])
        .filter((p) => typeof p.path === 'string' && !builtIn.has(p.path))
        .map((p) => ({
          route: p.path,
          label: p.title || p.path,
          group: 'Your pages' as const,
          note: p.published === false ? 'Unpublished in Website → Pages: not on the site whatever this switch says.' : undefined,
        })),
    ]
    // Hidden paths that match no page any more (e.g. a deleted page) stay listed so they can be cleared
    const known = new Set(rows.map((r) => r.route))
    for (const p of hidden) if (!known.has(p)) rows.push({ route: p, label: p, group: 'Other', note: 'No page at this address right now.' })
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
          <h1 style={{ marginBottom: 8 }}>Page visibility</h1>
          {isAdmin(user) ? (
            <>
              <p style={{ color: 'var(--theme-elevation-600)', marginBottom: 24, maxWidth: 720 }}>
                Hidden pages show &quot;not found&quot; to visitors and disappear from menus, footers, buttons and the sitemap. Hiding a page also
                hides the pages under it (for example Projects hides every project page), except the two home pages. Changes appear on the
                site within about a minute.
              </p>
              <PageVisibilityEditor rows={rows} initialHidden={hidden} />
            </>
          ) : (
            <p>Only admins can hide or show pages.</p>
          )}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
