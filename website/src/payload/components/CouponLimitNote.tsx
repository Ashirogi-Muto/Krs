import React from 'react'
import { couponLimitFor } from '../access/coupons'
import { getStaffTexts } from '../../lib/staff-texts'
import { fill } from '../../lib/form-texts-defaults'

/** Coupon edit screen: the editor's own coupon limit (display only; every save is re-checked in Coupons beforeChange). */
export async function CouponLimitNote(props: any) {
  const { payload } = props
  const user = props.req?.user ?? props.user
  const T = (await getStaffTexts(payload)).coupons
  const limit = await couponLimitFor({ payload, user } as any)
  const parts = limit && limit !== 'NO_SITE_LIMIT' ? [limit.percent !== null ? fill(T.limitPercent, { percent: limit.percent }) : '', limit.amount !== null ? `₹${limit.amount}` : ''].filter(Boolean) : []
  const text = limit === null ? T.limitAdmin : limit === 'NO_SITE_LIMIT' ? T.errNoSiteLimit : fill(T.limitNote, { limit: parts.join(T.limitAnd) })
  return <p style={{ margin: '0 0 24px', padding: '10px 14px', borderRadius: 6, background: 'var(--theme-elevation-50)', fontSize: 13 }}>{text}</p>
}
