import React from 'react'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { canUseAdmin, isAdmin } from '../access/roles'
import { buildEditGuide } from '../../lib/edit-guide'
import { getStaffTexts } from '../../lib/staff-texts'
import { cleanHiddenPaths } from '../../lib/visibility'

const cell: React.CSSProperties = { padding: '10px 12px', borderTop: '1px solid var(--theme-elevation-100)', verticalAlign: 'top', fontSize: 14 }
const muted: React.CSSProperties = { color: 'var(--theme-elevation-500)', fontSize: 12 }

/** Splits a text with {nav}/{settings}/{visibility} into text and links. */
function withLinks(text: string, links: Record<string, React.ReactNode>) {
  return text.split(/(\{\w+\})/).map((part, i) => {
    const key = part.match(/^\{(\w+)\}$/)?.[1]
    return key && links[key] ? <React.Fragment key={i}>{links[key]}</React.Fragment> : part
  })
}

/**
 * CMS screen "Where to edit" (/admin/where-to-edit, every CMS user): each page of the site with links to the CMS
 * screens that change it. Built from Website → Pages and Events (lib/edit-guide.ts). Wording: Staff & admin texts → Where to edit.
 */
export default async function WhereToEditView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const user = req.user
  if (!user || !canUseAdmin(user as any)) redirect('/admin/login?redirect=%2Fadmin%2Fwhere-to-edit')
  const payload = req.payload
  const T = (await getStaffTexts(payload)).guide
  const [settings, pages, events] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true }) as Promise<any>,
    payload.find({ collection: 'pages', limit: 500, depth: 0, overrideAccess: true, sort: 'path', select: { path: true, title: true, published: true, system: true, layout: true } }),
    payload.find({ collection: 'events', limit: 100, depth: 0, overrideAccess: true, sort: 'startDate', select: { slug: true, title: true, status: true } }),
  ])
  const hidden = Array.isArray(settings?.hiddenPaths) ? cleanHiddenPaths(settings.hiddenPaths) : cleanHiddenPaths(settings?.hiddenPages)
  const sections = buildEditGuide({ pages: pages.docs as any, events: events.docs as any, hidden }, T).filter(
    (s) => s.title !== T.secStaff || isAdmin(user as any),
  )
  const a = (href: string, label: string) => <a href={href}>{label}</a>

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
        <div style={{ maxWidth: 1040, padding: '24px 0 64px' }}>
          <h1 style={{ marginBottom: 8 }}>{T.title}</h1>
          <p style={{ color: 'var(--theme-elevation-600)', maxWidth: 760, marginBottom: 8 }}>{T.intro}</p>
          <p style={{ color: 'var(--theme-elevation-600)', maxWidth: 760, marginBottom: 24 }}>
            {withLinks(T.everyPage, {
              nav: a('/admin/globals/navigation', T.lNav),
              settings: a('/admin/globals/site-settings', T.lSettings),
              visibility: a('/admin/page-visibility', T.lVisibility),
            })}
          </p>
          {sections.map((s) => (
            <section key={s.title} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 17, marginBottom: 8 }}>{s.title}</h2>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ ...cell, ...muted, textAlign: 'left', width: '36%' }}>{T.colPage}</th>
                    <th style={{ ...cell, ...muted, textAlign: 'left' }}>{T.colEdit}</th>
                  </tr>
                </thead>
                <tbody>
                  {s.rows.map((r) => (
                    <tr key={`${r.title}${r.path || ''}`}>
                      <td style={cell}>
                        <div style={{ fontWeight: 500 }}>{r.title}</div>
                        <div style={muted}>
                          {r.path && (
                            <>
                              {r.path}{' '}
                              <a href={r.path} target="_blank" rel="noopener">
                                {T.open}
                              </a>
                            </>
                          )}
                          {r.note ? ` · ${r.note}` : ''}
                        </div>
                      </td>
                      <td style={cell}>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {r.links.map((l) => (
                            <li key={l.label + l.href}>{a(l.href, l.label)}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
