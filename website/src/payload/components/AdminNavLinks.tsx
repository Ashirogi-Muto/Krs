import React from 'react'
import type { Payload } from 'payload'
import { canUseAdmin, isAdmin } from '../access/roles'
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
  // Admin tools: Page visibility and Participants per access role; Team accounts admins only
  const tools = [
    can(user as any, 'admin.pageVisibility') && { href: '/admin/page-visibility', label: t.adminNav.pageVisibility },
    can(user as any, 'admin.participants') && { href: '/admin/participants', label: t.adminNav.participants },
    isAdmin(user as any) && { href: '/admin/team-accounts', label: t.adminNav.teamAccounts },
  ].filter(Boolean) as { href: string; label: string }[]
  if (tools.length) groups.push({ label: t.adminNav.group, links: tools })
  return <AdminNavLinksClient groups={groups} />
}
