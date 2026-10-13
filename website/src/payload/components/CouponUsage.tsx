import React from 'react'
import { canOnCoupon } from '../access/coupons'
import { couponTeams } from '../collections/Coupons'
import { getStaffTexts } from '../../lib/staff-texts'
import { fill } from '../../lib/form-texts-defaults'

const th: React.CSSProperties = { textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--theme-elevation-150)', fontSize: 12 }
const td: React.CSSProperties = { padding: '6px 10px', borderBottom: '1px solid var(--theme-elevation-100)', fontSize: 13 }
const ist = (d: string | null) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : '')

/** Coupon edit screen: the teams that applied this coupon (access role "See which teams used a coupon"). */
export async function CouponUsage(props: any) {
  const { payload, id, data } = props
  if (!id) return null
  const user = props.req?.user ?? props.user
  const T = (await getStaffTexts(payload)).coupons
  if (!canOnCoupon(user, 'coupons.usage', { events: data?.events ?? [], createdBy: data?.createdBy })) return <p style={{ fontSize: 13, color: 'var(--theme-elevation-500)' }}>{T.usageNoAccess}</p>
  const teams = await couponTeams(payload, id)
  return (
    <div style={{ margin: '24px 0' }}>
      <h3 style={{ fontSize: 15, marginBottom: 8 }}>{fill(T.usageTitle, { n: teams.length })}</h3>
      {teams.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--theme-elevation-500)' }}>{T.usageNone}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[T.colCode, T.colTeam, T.colEvent, T.colDiscount, T.colPays, T.colPayment, T.colApplied].map((h) => (
                  <th key={h} style={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.code}>
                  <td style={td}>{t.code}</td>
                  <td style={td}>{t.team}</td>
                  <td style={td}>{t.event}</td>
                  <td style={td}>{t.discount !== null ? `₹${t.discount}` : ''}</td>
                  <td style={td}>{t.pays !== null ? `₹${t.pays}` : ''}</td>
                  <td style={td}>{t.payment}</td>
                  <td style={td}>{ist(t.appliedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
