/**
 * Geocode locations using OpenStreetMap Nominatim API
 * 
 * This script reads all locations from the database and updates their
 * coordinates based on their street address using free geocoding.
 * 
 * Usage:
 *   pnpm tsx scripts/geocode-locations.ts          # Dry run (no changes)
 *   pnpm tsx scripts/geocode-locations.ts --apply  # Apply changes to database
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'MoaFinder/1.0 (https://moafinder.com)'

// Rate limit: Nominatim requires max 1 request per second
const RATE_LIMIT_MS = 1100

interface GeocodingResult {
  lat: string
  lon: string
  display_name: string
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function geocodeAddress(
  street: string,
  number: string,
  postalCode: string,
  city: string
): Promise<{ lat: number; lon: number } | null> {
  const query = `${street} ${number}, ${postalCode} ${city}, Germany`
  
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'de',
  })

  try {
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    })

    if (!response.ok) {
      console.error(`  HTTP error: ${response.status}`)
      return null
    }

    const results: GeocodingResult[] = await response.json()
    
    if (results.length === 0) {
      // Try with just street and postal code
      const fallbackParams = new URLSearchParams({
        q: `${street}, ${postalCode} ${city}, Germany`,
        format: 'json',
        limit: '1',
        countrycodes: 'de',
      })
      
      await sleep(RATE_LIMIT_MS)
      const fallbackResponse = await fetch(`${NOMINATIM_URL}?${fallbackParams}`, {
        headers: { 'User-Agent': USER_AGENT },
      })
      
      if (fallbackResponse.ok) {
        const fallbackResults: GeocodingResult[] = await fallbackResponse.json()
        if (fallbackResults.length > 0) {
          return {
            lat: parseFloat(fallbackResults[0].lat),
            lon: parseFloat(fallbackResults[0].lon),
          }
        }
      }
      return null
    }

    return {
      lat: parseFloat(results[0].lat),
      lon: parseFloat(results[0].lon),
    }
  } catch (error) {
    console.error(`  Geocoding error:`, error)
    return null
  }
}

async function main() {
  const applyChanges = process.argv.includes('--apply')
  
  console.log('='.repeat(60))
  console.log('Geocoding Locations Script')
  console.log('='.repeat(60))
  console.log(`Mode: ${applyChanges ? 'APPLY CHANGES' : 'DRY RUN (use --apply to save)'}`)
  console.log('')

  const payload = await getPayload({ config })

  const locations = await payload.find({
    collection: 'locations',
    limit: 200,
    depth: 0,
  })

  console.log(`Found ${locations.docs.length} locations`)
  console.log('')

  let successCount = 0
  let skipCount = 0
  let errorCount = 0
  let unchangedCount = 0

  for (const location of locations.docs) {
    const name = (location.shortName || location.name) as string
    const address = location.address as { street?: string; number?: string; postalCode?: string; city?: string } | undefined
    
    if (!address?.street || !address?.postalCode) {
      console.log(`[SKIP] ${name} - No address`)
      skipCount++
      continue
    }

    const street = address.street
    const number = address.number || ''
    const postalCode = address.postalCode
    const city = address.city || 'Berlin'

    console.log(`[GEOCODING] ${name}`)
    console.log(`  Address: ${street} ${number}, ${postalCode} ${city}`)

    const result = await geocodeAddress(street, number, postalCode, city)
    
    if (!result) {
      console.log(`  ❌ Could not geocode`)
      errorCount++
      await sleep(RATE_LIMIT_MS)
      continue
    }

    // Check if coordinates are already the same (within small epsilon)
    const existingCoords = location.coordinates as [number, number] | undefined
    if (existingCoords && Array.isArray(existingCoords) && existingCoords.length === 2) {
      const [existingLon, existingLat] = existingCoords
      const latDiff = Math.abs(existingLat - result.lat)
      const lonDiff = Math.abs(existingLon - result.lon)
      
      if (latDiff < 0.0001 && lonDiff < 0.0001) {
        console.log(`  ✓ Already correct: [${result.lon}, ${result.lat}]`)
        unchangedCount++
        await sleep(RATE_LIMIT_MS)
        continue
      }
    }

    console.log(`  → New coordinates: [${result.lon}, ${result.lat}]`)
    
    if (existingCoords) {
      console.log(`  → Old coordinates: [${existingCoords[0]}, ${existingCoords[1]}]`)
    }

    if (applyChanges) {
      try {
        await payload.update({
          collection: 'locations',
          id: location.id,
          data: {
            coordinates: [result.lon, result.lat], // GeoJSON format: [lon, lat]
          },
        })
        console.log(`  ✅ Updated`)
        successCount++
      } catch (error) {
        console.log(`  ❌ Update failed:`, error)
        errorCount++
      }
    } else {
      console.log(`  (dry run - no changes made)`)
      successCount++
    }

    await sleep(RATE_LIMIT_MS)
  }

  console.log('')
  console.log('='.repeat(60))
  console.log('Summary')
  console.log('='.repeat(60))
  console.log(`Total locations: ${locations.docs.length}`)
  console.log(`Would update: ${successCount}`)
  console.log(`Already correct: ${unchangedCount}`)
  console.log(`Skipped (no address): ${skipCount}`)
  console.log(`Errors: ${errorCount}`)
  
  if (!applyChanges && successCount > 0) {
    console.log('')
    console.log('To apply these changes, run:')
    console.log('  pnpm tsx scripts/geocode-locations.ts --apply')
  }

  process.exit(0)
}

main().catch(console.error)
