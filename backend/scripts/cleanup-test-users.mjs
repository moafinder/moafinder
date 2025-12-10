#!/usr/bin/env node
import 'dotenv/config'
import payload from 'payload'
import config from '@payload-config'

async function main() {
  const app = await payload.init({ config })
  
  // Find all test users (emails ending with @example.com)
  const testUsers = await app.find({
    collection: 'users',
    where: {
      email: { contains: '@example.com' }
    },
    limit: 200,
    overrideAccess: true,
  })
  
  console.log(`Found ${testUsers.totalDocs} test users to delete:`)
  
  for (const user of testUsers.docs) {
    console.log(`  Deleting: ${user.email}`)
    await app.delete({
      collection: 'users',
      id: user.id,
      overrideAccess: true,
    })
  }
  
  console.log(`\n✓ Deleted ${testUsers.totalDocs} test users`)
  
  // List remaining users
  const remaining = await app.find({ collection: 'users', limit: 100, overrideAccess: true })
  console.log(`\nRemaining users (${remaining.totalDocs}):`)
  remaining.docs.forEach(u => console.log('-', u.email, '|', u.role))
  
  process.exit(0)
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
