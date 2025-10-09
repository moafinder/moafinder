import config from '@payload-config'
import { REST_GET } from '@payloadcms/next/routes'

// If explicitly allowed (or in non-production dev scenarios), short-circuit auth
const defaultGET = REST_GET(config)

export async function GET(request: Request, context: unknown) {
  if (
    process.env.PAYLOAD_ALLOW_NO_DB === 'true' ||
    process.env.HEALTHCHECK_SKIP_DB === 'true' ||
    (process.env.NODE_ENV !== 'production' && process.env.HEALTHCHECK_TOLERATE_DB_FAILURE !== 'false')
  ) {
    return Response.json({ user: null }, { status: 200 })
  }

  // Fallback to default REST handler
  return defaultGET(request, context as any)
}
