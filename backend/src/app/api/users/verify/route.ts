import crypto from 'crypto'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

const ALLOWED_METHODS = 'GET,OPTIONS'
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

function jsonResponse<T>(request: Request, body: T, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  const { allowed } = applyCorsHeaders(request, headers)
  if (!allowed) {
    return new Response(JSON.stringify({ errors: [{ message: 'Origin not allowed' }] }), { status: 403, headers })
  }
  return new Response(JSON.stringify(body), { ...init, headers })
}

export async function OPTIONS(request: Request) {
  const headers = new Headers()
  const { allowed } = applyCorsHeaders(request, headers, true)
  return new Response(null, { status: allowed ? 204 : 403, headers })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return jsonResponse(request, { error: 'Verification token is required.' }, { status: 400 })
  }

  const hash = crypto.createHash('sha256').update(token).digest('hex')
  const now = new Date().toISOString()

  const payload = await getPayload({ config: configPromise })

  let user
  try {
    const found = await payload.find({
      collection: 'users',
      where: {
        'emailVerification.tokenHash': { equals: hash },
        'emailVerification.expiresAt': { greater_than: now },
      } as any,
      limit: 1,
      overrideAccess: true,
    })

    if (!found || found.totalDocs === 0) {
      return jsonResponse(request,
        { error: 'Invalid or expired verification token.' },
        { status: 400 },
      )
    }

    user = found.docs[0]

    const currentRole = (user as any)?.role
    const safeRole = currentRole === 'admin' || currentRole === 'editor' || currentRole === 'organizer' ? currentRole : 'organizer'
    await payload.update({
      collection: 'users',
      id: user.id as string,
      data: {
        emailVerified: true,
        emailVerification: { tokenHash: null, expiresAt: null },
        disabled: false,
        role: safeRole,
      },
      overrideAccess: true,
      user: { id: 'system-verify-email', role: 'admin' } as any,
    })
  } catch (error) {
    payload.logger.error({ msg: 'Email verification failed', error })
    return jsonResponse(request, { error: 'Verification failed.' }, { status: 500 })
  }

  return jsonResponse(request, { success: true })
}
