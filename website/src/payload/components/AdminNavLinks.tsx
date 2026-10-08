import React from 'react'
import type { Payload } from 'payload'
import { isAdmin } from '../access/roles'
import { getStaffTexts } from '../../lib/staff-texts'
import { AdminNavLinksClient } from './AdminNavLinksClient'

/** Sidebar group "Admin tools" (Page visibility, Participants, Team accounts): admins only. Wording: Staff & admin texts → Admin sidebar. */
export default async function AdminNavLinks({ user, payload }: { user?: unknown; payload?: Payload }) {
  if (!isAdmin(user as any)) return null
  return <AdminNavLinksClient t={(await getStaffTexts(payload)).adminNav} />
}
