#!/usr/bin/env node
import 'dotenv/config'
import payload from 'payload'
import config from '@payload-config'

async function main() {
  const app = await payload.init({ config })
  const users = await app.find({ collection: 'users', limit: 100, overrideAccess: true })
  console.log('Total users:', users.totalDocs)
  users.docs.forEach(u => console.log('-', u.email, '|', u.role, '|', u.name || '(no name)'))
  process.exit(0)
}

main()
