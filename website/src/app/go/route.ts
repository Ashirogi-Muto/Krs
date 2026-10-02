import { resolveShortLink } from '@/lib/shortLinks'

export const dynamic = 'force-dynamic'

// go.kalamroboticssociety.com/ with no slug → main AURIX page
export async function GET() {
  return resolveShortLink(undefined)
}
