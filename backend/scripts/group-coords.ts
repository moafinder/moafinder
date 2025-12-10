import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })
  const locations = await payload.find({
    collection: 'locations',
    limit: 100,
    depth: 0
  })
  
  // Group by coordinates to see how many are at same location
  const coordGroups: Record<string, string[]> = {}
  locations.docs.forEach(l => {
    if (l.coordinates && Array.isArray(l.coordinates)) {
      const key = l.coordinates.join(',')
      if (!coordGroups[key]) coordGroups[key] = []
      coordGroups[key].push((l.shortName || l.name) as string)
    }
  })
  
  console.log('Unique coordinate positions:', Object.keys(coordGroups).length)
  console.log('')
  Object.entries(coordGroups).forEach(([coords, names]) => {
    console.log(`${coords} (${names.length} locations):`)
    names.forEach(n => console.log(`  - ${n}`))
    console.log('')
  })
  process.exit(0)
}
main()
