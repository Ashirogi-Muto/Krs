import React from 'react'
import { ADMIN_GRANTED_ONLY, CATALOGUE, KEYS, SUPER_GRANTED_ONLY, can, isAdminUser, isSuperAdminUser } from '../access/permissions'
import { getStaffTexts } from '../../lib/staff-texts'
import { PermissionMatrixClient } from './PermissionMatrixClient'

/**
 * Access roles → Permissions, drawn as a matrix (one row per CMS page). Server half: which boxes this editor may tick
 * (admins: all; team leads: what they hold themselves, never "Manage access roles"). Display only: the server
 * re-checks every save (AccessRoles beforeChange).
 */
export async function PermissionMatrix(props: any) {
  const { path, payload, user, readOnly } = props
  const T = (await getStaffTexts(payload)).accessRoles
  const grantable = isSuperAdminUser(user)
    ? KEYS
    : isAdminUser(user)
      ? KEYS.filter((k) => !SUPER_GRANTED_ONLY.has(k))
      : KEYS.filter((k) => !ADMIN_GRANTED_ONLY.has(k) && !SUPER_GRANTED_ONLY.has(k) && can(user, k))
  return (
    <PermissionMatrixClient
      path={path || 'permissions'}
      sections={CATALOGUE}
      grantable={grantable}
      readOnly={Boolean(readOnly)}
      t={{
        help: T.matrixHelp,
        page: T.colPage,
        view: T.colView,
        create: T.colCreate,
        edit: T.colEdit,
        del: T.colDelete,
        more: T.colMore,
        notGrantable: T.notGrantable,
        createLimited: T.createLimited,
        none: T.summaryNone,
        summary: T.summary,
      }}
    />
  )
}
