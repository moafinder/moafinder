import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })
  
  // First, find an admin user to be the owner
  const users = await payload.find({ 
    collection: 'users', 
    where: { role: { equals: 'admin' } },
    limit: 1 
  })
  
  if (users.docs.length === 0) {
    console.error('No admin user found to own the organization')
    process.exit(1)
  }
  
  const adminUser = users.docs[0]
  console.log(`Using admin user: ${adminUser.email} (${adminUser.id})`)
  
  // Check if org already exists
  const existing = await payload.find({
    collection: 'organizations',
    where: { name: { equals: 'MoaFinder Redaktion' } },
    limit: 1
  })
  
  if (existing.docs.length > 0) {
    console.log(`Organization already exists: ${existing.docs[0].id}`)
    process.exit(0)
  }
  
  // Create the organization
  const org = await payload.create({
    collection: 'organizations',
    data: {
      name: 'MoaFinder Redaktion',
      email: 'moafinder@moabit.world',
      owner: adminUser.id,
      approved: true,
    }
  })
  
  console.log(`Created organization: ${org.name} (id: ${org.id})`)
  console.log('')
  console.log('Use this ID with the import script:')
  console.log(`  pnpm tsx scripts/import-locations.ts <csv-file> --default-org=${org.id}`)
  
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
