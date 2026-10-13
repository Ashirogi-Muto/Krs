import { ImageResponse } from 'next/og'
import { aurixLogo, BRAND, LOGO_MARK } from '@/lib/og'
import { cmsIcon } from '@/lib/brand-images'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
// Re-read the CMS icon at most every 5 minutes (saving Site settings also refreshes it)
export const revalidate = 300

/** Apple touch icon: the "A" mark from the AURIX logo on the brand dark background. */
export default async function AppleIcon() {
  // Site settings → Logos & icons → "Browser-tab icon: AURIX pages" (empty = the drawn mark below)
  const custom = await cmsIcon('aurixIcon', size.width)
  if (custom) return custom
  const scale = size.width / LOGO_MARK.size
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden', background: BRAND.dark, borderRadius: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={aurixLogo()}
          width={LOGO_MARK.width * scale}
          height={LOGO_MARK.height * scale}
          style={{ position: 'absolute', left: -LOGO_MARK.x * scale, top: -LOGO_MARK.y * scale }}
          alt=""
        />
      </div>
    ),
    size
  )
}
