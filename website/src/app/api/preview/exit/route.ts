import { draftMode } from 'next/headers'
import { isSafeSitePath } from '@/lib/preview-targets'

/** "Exit preview" (badge on previewed pages): draft mode off, back to the same page as a visitor sees it. */
export async function POST(req: Request) {
  ;(await draftMode()).disable()
  const form = await req.formData().catch(() => null)
  const back = form?.get('path')
  return new Response(null, { status: 303, headers: { Location: isSafeSitePath(back) ? back : '/', 'Cache-Control': 'private, no-store' } })
}
