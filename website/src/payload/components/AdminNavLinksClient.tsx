'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Link, NavGroup } from '@payloadcms/ui'
import type { StaffTexts } from '../../lib/staff-texts-defaults'

const LINKS = [
  { href: '/admin/page-visibility', key: 'pageVisibility' },
  { href: '/admin/participants', key: 'participants' },
  { href: '/admin/team-accounts', key: 'teamAccounts' },
] as const

/** Same markup as Payload's own sidebar links, so the group looks and behaves like the others. */
export function AdminNavLinksClient({ t }: { t: StaffTexts['adminNav'] }) {
  const pathname = usePathname()
  return (
    <NavGroup label={t.group}>
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`)
        return (
          <Link key={l.href} className="nav__link" href={l.href} id={`nav-${l.href.split('/').pop()}`} prefetch={false}>
            {active && <div className="nav__link-indicator" />}
            <span className="nav__link-label">{t[l.key]}</span>
          </Link>
        )
      })}
    </NavGroup>
  )
}
