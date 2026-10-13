// Numbered so it never shares a route name with the site-wide AURIX icon one level up
import fs from 'node:fs/promises'
import path from 'node:path'
import { cmsIcon } from '@/lib/brand-images'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'
// Re-read the CMS icon at most every 5 minutes (saving Site settings also refreshes it)
export const revalidate = 300

/** KRS pages' browser-tab icon: Site settings → Logos & icons, else the built-in KRS mark. */
export default async function Icon() {
  const custom = await cmsIcon('krsIcon', size.width)
  if (custom) return custom
  const png = await fs.readFile(path.resolve(process.cwd(), 'public/images/krs-icon.png'))
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } })
}
