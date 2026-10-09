import React from 'react'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { canUseAdmin, isAdmin } from '../access/roles'
import { can, canAll } from '../access/permissions'
import { getStaffTexts } from '../../lib/staff-texts'
import { fill } from '../../lib/form-texts-defaults'
import { KEEP_REPORTS, listReports } from '../../lib/payments/reports'
import { PaymentMatcher } from './PaymentMatcher'

const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** CMS screen "Payment matching" (/admin/payment-matching): upload the Razorpay report, preview, record payments. */
export default async function PaymentMatchingView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const user = req.user
  if (!user) redirect('/admin/login?redirect=%2Fadmin%2Fpayment-matching')
  if (!canUseAdmin(user as any)) redirect('/admin/unauthorized')
  const payload = req.payload
  const T = (await getStaffTexts(payload)).payments
  const allowed = can(user as any, 'tools.paymentMatching')
  // Stored reports hold payers of every event: listed and downloadable only with the permission for all events
  const seeReports = isAdmin(user as any) || canAll(user as any, 'tools.paymentMatching')
  const reports = allowed && seeReports ? await listReports(payload) : []
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
        <div style={{ maxWidth: 1180, padding: '24px 0 64px' }}>
          <h1 style={{ marginBottom: 8 }}>{T.title}</h1>
          {!allowed ? (
            <p>{T.noAccess}</p>
          ) : (
            <>
              <p style={{ color: 'var(--theme-elevation-600)', maxWidth: 760, marginBottom: 24 }}>{T.intro}</p>
              <PaymentMatcher t={T} />
              {seeReports && (
                <section style={{ marginTop: 40 }}>
                  <h3 style={{ marginBottom: 8 }}>{fill(T.reportsTitle, { n: KEEP_REPORTS })}</h3>
                  {reports.length === 0 ? (
                    <p style={{ color: 'var(--theme-elevation-500)' }}>{T.reportsEmpty}</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {reports.map((r) => (
                        <li key={r.id} style={{ padding: '8px 0', borderTop: '1px solid var(--theme-elevation-100)', fontSize: 14 }}>
                          {fill(T.reportLine, { name: r.originalName, date: fmt(r.createdAt), rows: r.rowCount, by: r.uploadedBy })}{' '}
                          · <a href={`/api/admin/payment-matching/reports/${r.id}`}>{T.download}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
