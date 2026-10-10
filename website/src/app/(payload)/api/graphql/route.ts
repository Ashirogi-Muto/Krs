import config from '@payload-config'
import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { getFormTexts } from '@/lib/form-texts'

const defaultGraphQLPost = GRAPHQL_POST(config)

export const POST = async (req: Request) => {
  const ip = clientIp(req)
  if (!rateLimit(`payload-graphql:${ip}`, 300, 15 * 60 * 1000)) {
    return new Response(
      JSON.stringify({ errors: [{ message: (await getFormTexts()).messages.tooManyRequests }] }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
  return defaultGraphQLPost(req)
}

export const OPTIONS = REST_OPTIONS(config)

