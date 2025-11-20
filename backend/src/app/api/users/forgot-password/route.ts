import crypto from 'crypto'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { sendEmail } from '@/lib/email'

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
  let email = ''
  try {
    const data = await request.json()
    if (typeof data?.email === 'string') email = data.email.trim().toLowerCase()
  } catch {
    // fallthrough: treat as empty email → generic success
  }

  if (!email) {
    // Prevent user enumeration: respond with 200 regardless
    return jsonResponse(request, { success: true })
  }

  const payload = await getPayload({ config: configPromise })
  const url = new URL(request.url)
  const debug = url.searchParams.get('debug') === '1' || url.searchParams.get('debug') === 'true'
  const tokenParam = url.searchParams.get('token')
  const canDebug = debug && tokenParam && tokenParam === process.env.PAYLOAD_SECRET

  try {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: email } } as any,
      limit: 1,
      overrideAccess: true,
    })

    if ((existing?.totalDocs ?? 0) === 0) {
      return jsonResponse(request, canDebug ? { success: true, delivered: false, reason: 'no_user' } : { success: true })
    }

    const user = existing.docs[0] as any
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() // 24h

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpiration: expiresAt,
      },
      overrideAccess: true,
    })

    const corsList = (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)
    const frontendBase = corsList[0] || 'https://main.dgfhrurhtm4pa.amplifyapp.com'
    const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`

    const lines = [
      'Du hast einen Link zum Zurücksetzen deines Passworts angefordert.',
      'Wenn du diese Anfrage nicht gestellt hast, kannst du diese E‑Mail ignorieren.',
      '',
      `Passwort zurücksetzen: ${resetUrl}`,
      '',
      'Dieser Link ist 24 Stunden gültig.',
    ]

    const mail = await sendEmail({
      to: email,
      subject: 'MoaFinder – Passwort zurücksetzen',
      text: lines.join('\n'),
    })
    if (!mail.success) {
      payload.logger.warn({ msg: 'Password reset email failed to send', email, error: mail.error })
    }
    if (canDebug) return jsonResponse(request, { success: true, delivered: !!mail.success, reason: mail.success ? 'sent' : 'smtp_error', resetUrl })
  } catch (error) {
    // Never leak errors to the client for privacy; log server-side
    try {
      (await getPayload({ config: configPromise })).logger?.error?.(error)
    } catch (_ignore) {
      // Swallow secondary logging errors (network/boot issues)
    }
    if (canDebug) return jsonResponse(request, { success: true, delivered: false, reason: 'server_error' })
  }

  // Always respond success to avoid user enumeration
  return jsonResponse(request, { success: true })
}
