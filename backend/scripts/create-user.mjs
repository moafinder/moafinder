#!/usr/bin/env node
import 'dotenv/config'
import payload from 'payload'
import config from '@payload-config'

const args = process.argv.slice(2).filter((value) => value !== '--')
const [email, password, role = 'organizer', name = ''] = args

if (!email || !password) {
  console.error('Usage: pnpm exec tsx scripts/create-user.mjs <email> <password> [role] [name]')
  console.error('  role: admin, editor, or organizer (default: organizer)')
  console.error('  password must be 12+ chars with upper, lower, number, special char')
  process.exit(1)
}

const createUser = async () => {
  const app = await payload.init({ config })

  // Check if user exists
  const existing = await app.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.totalDocs > 0) {
    console.log(`User ${email} already exists. Updating password and role...`)
    await app.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: { password, role, ...(name ? { name } : {}) },
      overrideAccess: true,
      user: { role: 'admin', id: 'create-user-script' },
    })
    console.log(`✓ Updated user ${email} with role '${role}'`)
  } else {
    await app.create({
      collection: 'users',
      data: {
        email,
        password,
        role,
        ...(name ? { name } : {}),
      },
      overrideAccess: true,
      user: { role: 'admin', id: 'create-user-script' },
    })
    console.log(`✓ Created user ${email} with role '${role}'`)
  }

  process.exit(0)
}

createUser().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
