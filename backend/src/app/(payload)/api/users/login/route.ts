import config from '@payload-config'
import { REST_POST } from '@payloadcms/next/routes'
import { getPayload } from 'payload'

const defaultPOST = REST_POST(config)

// Simple CORS helper (mirror register route behavior)
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
  // Minimal disabled-account check before delegating to Payload's built-in handler (which sets cookies correctly)
  try {
    // IMPORTANT: read from a clone so we don't consume the original body
    const r = request.clone()
    const ct = (r.headers.get('content-type') || '').toLowerCase()
    let email = ''
    if (ct.includes('application/json')) {
      const body = await r.json()
      email = String(body?.email ?? body?._payload?.email ?? body?.payload?.email ?? body?.data?.email ?? '').trim().toLowerCase()
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      const text = await r.text()
      const params = new URLSearchParams(text)
      email = (params.get('email') || '').trim().toLowerCase()
      if (!email) {
        const p = params.get('_payload') || params.get('payload') || params.get('data')
        if (p) {
          try {
            const nested = JSON.parse(p)
            email = String(nested?.email || '').trim().toLowerCase()
          } catch {
            /* noop */
          }
        }
      }
    } else {
      const form = await r.formData().catch(() => null)
      if (form) {
        email = String(form.get('email') || form.get('username') || '').trim().toLowerCase()
        if (!email) {
          const raw = form.get('_payload') || form.get('payload') || form.get('data')
          if (raw) {
            try {
              const text = typeof raw === 'string' ? raw : await (raw as Blob).text()
              const nested = JSON.parse(text)
              email = String(nested?.email || '').trim().toLowerCase()
            } catch {
              /* noop */
            }
          }
        }
      }
    }

    if (email) {
      const payload = await getPayload({ config })
      const found = await payload
        .find({ collection: 'users', where: { email: { equals: email } } as any, limit: 1, overrideAccess: true })
        .catch(() => null)
      const user = (found?.docs?.[0] as any) || null
      if (user?.disabled) {
        const headers = new Headers({ 'Content-Type': 'application/json' })
        applyCorsHeaders(request, headers)
        return new Response(JSON.stringify({ errors: [{ message: 'Account is deactivated. Contact an administrator.' }] }), {
          status: 403,
          headers,
        })
      }
    }
  } catch {
    /* noop */
  }

  const resp = await defaultPOST(request, context as any)
  // Ensure CORS headers are present on the response
  const headers = new Headers(resp.headers)
  applyCorsHeaders(request, headers)
  return new Response(resp.body, { status: resp.status, headers })
}
