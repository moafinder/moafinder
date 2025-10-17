import configPromise from '@payload-config'
import { getPayload } from 'payload'

const ALLOWED_METHODS = 'POST,OPTIONS'
const DEFAULT_ALLOWED_HEADERS = 'Content-Type,Authorization,Payload-CSRF-Token'

const configuredOrigins = new Set(
  (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)

if (process.env.PAYLOAD_PUBLIC_SERVER_URL) {
  configuredOrigins.add(process.env.PAYLOAD_PUBLIC_SERVER_URL)
}

configuredOrigins.add('http://localhost:3000')
configuredOrigins.add('http://127.0.0.1:3000')

function applyCorsHeaders(request: Request, headers: Headers, includePreflightHeaders = false) {
  const origin = request.headers.get('origin')

  if (!origin) {
    if (includePreflightHeaders) {
      headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS)
      headers.set('Access-Control-Allow-Headers', DEFAULT_ALLOWED_HEADERS)
      headers.set('Access-Control-Max-Age', '600')
    }
    return { allowed: true }
  }

  const allowed = configuredOrigins.size === 0 || configuredOrigins.has(origin)
  if (!allowed) {
    return { allowed: false }
  }

  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.append('Vary', 'Origin')

  if (includePreflightHeaders) {
    headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS)
    headers.set(
      'Access-Control-Allow-Headers',
      request.headers.get('access-control-request-headers') ?? DEFAULT_ALLOWED_HEADERS,
    )
    headers.set('Access-Control-Max-Age', '600')
  }

  return { allowed: true }
}

function jsonResponse<T>(request: Request, body: T, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  const { allowed } = applyCorsHeaders(request, headers)
  if (!allowed) {
    return new Response(JSON.stringify({ errors: [{ message: 'Origin not allowed' }] }), {
      status: 403,
      headers,
    })
  }
  return new Response(JSON.stringify(body), { ...init, headers })
}

export async function OPTIONS(request: Request) {
  const headers = new Headers()
  const { allowed } = applyCorsHeaders(request, headers, true)
  return new Response(null, { status: allowed ? 204 : 403, headers })
}

export async function POST(request: Request) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return jsonResponse(request, { errors: [{ message: 'Invalid JSON body' }] }, { status: 400 })
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    return jsonResponse(request, { errors: [{ message: 'Email and password are required' }] }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    // Check if user is disabled before attempting login
    const found = await payload.find({
      collection: 'users',
      where: { email: { equals: email } } as any,
      limit: 1,
    })

    const user = found?.docs?.[0]
    if (user && (user as any).disabled) {
      return jsonResponse(
        request,
        { errors: [{ message: 'Account is deactivated. Contact an administrator.' }] },
        { status: 403 },
      )
    }

    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    return jsonResponse(request, { user: result.user, token: (result as any).token ?? null }, { status: 200 })
  } catch (error) {
    return jsonResponse(request, { errors: [{ message: 'Login failed' }] }, { status: 401 })
  }
}
