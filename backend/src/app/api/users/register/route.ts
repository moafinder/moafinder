import configPromise from '@payload-config'
import crypto from 'crypto'
import { getPayload } from 'payload'
import { ENFORCED_DEFAULT_ROLE } from '@/collections/Users'
import { sendEmail } from '@/lib/email'

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
if (process.env.NODE_ENV !== 'production') {
  configuredOrigins.add('http://localhost:5173')
  configuredOrigins.add('http://127.0.0.1:5173')
}

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

type ParsedRegistration = {
  name: string
  email: string
  password: string
}

type ParseError = {
  message: string
  field?: string
}

type ParseResult =
  | {
      success: true
      data: ParsedRegistration
    }
  | {
      success: false
      errors: ParseError[]
    }

function parseBody(value: unknown): ParseResult {
  if (!value || typeof value !== 'object') {
    return {
      success: false,
      errors: [{ message: 'Invalid payload' }],
    }
  }

  const { name, email, password } = value as Record<string, unknown>

  const errors: ParseError[] = []

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
  } else if (passwordValue.length < 12) {
    errors.push({ field: 'password', message: 'Password must be at least 12 characters long' })
  } else {
    const hasUpper = /[A-Z]/.test(passwordValue)
    const hasLower = /[a-z]/.test(passwordValue)
    const hasNumber = /[0-9]/.test(passwordValue)
    const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue)
    if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
      errors.push({
        field: 'password',
        message: 'Password must include upper, lower, number, and special character',
      })
    }
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

  let createdUser: Awaited<ReturnType<typeof payload.create>> | null = null

  try {
    createdUser = await payload.create({
      collection: 'users',
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        role: ENFORCED_DEFAULT_ROLE,
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

  if (createdUser) {
    try {
      await payload.create({
        collection: 'organizations',
        data: {
          owner: createdUser.id,
          name: parsed.data.name,
          email: parsed.data.email,
          contactPerson: parsed.data.name,
          role: 'organizer',
        },
      })
    } catch (error) {
      payload.logger.error({ msg: 'Failed to create organization for new user', error, userId: createdUser.id })
    }

    // Generate email verification token, store hashed, and send verification email
    try {
      const rawToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() // 24h

      await payload.update({
        collection: 'users',
        id: createdUser.id as string,
        data: {
          emailVerified: false,
          emailVerification: { tokenHash, expiresAt },
        },
        overrideAccess: true,
      })

      const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'
      const verifyUrl = `${baseUrl}/api/users/verify?token=${encodeURIComponent(rawToken)}`

      const lines = [
        'Willkommen bei MoaFinder! Bitte bestätigen Sie Ihre E-Mail-Adresse,',
        'damit Sie Veranstaltungen einstellen können.',
        '',
        `Bestätigungslink: ${verifyUrl}`,
        '',
        'Dieser Link ist 24 Stunden gültig.',
      ]

      const emailResult = await sendEmail({
        to: parsed.data.email,
        subject: 'Bitte bestätigen Sie Ihre E-Mail-Adresse',
        text: lines.join('\n'),
      })

      if (!emailResult.success) {
        payload.logger.warn({ msg: 'Verification email failed to send', userId: createdUser.id, error: emailResult.error })
      }
    } catch (error) {
      payload.logger.error({ msg: 'Failed to issue verification token/email', error, userId: createdUser.id })
    }
  }

  return jsonResponse(request, { message: 'Registrierung erfolgreich.' }, { status: 201 })
}
