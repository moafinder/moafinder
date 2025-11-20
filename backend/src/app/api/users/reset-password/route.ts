import crypto from 'crypto'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

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

export async function POST(request: Request) {
  let token = ''
  let password = ''
  try {
    const data = await request.json()
    if (typeof data?.token === 'string') token = data.token.trim()
    if (typeof data?.password === 'string') password = data.password
  } catch {
    return jsonResponse(request, { errors: [{ message: 'Invalid JSON body' }] }, { status: 400 })
  }

  if (!token || !password) {
    return jsonResponse(request, { errors: [{ message: 'Token and password are required' }] }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const nowIso = new Date().toISOString()

  try {
    const result = await payload.find({
      collection: 'users',
      where: {
        and: [
          { resetPasswordToken: { equals: tokenHash } },
          { resetPasswordExpiration: { greater_than_equal: nowIso } },
        ],
      } as any,
      limit: 1,
      overrideAccess: true,
    })

    if ((result?.totalDocs ?? 0) === 0) {
      return jsonResponse(request, { errors: [{ message: 'Ungültiger oder abgelaufener Link.' }] }, { status: 400 })
    }

    const user = result.docs[0] as any
    const currentRole = (user as any)?.role
    const safeRole = currentRole === 'admin' || currentRole === 'editor' || currentRole === 'organizer' ? currentRole : 'organizer'

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password,
        resetPasswordToken: null,
        resetPasswordExpiration: null,
        role: safeRole,
      },
      overrideAccess: true,
      user: { id: 'system-reset-password', role: 'admin' } as any,
    })

    return jsonResponse(request, { success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reset failed'
    return jsonResponse(request, { errors: [{ message }] }, { status: 400 })
  }
}
