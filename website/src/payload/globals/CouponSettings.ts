import type { GlobalConfig } from 'payload'
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
      'The largest discount (₹ off one team\'s fee) a team member may give with a coupon. Each person can have a lower limit on their account, and each access role on the role; the strictest one applies. Admins have no limit.',
    hidden: ({ user }) => !isAdmin(user as any),
  },
  access: {
    read: ({ req: { user } }) => isAdmin(user as any),
    update: ({ req: { user } }) => isAdmin(user as any),
  },
  fields: [
    {
      name: 'maxDiscount',
      label: 'Site-wide limit: largest discount per team (₹)',
      type: 'number',
      required: true,
      min: 1,
      admin: { description: 'Required: until it is set, only admins can make coupons.' },
    },
  ],
}
