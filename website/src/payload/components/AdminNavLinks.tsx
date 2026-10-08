import React from 'react'
import type { Payload } from 'payload'
import { canUseAdmin, isAdmin } from '../access/roles'
import { can, idReuploadScope } from '../access/permissions'
import { getStaffTexts } from '../../lib/staff-texts'
import { AdminNavLinksClient } from './AdminNavLinksClient'

/**
 * Extra sidebar groups: "Help" (Where to edit) for every CMS user, "ID re-upload" and "Admin tools" (Page
 * visibility, Participants: per access role; Team accounts: admins). Wording: Staff & admin texts → Admin sidebar / Where to edit.
 */
export default async function AdminNavLinks({ user, payload }: { user?: unknown; payload?: Payload }) {
  if (!canUseAdmin(user as any)) return null
  const t = await getStaffTexts(payload)
  const groups = [{ label: t.guide.navGroup, links: [{ href: '/admin/where-to-edit', label: t.guide.navLabel }] }]
  // Student ID re-upload requests: registration team and managers
  if (idReuploadScope(user as any)) groups.push({ label: t.idReupload.navGroup, links: [{ href: '/admin/id-reupload', label: t.idReupload.navLabel }] })
  // Admin tools: Page visibility and Participants per access role; Team accounts admins only
  const tools = [
    can(user as any, 'admin.pageVisibility') && { href: '/admin/page-visibility', label: t.adminNav.pageVisibility },
    can(user as any, 'admin.participants') && { href: '/admin/participants', label: t.adminNav.participants },
    isAdmin(user as any) && { href: '/admin/team-accounts', label: t.adminNav.teamAccounts },
  ].filter(Boolean) as { href: string; label: string }[]
  if (tools.length) groups.push({ label: t.adminNav.group, links: tools })
  return <AdminNavLinksClient groups={groups} />
}
