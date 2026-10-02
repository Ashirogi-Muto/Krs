import { ImageResponse } from 'next/og'
import { aurixLogo, BRAND, LOGO_MARK } from '@/lib/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

/** Favicon: the "A" mark from the AURIX logo on the brand dark background. */
export default function Icon() {
  const scale = size.width / LOGO_MARK.size
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden', background: BRAND.dark, borderRadius: 14 }}>
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
