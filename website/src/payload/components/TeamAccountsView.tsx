import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { AccountsScreen } from './AccountsView'

/** CMS screen Admin tools → Team accounts (/admin/team-accounts). */
export default function TeamAccountsView(props: AdminViewServerProps) {
  return <AccountsScreen {...props} kind="team" />
}
