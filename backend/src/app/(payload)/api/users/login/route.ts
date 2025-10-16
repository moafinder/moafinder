import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function POST(request: Request) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return Response.json({ errors: [{ message: 'Invalid JSON body' }] }, { status: 400 })
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    return Response.json({ errors: [{ message: 'Email and password are required' }] }, { status: 400 })
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
      return Response.json({ errors: [{ message: 'Account is deactivated. Contact an administrator.' }] }, { status: 403 })
    }

    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    return Response.json({ user: result.user, token: (result as any).token ?? null }, { status: 200 })
  } catch (error) {
    return Response.json({ errors: [{ message: 'Login failed' }] }, { status: 401 })
  }
}

