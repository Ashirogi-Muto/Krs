'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Link, NavGroup } from '@payloadcms/ui'

export type NavLinkGroup = { label: string; links: { href: string; label: string }[] }

/** Same markup as Payload's own sidebar links, so the groups look and behave like the others. */
export function AdminNavLinksClient({ groups }: { groups: NavLinkGroup[] }) {
  const pathname = usePathname()
  return (
    <>
      {groups.map((g) => (
        <NavGroup key={g.label} label={g.label}>
          {g.links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`)
            return (
              <Link key={l.href} className="nav__link" href={l.href} id={`nav-${l.href.split('/').pop()}`} prefetch={false}>
                {active && <div className="nav__link-indicator" />}
                <span className="nav__link-label">{l.label}</span>
              </Link>
            )
          })}
        </NavGroup>
      ))}
    </>
  )
}
