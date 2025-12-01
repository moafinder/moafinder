import { NextResponse } from 'next/server'

import { resolveRecipientsFromEnv, sendEmail } from '../../../lib/email'

type ContactFormPayload = {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const buildEmailBody = ({ name, email, subject, message }: Required<ContactFormPayload>) => {
  const lines = [
    `Name: ${name}`,
    `E-Mail: ${email}`,
    `Betreff: ${subject}`,
    '',
    message,
  ]

  return lines.join('\n')
}

// Get allowed origins from environment, matching Payload CORS config
const getAllowedOrigins = (): string[] => {
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  if (process.env.NODE_ENV !== 'production') {
    for (const devOrigin of ['http://localhost:5173', 'http://127.0.0.1:5173']) {
      if (!origins.includes(devOrigin)) origins.push(devOrigin)
    }
  }

  return origins
}

const getCorsHeaders = (requestOrigin: string | null) => {
  const allowedOrigins = getAllowedOrigins()
  const origin = requestOrigin && allowedOrigins.includes(requestOrigin) ? requestOrigin : ''

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

// Handle preflight OPTIONS request
export const OPTIONS = async (request: Request) => {
  const requestOrigin = request.headers.get('origin')
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(requestOrigin),
  })
}

export const POST = async (request: Request) => {
  const requestOrigin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(requestOrigin)
  let payload: ContactFormPayload

  try {
    payload = await request.json()
  } catch (_error) {
    return NextResponse.json(
      { error: 'Ungültige Anfrage. Es wurden keine Formulardaten gefunden.' },
      { status: 400, headers: corsHeaders },
    )
  }

  const name = payload.name?.trim()
  const email = payload.email?.trim()
  const subject = payload.subject?.trim() || 'Kontaktformular'
  const message = payload.message?.trim()

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'Bitte füllen Sie alle Pflichtfelder aus.' },
      { status: 400, headers: corsHeaders },
    )
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: 'Bitte geben Sie eine gültige E-Mail-Adresse an.' },
      { status: 400, headers: corsHeaders },
    )
  }

  const recipients = resolveRecipientsFromEnv(
    process.env.CONTACT_RECIPIENT_EMAILS || process.env.SMTP_USER,
  )

  if (!recipients.length) {
    console.warn('CONTACT_RECIPIENT_EMAILS is not configured. Contact form submissions cannot be delivered.')
    return NextResponse.json(
      { error: 'Der Kontakt-Dienst ist derzeit nicht verfügbar.' },
      { status: 503, headers: corsHeaders },
    )
  }

  const textBody = buildEmailBody({
    name,
    email,
    subject,
    message,
  })

  const emailResult = await sendEmail({
    to: recipients,
    subject: `Kontaktanfrage: ${subject}`,
    text: textBody,
    replyTo: email,
  })

  if (!emailResult.success) {
    return NextResponse.json(
      { error: 'Ihre Nachricht konnte nicht versendet werden. Bitte versuchen Sie es später erneut.' },
      { status: 502, headers: corsHeaders },
    )
  }

  return NextResponse.json({ success: true }, { headers: corsHeaders })
}
