import fs from 'node:fs'
import path from 'node:path'

let logoDataUrl: string | null = null

/** AURIX logo (public/images/aurix-logo.png, 700 x 640) as a data URL for next/og renders. */
export function aurixLogo(): string {
  if (!logoDataUrl) {
    const file = path.resolve(process.cwd(), 'public/images/aurix-logo.png')
    logoDataUrl = `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`
  }
  return logoDataUrl
}

// Square region of the logo that contains just the "A" mark (in source pixels)
export const LOGO_MARK = { x: 150, y: 12, size: 456, width: 700, height: 640 }

export const BRAND = {
  dark: '#07090d',
  surface: '#10151d',
  border: '#1f2a37',
  orange: '#ff6b1a',
  cyan: '#22d3ee',
  text: '#f1f5f9',
  muted: '#94a3b8',
}
