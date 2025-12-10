import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })
  const orgs = await payload.find({ collection: 'organizations', limit: 100 })
  console.log('Organizations in database:')
  orgs.docs.forEach((o: any) => console.log(`  - ${o.name} (id: ${o.id})`))
  console.log(`Total: ${orgs.totalDocs}`)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
