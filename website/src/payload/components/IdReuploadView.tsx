import React from 'react'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { canUseAdmin, hasRole, SEE_IDS } from '../access/roles'
import { getStaffTexts } from '../../lib/staff-texts'
import { fill } from '../../lib/form-texts-defaults'
import { formatDeadline, listRejected } from '../../lib/id-reupload'
import { IdReuploadSend } from './IdReuploadSend'

const cell: React.CSSProperties = { padding: '10px 12px', borderTop: '1px solid var(--theme-elevation-100)', verticalAlign: 'top', fontSize: 14 }

/** CMS screen "ID re-upload" (/admin/id-reupload): teams whose student ID was rejected + the send button. */
export default async function IdReuploadView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const user = req.user
  if (!user) redirect('/admin/login?redirect=%2Fadmin%2Fid-reupload')
  if (!canUseAdmin(user as any)) redirect('/admin/unauthorized')
  const payload = req.payload
  const T = (await getStaffTexts(payload)).idReupload
  const allowed = hasRole(user as any, SEE_IDS)
  const rows = allowed ? await listRejected(payload) : []
  const pending = rows.filter((r) => !r.idReuploadRequestedAt).length
  // Default deadline: 3 days from today (India time)
  const def = new Date(Date.now() + 3 * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const max = new Date(Date.now() + 60 * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
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
          {!allowed ? (
            <p>{T.notAllowed}</p>
          ) : (
            <>
              <p style={{ color: 'var(--theme-elevation-600)', maxWidth: 760, marginBottom: 24 }}>{T.intro}</p>
              {rows.length === 0 ? (
                <p>{T.empty}</p>
              ) : (
                <>
                  <IdReuploadSend
                    t={{ deadlineLabel: T.deadlineLabel, send: fill(T.send, { n: pending }), sending: T.sending, failed: T.failed, nothingToSend: T.nothingToSend }}
                    pending={pending}
                    min={today}
                    max={max}
                    defaultDeadline={def}
                  />
                  <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 24 }}>
                    <thead>
                      <tr>
                        {[T.colTeam, T.colEvent, T.colReason, T.colState].map((h) => (
                          <th key={h} style={{ ...cell, textAlign: 'left', fontSize: 12, color: 'var(--theme-elevation-500)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id}>
                          <td style={cell}>
                            <div style={{ fontWeight: 500 }}>{r.teamName}</div>
                            <div style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>
                              {r.registrationCode} · <a href={`/admin/collections/event-registrations/${r.id}`}>{T.open}</a>
                            </div>
                          </td>
                          <td style={cell}>{r.event && typeof r.event === 'object' ? r.event.title : ''}</td>
                          <td style={cell}>{r.idRejectReason || <span style={{ color: 'var(--theme-elevation-500)' }}>{T.noReason}</span>}</td>
                          <td style={cell}>
                            {r.idReuploadRequestedAt
                              ? fill(T.stateSent, { date: formatDeadline(r.idReuploadRequestedAt), deadline: r.idReuploadDeadline ? formatDeadline(r.idReuploadDeadline) : '–' })
                              : T.stateNew}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
