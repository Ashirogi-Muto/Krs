import React from 'react'
import { can } from '../access/permissions'
import { withAccessRoles } from '../access/withAccessRoles'
import { getExportTexts } from '../../lib/export-texts'
import { RegistrationsExportLinks } from './RegistrationsExportLinks'

/**
 * Export bar above CMS → Event registrations (owner, 21 Oct 2026: "make sure all exports follow the filters set on the
 * event registration page"). Server half: which CSV files this person may download ("CSV export: …" permissions).
 * The links (client half) carry the list's current filters, search and sort; /api/admin/registrations-export applies
 * them as this person, limited to the events their export permission covers.
 */
export default async function RegistrationsExport(props: any) {
  const user = await withAccessRoles(props.payload, props.user)
  const views = (['members', 'full', 'finance', 'checkin', 'roster'] as const).filter((v) => can(user as any, `exports.${v}`))
  if (!views.length) return null
  const E = (await getExportTexts()).bar
  return <RegistrationsExportLinks views={views.map((v) => ({ view: v, label: E[v] }))} title={E.title} titleAll={E.titleAll} help={E.help} />
}
