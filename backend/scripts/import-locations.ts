/**
 * Import locations from a CSV file into the Payload CMS database.
 *
 * Usage:
 *   1. Export your Google Doc table as CSV (File > Download > CSV)
 *   2. Place the CSV file in the backend folder (e.g., locations-import.csv)
 *   3. Run: pnpm tsx scripts/import-locations.ts locations-import.csv
 *
 * Expected CSV columns (German headers from Google Doc):
 *   - Voller Name des VO (full name)
 *   - Kurzform des Namens (short name)
 *   - Beschreibungstext (description, max 1000 chars)
 *   - Straße (street)
 *   - Nr. (house number)
 *   - PLZ (postal code)
 *   - Adressenzusatz (address addition - currently not in schema, will be appended to street)
 *   - Öffnungszeiten (opening hours)
 *   - Bild (image URL - will be skipped for now)
 *   - Homepage (not in current schema - logged)
 *   - Email (not in current schema - logged)
 *   - Veranstaltungsort (is this a venue? - informational)
 *   - Veranstalter (organizer name - used to find/create organization)
 *   - LAT (latitude)
 *   - LON (longitude)
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { getPayload } from 'payload'
import config from '../src/payload.config'

interface CsvRow {
  'Voller Name des VO'?: string
  'Kurzform des Namens'?: string
  'Beschreibungstext (1000 Zeichen)'?: string
  Straße?: string
  'Nr.'?: string
  PLZ?: string
  Adressenzusatz?: string
  'Öffnungszeiten (optional)'?: string
  Bild?: string
  Homepage?: string
  Email?: string
  Veranstaltungsort?: string
  Veranstalter?: string
  LAT?: string
  LON?: string
}

async function importLocations(csvPath: string, dryRun = false) {
  const absolutePath = path.resolve(csvPath)

  if (!fs.existsSync(absolutePath)) {
    console.error(`CSV file not found: ${absolutePath}`)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(absolutePath, 'utf-8')

  // Parse CSV with flexible column detection
  const records: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true, // Handle BOM from Excel/Google Sheets
  })

  console.log(`Found ${records.length} rows in CSV`)
  console.log(`Dry run: ${dryRun}`)
  console.log('')

  // Initialize Payload
  const payload = dryRun ? null : await getPayload({ config })

  async function findOrCreateOrganization(name: string): Promise<string | null> {
    if (!name || name.trim() === '' || !payload) return null

    const trimmedName = name.trim()

    // Try to find existing organization
    const existing = await payload.find({
      collection: 'organizations',
      where: {
        name: { contains: trimmedName },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`  Found existing organization: ${existing.docs[0].name}`)
      return existing.docs[0].id
    }

    // Organization not found
    console.log(`  ⚠️  Organization not found: "${trimmedName}" - location will need manual org assignment`)
    return null
  }

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (let i = 0; i < records.length; i++) {
    const row = records[i]
    const rowNum = i + 2 // +2 because row 1 is header, and arrays are 0-indexed

    const fullName = row['Voller Name des VO']?.trim()
    const shortName = row['Kurzform des Namens']?.trim()

    if (!fullName) {
      console.log(`Row ${rowNum}: Skipping - no name provided`)
      skipCount++
      continue
    }

    console.log(`Row ${rowNum}: Processing "${fullName}"...`)

    // Build street with address addition if present
    let street = row['Straße']?.trim() || ''
    const addressAddition = row['Adressenzusatz']?.trim()
    if (addressAddition) {
      street = street ? `${street} (${addressAddition})` : addressAddition
    }

    // Parse coordinates
    let coordinates: [number, number] | undefined
    const lat = parseFloat(row['LAT']?.replace(',', '.') || '')
    const lon = parseFloat(row['LON']?.replace(',', '.') || '')
    if (!isNaN(lat) && !isNaN(lon)) {
      // Payload stores coordinates as [longitude, latitude] (GeoJSON format)
      coordinates = [lon, lat]
    }

    // Find organization
    const organizerName = row['Veranstalter']?.trim()
    let organizationId: string | null = null
    if (!dryRun && organizerName) {
      organizationId = await findOrCreateOrganization(organizerName)
    }

    const locationData = {
      name: fullName,
      shortName: shortName || fullName.substring(0, 40),
      description: row['Beschreibungstext (1000 Zeichen)']?.substring(0, 1000) || '',
      address: {
        street: street,
        number: row['Nr.']?.trim() || '',
        postalCode: row['PLZ']?.trim() || '',
        city: 'Berlin',
      },
      openingHours: row['Öffnungszeiten (optional)']?.trim() || '',
      email: row['Email']?.trim() || '',
      homepage: row['Homepage']?.trim() || '',
      coordinates: coordinates,
      owner: organizationId,
    }

    if (dryRun) {
      console.log(`  Would create:`, JSON.stringify(locationData, null, 2))
      successCount++
      continue
    }

    if (!payload) continue

    // Check if location already exists
    const existing = await payload.find({
      collection: 'locations',
      where: {
        name: { equals: fullName },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`  ⚠️  Location already exists, skipping`)
      skipCount++
      continue
    }

    if (!organizationId) {
      console.log(`  ⚠️  No organization found - skipping (locations require an owner)`)
      skipCount++
      continue
    }

    try {
      const created = await payload.create({
        collection: 'locations',
        data: locationData as any,
      })
      console.log(`  ✅ Created location with ID: ${created.id}`)
      successCount++
    } catch (error) {
      console.error(`  ❌ Error creating location:`, error instanceof Error ? error.message : error)
      errorCount++
    }
  }

  console.log('')
  console.log('=== Import Summary ===')
  console.log(`Total rows: ${records.length}`)
  console.log(`Successfully created: ${successCount}`)
  console.log(`Skipped: ${skipCount}`)
  console.log(`Errors: ${errorCount}`)
}

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const csvPath = args.find((arg) => !arg.startsWith('--'))

if (!csvPath) {
  console.log('Usage: pnpm tsx scripts/import-locations.ts <csv-file> [--dry-run]')
  console.log('')
  console.log('Options:')
  console.log('  --dry-run    Preview what would be imported without making changes')
  console.log('')
  console.log('Example:')
  console.log('  pnpm tsx scripts/import-locations.ts locations.csv --dry-run')
  console.log('  pnpm tsx scripts/import-locations.ts locations.csv')
  process.exit(1)
}

importLocations(csvPath, dryRun)
  .then(() => {
    console.log('')
    console.log('Import complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Import failed:', error)
    process.exit(1)
  })
