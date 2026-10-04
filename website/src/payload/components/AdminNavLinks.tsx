import React from 'react'
import { isAdmin } from '../access/roles'
import { AdminNavLinksClient } from './AdminNavLinksClient'

/** Sidebar group "Admin tools" (Page visibility, Participants, Team accounts): admins only. */
export default function AdminNavLinks({ user }: { user?: unknown }) {
  if (!isAdmin(user as any)) return null
  return <AdminNavLinksClient />
}
