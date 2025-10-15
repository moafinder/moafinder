import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const to = url.searchParams.get('to') || process.env.SMTP_USER || ''
  const token = url.searchParams.get('token')

  if (!token || token !== process.env.PAYLOAD_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!to) {
    return NextResponse.json(
      { error: 'No recipient. Provide ?to=<email> or set SMTP_USER.' },
      { status: 400 },
    )
  }

  const now = new Date().toISOString()
  const result = await sendEmail({
    to,
    subject: `SMTP test ${now}`,
    text: `This is a SMTP test message sent at ${now}.`.
      concat('\n\nIf you see this, SMTP works.'),
  })

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}

