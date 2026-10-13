import { APIError, type GlobalConfig } from 'payload'
import { isAdmin } from '../access/roles'

/**
 * Coupon limits (owner, 13 Oct 2026): the site-wide largest discount per team that team members may give with a
 * coupon. Required before any team member can make one; their own limit (Team accounts) and their access role's limit
 * can only lower it. Admins and the Super Admin set it and have no limit. Not grantable through access roles.
 */
export const CouponSettings: GlobalConfig = {
  slug: 'coupon-settings',
  label: 'Coupon limits',
  admin: {
    group: 'AURIX',
    description:
      'The largest discount a team member may give with a coupon: a % of the fee and/or a ₹ amount per team (at least one is required). Each person and each access role can have a lower ₹ limit; the strictest applies. Admins have no limit.',
    hidden: ({ user }) => !isAdmin(user as any),
  },
  access: {
    read: ({ req: { user } }) => isAdmin(user as any),
    update: ({ req: { user } }) => isAdmin(user as any),
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Required (owner): at least one of the two limits
        const pct = Number(data?.maxPercent) || 0
        const amt = Number(data?.maxDiscount) || 0
        if (pct <= 0 && amt <= 0) {
          const { getStaffTexts } = await import('../../lib/staff-texts')
          throw new APIError((await getStaffTexts(req.payload)).coupons.errSiteRequired, 400, undefined, true)
        }
        if (pct && (!Number.isInteger(pct) || pct < 1 || pct > 99)) {
          const { getStaffTexts } = await import('../../lib/staff-texts')
          throw new APIError((await getStaffTexts(req.payload)).coupons.errPercent, 400, undefined, true)
        }
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'maxPercent',
          label: 'Site-wide limit: largest discount (% of the fee)',
          type: 'number',
          min: 1,
          max: 99,
          admin: { description: 'e.g. 20: no team gets more than 20% off its fee from a team member\'s coupon (a flat coupon: 20% of the cheapest competition it covers).' },
        },
        {
          name: 'maxDiscount',
          label: 'Site-wide limit: largest discount per team (₹)',
          type: 'number',
          min: 1,
          admin: { description: 'Optional when a % limit is set. Person and role limits (₹) can only lower it.' },
        },
      ],
    },
  ],
}
