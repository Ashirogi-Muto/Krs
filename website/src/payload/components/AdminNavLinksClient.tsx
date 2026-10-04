'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Link, NavGroup } from '@payloadcms/ui'

const LINKS = [
  { href: '/admin/page-visibility', label: 'Page visibility' },
  { href: '/admin/participants', label: 'Participants' },
  { href: '/admin/team-accounts', label: 'Team accounts' },
]

/** Same markup as Payload's own sidebar links, so the group looks and behaves like the others. */
export function AdminNavLinksClient() {
  const pathname = usePathname()
  return (
    <NavGroup label="Admin tools">
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`)
        return (
          <Link key={l.href} className="nav__link" href={l.href} id={`nav-${l.href.split('/').pop()}`} prefetch={false}>
            {active && <div className="nav__link-indicator" />}
            <span className="nav__link-label">{l.label}</span>
          </Link>
        )
      })}
    </NavGroup>
  )
}
