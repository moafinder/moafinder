#!/usr/bin/env node
import 'dotenv/config'
import payload from 'payload'
import config from '@payload-config'

const args = process.argv.slice(2).filter((value) => value !== '--')
const [email, role = 'admin', newPassword] = args

if (!email) {
  console.error('Usage: pnpm exec tsx scripts/promote-user.mjs <email> [role]')
  process.exit(1)
}

const promote = async () => {
  const app = await payload.init({ config })

  const data = { role }
  console.log(`Updating user ${email} to role '${role}'${newPassword ? ' with password reset' : ''}...`)
  if (newPassword) {
    data.password = newPassword
    data.passwordConfirm = newPassword
  }

  const result = await app.update({
    collection: 'users',
    where: { email: { equals: email } },
    data,
    overrideAccess: true,
    user: { role: 'admin' },
  })

  if (result.totalDocs === 0) {
    console.warn(`No users found with email ${email}`)
  } else {
    const actions = [`role='${role}'`]
    if (newPassword) {
      actions.push('password reset')
    }
    console.log(`Updated ${result.totalDocs} user(s): ${actions.join(', ')}.`)
    if (newPassword) {
      try {
        await app.auth({ collection: 'users', data: { email, password: newPassword } })
        console.log('Password verification succeeded.')
      } catch (error) {
        console.warn('Password verification failed:', error instanceof Error ? error.message : error)
      }
    }
  }

  process.exit(0)
}

promote().catch((error) => {
  console.error('Failed to update user role.', error)
  process.exit(1)
})
