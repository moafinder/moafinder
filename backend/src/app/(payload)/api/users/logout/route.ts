import config from '@payload-config'
import { REST_POST } from '@payloadcms/next/routes'

const defaultPOST = REST_POST(config)

// Simple CORS helper (mirror login route behavior)
const ALLOWED_METHODS = 'POST,OPTIONS'
const DEFAULT_ALLOWED_HEADERS = 'Content-Type,Authorization,Payload-CSRF-Token'

const configuredOrigins = new Set(
  (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
)
if (process.env.PAYLOAD_PUBLIC_SERVER_URL) configuredOrigins.add(process.env.PAYLOAD_PUBLIC_SERVER_URL)
configuredOrigins.add('http://localhost:3000')
configuredOrigins.add('http://127.0.0.1:3000')
if (process.env.NODE_ENV !== 'production') {
  configuredOrigins.add('http://localhost:5173')
  configuredOrigins.add('http://127.0.0.1:5173')
}

function applyCorsHeaders(request: Request, headers: Headers, includePreflight = false) {
  const origin = request.headers.get('origin')
  if (!origin) {
    if (includePreflight) {
      headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS)
      headers.set('Access-Control-Allow-Headers', DEFAULT_ALLOWED_HEADERS)
      headers.set('Access-Control-Max-Age', '600')
    }
    return { allowed: true }
  }
  const allowed = configuredOrigins.size === 0 || configuredOrigins.has(origin)
  if (!allowed) return { allowed: false }
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.append('Vary', 'Origin')
  if (includePreflight) {
    headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS)
    headers.set('Access-Control-Allow-Headers', request.headers.get('access-control-request-headers') ?? DEFAULT_ALLOWED_HEADERS)
    headers.set('Access-Control-Max-Age', '600')
  }
  return { allowed: true }
}

export async function OPTIONS(request: Request) {
  const headers = new Headers()
  const { allowed } = applyCorsHeaders(request, headers, true)
  return new Response(null, { status: allowed ? 204 : 403, headers })
}

export async function POST(request: Request, context: unknown) {
  // Delegate to Payload's default handler, but ensure CORS headers so the browser accepts Set-Cookie
  const resp = await defaultPOST(request, context as any)
  const headers = new Headers(resp.headers)
  applyCorsHeaders(request, headers)
  return new Response(resp.body, { status: resp.status, headers })
}
