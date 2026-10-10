import React from 'react'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/lib/auth/session'
import { requireVisibleRoute } from '@/lib/visibility-guard'
import { getPortalTexts } from '@/lib/portal-texts'
import { Bell, Calendar, Pin, AlertCircle, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Tab title: CMS → Participant portal → announcements ("Browser-tab title")
export async function generateMetadata() {
  return {
    title: (await getPortalTexts()).announcements.tabTitle,
    robots: { index: false, follow: false, nocache: true },
  }
}

export default async function PortalAnnouncementsPage() {
  await requireVisibleRoute('/aurix/portal')
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const payload = await getPayload({ config })

  // 1. Get user's claimed event IDs to filter event-targeted announcements
  const regResult = await payload.find({
    collection: 'event-registrations',
    where: {
      participants: {
        contains: user.id,
      },
    },
    depth: 1,
    overrideAccess: true,
  })

  const claimedEventIds: (number | string)[] = []
  for (const reg of regResult.docs || []) {
    if (reg.event) {
      const eId = typeof reg.event === 'object' ? reg.event.id : reg.event
      if (eId && !claimedEventIds.includes(eId)) {
        claimedEventIds.push(eId)
      }
    }
  }

  // 2. Query announcements: published only, audience ALL or in claimed events
  const audienceConditions: any[] = [{ audienceType: { equals: 'ALL' } }]
  if (claimedEventIds.length > 0) {
    audienceConditions.push({
      events: {
        in: claimedEventIds,
      },
    })
  }

  const announcementsResult = await payload.find({
    collection: 'announcements',
    where: {
      and: [
        { published: { equals: true } },
        { or: audienceConditions },
      ],
    },
    sort: ['-pinned', '-publishedAt'],
    depth: 1,
    overrideAccess: true, // safe because query explicitly filters by published + audience
  })

  const announcements = (announcementsResult.docs || []) as Record<string, any>[]
  const t = (await getPortalTexts()).announcements

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-2 border-b border-aurix-border pb-6">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          {t.eyebrow}
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
          {t.title}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-mono">
          {t.intro}
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="aurix-card rounded-2xl p-8 sm:p-12 text-center space-y-4 border-aurix-border">
          <div className="w-12 h-12 rounded-xl bg-aurix-dark border border-aurix-border flex items-center justify-center text-aurix-orange mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-display font-bold text-white">
            {t.emptyTitle}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            {t.emptyText}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((ann) => {
            const dateStr = ann.publishedAt
              ? new Date(ann.publishedAt).toLocaleDateString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'medium',
                })
              : null

            const isAll = ann.audienceType === 'ALL'
            const targetEvents = Array.isArray(ann.events) ? ann.events : []

            return (
              <div
                key={ann.id}
                className={`aurix-card rounded-2xl p-6 sm:p-8 space-y-4 border transition-colors ${
                  ann.pinned
                    ? 'border-aurix-orange/60 bg-gradient-to-br from-aurix-surface via-aurix-dark to-black'
                    : 'border-aurix-border'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    {ann.pinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-orange-950/80 border border-orange-700 text-aurix-orange font-bold text-[10px] uppercase">
                        <Pin className="w-3 h-3" /> {t.pinned}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-aurix-dark border border-aurix-border text-slate-300 text-[10px] uppercase">
                      {isAll ? t.allBadge : t.targetedBadge}
                    </span>
                  </div>

                  {dateStr && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {dateStr}
                    </span>
                  )}
                </div>

                <h2 className="font-display font-bold text-white text-xl">
                  {ann.title}
                </h2>

                <div className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {ann.body}
                </div>

                {!isAll && targetEvents.length > 0 && (
                  <div className="pt-2 text-[11px] font-mono text-slate-400 border-t border-aurix-border/40">
                    {t.applicable} {targetEvents.map((e: any) => e.title || e.slug || t.fallbackEvent).join(', ')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
