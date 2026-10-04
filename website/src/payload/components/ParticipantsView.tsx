import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { AccountsScreen } from './AccountsView'

/** CMS screen Admin tools → Participants (/admin/participants). */
export default function ParticipantsView(props: AdminViewServerProps) {
  return <AccountsScreen {...props} kind="participants" />
}
