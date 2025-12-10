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
  
  const withCoords = locations.docs.filter(l => l.coordinates && Array.isArray(l.coordinates) && l.coordinates.length === 2)
  const withoutCoords = locations.docs.filter(l => !l.coordinates || !Array.isArray(l.coordinates) || l.coordinates.length !== 2)
  
  console.log('Total locations:', locations.docs.length)
  console.log('With coordinates:', withCoords.length)
  console.log('Without coordinates:', withoutCoords.length)
  console.log('')
  console.log('Sample coordinates (checking if within Moabit bounds):')
  
  // Moabit bounds
  const bounds = {
    north: 52.542,
    south: 52.516,
    west: 13.315,
    east: 13.385,
  }
  
  withCoords.forEach(l => {
    const [lon, lat] = l.coordinates as [number, number]
    const inBounds = lat >= bounds.south && lat <= bounds.north && lon >= bounds.west && lon <= bounds.east
    console.log('  ', (l.shortName || l.name), '->', `[${lon}, ${lat}]`, inBounds ? '✓ IN BOUNDS' : '✗ OUT OF BOUNDS')
  })
  
  console.log('')
  console.log('Locations without coordinates:')
  withoutCoords.forEach(l => {
    console.log('  ', l.shortName || l.name)
  })
  
  process.exit(0)
}
main()
