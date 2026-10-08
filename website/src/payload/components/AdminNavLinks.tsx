import React from 'react'
import type { Payload } from 'payload'
import { SEE_IDS, canUseAdmin, hasRole, isAdmin } from '../access/roles'
import { getStaffTexts } from '../../lib/staff-texts'
import { AdminNavLinksClient } from './AdminNavLinksClient'

/**
 * Extra sidebar groups: "Help" (Where to edit) for every CMS user, "Admin tools" (Page visibility, Participants,
 * Team accounts) for admins. Wording: Staff & admin texts → Admin sidebar / Where to edit.
 */
export default async function AdminNavLinks({ user, payload }: { user?: unknown; payload?: Payload }) {
  if (!canUseAdmin(user as any)) return null
  const t = await getStaffTexts(payload)
  const groups = [{ label: t.guide.navGroup, links: [{ href: '/admin/where-to-edit', label: t.guide.navLabel }] }]
  // Student ID re-upload requests: registration team and managers
  if (hasRole(user as any, SEE_IDS)) groups.push({ label: t.idReupload.navGroup, links: [{ href: '/admin/id-reupload', label: t.idReupload.navLabel }] })
  if (isAdmin(user as any))
    groups.push({
      label: t.adminNav.group,
      links: [
        { href: '/admin/page-visibility', label: t.adminNav.pageVisibility },
        { href: '/admin/participants', label: t.adminNav.participants },
        { href: '/admin/team-accounts', label: t.adminNav.teamAccounts },
      ],
    })
  return <AdminNavLinksClient groups={groups} />
}
