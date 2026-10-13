import React from 'react'
import type { Payload } from 'payload'
import { canUseAdmin } from '../access/roles'
import { COUPON_READ_KEYS } from '../access/coupons'
import { can, idReuploadScope } from '../access/permissions'
import { getStaffTexts } from '../../lib/staff-texts'
import { AdminNavLinksClient } from './AdminNavLinksClient'
import { withAccessRoles } from '../access/withAccessRoles'

/**
 * Extra sidebar groups: "Help" (Where to edit) for every CMS user, "Registrations" (ID re-upload, Payment matching) and "Admin tools" (Page
 * visibility, Participants: per access role; Team accounts: admins). Wording: Staff & admin texts → Admin sidebar / Where to edit.
 */
export default async function AdminNavLinks({ user: navUser, payload }: { user?: unknown; payload?: Payload }) {
  const user = payload ? await withAccessRoles(payload, navUser as any) : navUser
  if (!canUseAdmin(user as any)) return null
  const t = await getStaffTexts(payload)
  const groups = [{ label: t.guide.navGroup, links: [{ href: '/admin/where-to-edit', label: t.guide.navLabel }] }]
  // Registrations: student ID re-upload requests (registration team, managers) and payment matching (finance roles)
  const registrations = [
    idReuploadScope(user as any) && { href: '/admin/id-reupload', label: t.idReupload.navLabel },
    can(user as any, 'tools.paymentMatching') && { href: '/admin/payment-matching', label: t.payments.navLabel },
  ].filter(Boolean) as { href: string; label: string }[]
  if (registrations.length) groups.push({ label: t.idReupload.navGroup, links: registrations })
  // Coupons (owner, 13 Oct 2026): the coupons that work right now — switched on, started, not expired. "Used up" ones
  // still show (Status column says so): a usage count can't be filtered in the list.
  if (COUPON_READ_KEYS.some((k) => can(user as any, k))) {
    const now = new Date().toISOString()
    const q = new URLSearchParams({
      'where[and][0][active][equals]': 'true',
      'where[and][1][or][0][expiresAt][greater_than]': now,
      'where[and][1][or][1][expiresAt][exists]': 'false',
      'where[and][2][or][0][startsAt][less_than_equal]': now,
      'where[and][2][or][1][startsAt][exists]': 'false',
    })
    groups.push({ label: t.coupons.navActive, links: [{ href: `/admin/collections/coupons?${q}`, label: t.coupons.navActive }] })
  }
  // Admin tools: Page visibility, Participants and Team accounts per access role (admins hold every key)
  const tools = [
    can(user as any, 'admin.pageVisibility') && { href: '/admin/page-visibility', label: t.adminNav.pageVisibility },
    can(user as any, 'admin.participants') && { href: '/admin/participants', label: t.adminNav.participants },
    can(user as any, 'accounts.team') && { href: '/admin/team-accounts', label: t.adminNav.teamAccounts },
  ].filter(Boolean) as { href: string; label: string }[]
  if (tools.length) groups.push({ label: t.adminNav.group, links: tools })
  return <AdminNavLinksClient groups={groups} />
}
