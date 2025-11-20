import crypto from 'crypto'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { sendEmail } from '@/lib/email'

const ALLOWED_METHODS = 'POST,OPTIONS'
const DEFAULT_ALLOWED_HEADERS = 'Content-Type,Authorization,Payload-CSRF-Token'
const THROTTLE_MS = 10 * 60 * 1000 // 10 minutes

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
    return new Response(JSON.stringify({ success: true }), { status: 200, headers })
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
    // ignore
  }

  // Always respond success to avoid user enumeration
  const payload = await getPayload({ config: configPromise })

  try {
    if (!email) return jsonResponse(request, { success: true })

    const found = await payload.find({
      collection: 'users',
      where: { email: { equals: email } } as any,
      limit: 1,
      overrideAccess: true,
    })
    if ((found?.totalDocs ?? 0) === 0) return jsonResponse(request, { success: true })

    const user = found.docs[0] as any
    if (user.emailVerified === true) return jsonResponse(request, { success: true })

    const lastSent = user?.emailVerification?.lastSentAt ? new Date(user.emailVerification.lastSentAt).getTime() : 0
    if (lastSent && Date.now() - lastSent < THROTTLE_MS) return jsonResponse(request, { success: true })

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        emailVerification: {
          tokenHash,
          expiresAt,
          lastSentAt: new Date().toISOString(),
        },
        role: (user as any)?.role === 'admin' || (user as any)?.role === 'editor' || (user as any)?.role === 'organizer' ? (user as any).role : 'organizer',
      },
      overrideAccess: true,
      user: { id: 'system-resend-verify', role: 'admin' } as any,
    })

    const corsList = (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)
    const frontendBase = corsList[0] || 'https://main.dgfhrurhtm4pa.amplifyapp.com'
    const verifyUrl = `${frontendBase.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(rawToken)}`

    await sendEmail({
      to: email,
      subject: 'MoaFinder – E-Mail-Bestätigung erneut senden',
      text: `Bitte bestätige deine E-Mail-Adresse:\n${verifyUrl}\n\nDieser Link ist 24 Stunden gültig.`,
      html: `<p>Bitte bestätige deine E-Mail-Adresse.</p><p><a href="${verifyUrl}">E-Mail jetzt bestätigen</a></p><p>Dieser Link ist 24 Stunden gültig.</p>`,
    })
  } catch (error) {
    try { (await getPayload({ config: configPromise })).logger?.error?.(error) } catch {}
  }

  return jsonResponse(request, { success: true })
}

