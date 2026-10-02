import { ImageResponse } from 'next/og'
import { aurixLogo, BRAND, LOGO_MARK } from '@/lib/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/** Apple touch icon: the "A" mark from the AURIX logo on the brand dark background. */
export default function AppleIcon() {
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
