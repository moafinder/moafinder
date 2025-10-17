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
  const payload = await getPayload({ config: configPromise })

  // Authenticate via existing cookie/headers
  let authUser: any = null
  try {
    const authRes = await payload.auth({ headers: request.headers as any })
    authUser = authRes?.user ?? null
  } catch {
    /* noop */
  }
  if (!authUser) {
    return jsonResponse(request, { errors: [{ message: 'Unauthorized' }] }, { status: 401 })
  }

  // Parse JSON body
  let body: any = null
  try {
    body = await request.json()
  } catch {
    return jsonResponse(request, { errors: [{ message: 'Invalid JSON body' }] }, { status: 400 })
  }

  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''

  if (!currentPassword || !newPassword) {
    return jsonResponse(request, { errors: [{ message: 'Current and new password are required' }] }, { status: 400 })
  }

  // Verify current password by trying a login
  try {
    await payload.login({ collection: 'users', data: { email: authUser.email, password: currentPassword } })
  } catch {
    return jsonResponse(request, { errors: [{ message: 'Current password is incorrect' }] }, { status: 400 })
  }

  // Update password; Users collection hooks enforce strength
  try {
    await payload.update({ collection: 'users', id: authUser.id, data: { password: newPassword }, user: authUser })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password update failed'
    return jsonResponse(request, { errors: [{ message }] }, { status: 400 })
  }

  return jsonResponse(request, { success: true }, { status: 200 })
}

