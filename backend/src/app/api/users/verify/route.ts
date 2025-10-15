import crypto from 'crypto'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Verification token is required.' }, { status: 400 })
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
    })

    if (!found || found.totalDocs === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token.' },
        { status: 400 },
      )
    }

    user = found.docs[0]

    await payload.update({
      collection: 'users',
      id: user.id as string,
      data: {
        emailVerified: true,
        emailVerification: { tokenHash: null, expiresAt: null },
      },
      overrideAccess: true,
    })
  } catch (error) {
    payload.logger.error({ msg: 'Email verification failed', error })
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

