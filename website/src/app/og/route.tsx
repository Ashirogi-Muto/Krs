import { ImageResponse } from 'next/og'
import { getEventBySlug } from '@/lib/data/events'
import { formatDateRange, formatFee, formatINR, formatTeamSize } from '@/lib/format'
import { aurixLogo, BRAND } from '@/lib/og'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { getFormTexts } from '@/lib/form-texts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WIDTH = 1200
const HEIGHT = 630

/**
 * Social share card. /og → site card; /og?event=<slug> → event card with live CMS data;
 * /og?title=...&subtitle=... → generic page card.
 */
export async function GET(req: Request) {
  // Each card is drawn on the server (CPU): link previews need a handful, not hundreds per minute
  if (!rateLimit(`og:${clientIp(req)}`, 60, 60_000)) return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '60' } })
  const params = new URL(req.url).searchParams
  const slug = params.get('event')
  // Default wording: CMS → Labels & messages → Whole site ("Link preview image")
  const g = (await getFormTexts()).general
  let eyebrow = g.shareEyebrow
  let title = (params.get('title') || g.shareTitle).slice(0, 80)
  let subtitle = (params.get('subtitle') || g.shareSubtitle).slice(0, 140)
  let chips: string[] = []

  if (slug) {
    const event = await getEventBySlug(slug.slice(0, 60))
    if (event) {
      eyebrow = `AURIX ${event.edition} · ${formatDateRange(event.startDate, event.endDate).toUpperCase()}`
      title = event.title
      subtitle = event.comingSoon ? 'Coming soon' : `${event.venue}`
      chips = event.comingSoon
        ? [event.prizePool ? `${formatINR(event.prizePool)} prize pool` : 'Coming soon']
        : [
            formatFee(event.registrationFee),
            formatTeamSize(event.minTeamSize, event.maxTeamSize),
            ...(event.prizePool ? [`${formatINR(event.prizePool)} prize pool`] : []),
          ]
    }
  }

  const image = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: `linear-gradient(135deg, ${BRAND.dark} 0%, ${BRAND.surface} 100%)`,
          color: BRAND.text,
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, paddingRight: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 24, letterSpacing: 3, color: BRAND.orange, fontWeight: 700 }}>{eyebrow}</div>
            <div style={{ fontSize: title.length > 32 ? 64 : 80, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>{title}</div>
            <div style={{ fontSize: 30, color: BRAND.muted, marginTop: 20 }}>{subtitle}</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {chips.map((chip) => (
              <div
                key={chip}
                style={{
                  display: 'flex',
                  fontSize: 26,
                  fontWeight: 700,
                  padding: '10px 22px',
                  borderRadius: 12,
                  border: `2px solid ${BRAND.border}`,
                  background: BRAND.dark,
                }}
              >
                {chip}
              </div>
            ))}
            <div style={{ display: 'flex', fontSize: 24, color: BRAND.cyan, padding: '12px 0' }}>kalamroboticssociety.com</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 380 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={aurixLogo()} width={380} height={347} alt="" />
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  )
  // Social networks and Cloudflare may cache the card for an hour
  image.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  return image
}
