import configPromise from '@payload-config'
import { getPayload } from 'payload'

const ALLOWED_METHODS = 'POST,OPTIONS'
const DEFAULT_ALLOWED_HEADERS = 'Content-Type'

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

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  })
}

function parseBody(value: unknown) {
  if (!value || typeof value !== 'object') {
    return {
      success: false,
      errors: [{ message: 'Invalid payload' }],
    }
  }

  const { name, email, password } = value as Record<string, unknown>

  const errors: Array<{ message: string; field?: string }> = []

  const trimmedName = typeof name === 'string' ? name.trim() : ''
  if (!trimmedName) {
    errors.push({ field: 'name', message: 'Name is required' })
  }

  const trimmedEmail = typeof email === 'string' ? email.trim() : ''
  if (!trimmedEmail) {
    errors.push({ field: 'email', message: 'Email is required' })
  } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
    errors.push({ field: 'email', message: 'Email must be valid' })
  }

  const passwordValue = typeof password === 'string' ? password : ''
  if (!passwordValue) {
    errors.push({ field: 'password', message: 'Password is required' })
  } else if (passwordValue.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' })
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return {
    success: true,
    data: {
      name: trimmedName,
      email: trimmedEmail.toLowerCase(),
      password: passwordValue,
    },
  }
}

export async function OPTIONS(request: Request) {
  const headers = new Headers()
  const { allowed } = applyCorsHeaders(request, headers, true)

  return new Response(null, {
    status: allowed ? 204 : 403,
    headers,
  })
}

export async function POST(request: Request) {
  let rawJson: unknown
  try {
    rawJson = await request.json()
  } catch (error) {
    return jsonResponse(request, { errors: [{ message: 'Request body must be valid JSON' }] }, { status: 400 })
  }

  const parsed = parseBody(rawJson)

  if (!parsed.success) {
    return jsonResponse(request, { errors: parsed.errors }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    await payload.create({
      collection: 'users',
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        role: undefined,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    const normalized = message.toLowerCase()

    const dataErrors = Array.isArray((error as any)?.data?.errors) ? (error as any).data.errors : []
    const duplicateByData = dataErrors.some((item: any) => {
      const path = typeof item?.path === 'string' ? item.path : ''
      const msg = typeof item?.message === 'string' ? item.message : ''
      return path.includes('email') && /already|registered|duplicate/i.test(msg)
    })

    if (duplicateByData || normalized.includes('already exists') || normalized.includes('duplicate key')) {
      return jsonResponse(
        request,
        { errors: [{ field: 'email', message: 'Diese E-Mail-Adresse ist bereits registriert.' }] },
        { status: 409 },
      )
    }

    payload.logger.error({ msg: 'User registration failed', error })
    return jsonResponse(request, { errors: [{ message: 'Registrierung fehlgeschlagen.' }] }, { status: 500 })
  }

  return jsonResponse(request, { message: 'Registrierung erfolgreich.' }, { status: 201 })
}
