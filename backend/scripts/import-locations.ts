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

async function importLocations(csvPath: string, dryRun = false, defaultOrgId?: string) {
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
    if (addressAddition && addressAddition !== '–' && addressAddition !== '-') {
      street = street ? `${street} (${addressAddition})` : addressAddition
    }

    // Parse coordinates - handle German number format with periods as thousands separators
    // Format in CSV: "5.253.269.674.008.180" should be "52.532696..." 
    let coordinates: [number, number] | undefined
    let latStr = row['LAT']?.trim() || ''
    let lonStr = row['LON']?.trim() || ''
    
    // Remove all periods except the decimal one (German format has periods as thousands separators)
    // The correct format for Berlin should be around 52.5xxx for lat and 13.3xxx for lon
    const parseGermanCoord = (str: string): number => {
      if (!str) return NaN
      // Remove all periods, then add decimal point after first 2 digits
      const cleaned = str.replace(/\./g, '')
      if (cleaned.length < 3) return NaN
      const withDecimal = cleaned.slice(0, 2) + '.' + cleaned.slice(2)
      return parseFloat(withDecimal)
    }
    
    const lat = parseGermanCoord(latStr)
    const lon = parseGermanCoord(lonStr)
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

    // Clean up fields - remove placeholder dashes and fix Unicode characters
    const cleanField = (val?: string) => {
      let trimmed = val?.trim() || ''
      if (trimmed === '–' || trimmed === '-') return ''
      // Replace Unicode hyphens with regular hyphens
      trimmed = trimmed.replace(/\u2010|\u2011|\u2012|\u2013|\u2014|\u2015/g, '-')
      return trimmed
    }
    
    // Clean email specifically - remove any parenthetical notes
    const cleanEmail = (val?: string) => {
      let email = cleanField(val)
      // Remove parenthetical notes like "(ersetzt E-Mail)"
      email = email.replace(/\s*\([^)]*\)\s*$/, '')
      // Replace Unicode hyphens in email addresses
      email = email.replace(/\u2010|\u2011|\u2012|\u2013|\u2014|\u2015/g, '-')
      return email
    }

    const locationData = {
      name: fullName.replace(/\u2010|\u2011|\u2012|\u2013|\u2014|\u2015/g, '-'),
      shortName: (shortName || fullName.substring(0, 40)).replace(/\u2010|\u2011|\u2012|\u2013|\u2014|\u2015/g, '-'),
      description: (row['Beschreibungstext (1000 Zeichen)']?.substring(0, 1000) || '').replace(/\u2010|\u2011|\u2012|\u2013|\u2014|\u2015/g, '-'),
      address: {
        street: street.replace(/\u2010|\u2011|\u2012|\u2013|\u2014|\u2015/g, '-'),
        number: cleanField(row['Nr.']) || '1',  // Default to '1' if empty since it's required
        postalCode: cleanField(row['PLZ']) || '10551',  // Default to Moabit PLZ if empty
        city: 'Berlin',
      },
      openingHours: cleanField(row['Öffnungszeiten (optional)']),
      email: cleanEmail(row['Email']) || undefined,  // Don't include if empty to avoid validation
      homepage: cleanField(row['Homepage']),
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
      if (defaultOrgId) {
        console.log(`  Using default organization: ${defaultOrgId}`)
        organizationId = defaultOrgId
      } else {
        console.log(`  ⚠️  No organization found - skipping (use --default-org=<id> to set a default)`)
        skipCount++
        continue
      }
    }

    // Update the owner field with the final organization ID
    locationData.owner = organizationId

    try {
      const created = await payload.create({
        collection: 'locations',
        data: locationData as any,
        overrideAccess: true,  // Bypass access control for import
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
const defaultOrgId = args.find((arg) => arg.startsWith('--default-org='))?.split('=')[1]
const csvPath = args.find((arg) => !arg.startsWith('--'))

if (!csvPath) {
  console.log('Usage: pnpm tsx scripts/import-locations.ts <csv-file> [options]')
  console.log('')
  console.log('Options:')
  console.log('  --dry-run              Preview what would be imported without making changes')
  console.log('  --default-org=<id>     Use this organization ID for all locations without a match')
  console.log('')
  console.log('Example:')
  console.log('  pnpm tsx scripts/import-locations.ts locations.csv --dry-run')
  console.log('  pnpm tsx scripts/import-locations.ts locations.csv --default-org=abc123')
  process.exit(1)
}

importLocations(csvPath, dryRun, defaultOrgId)
  .then(() => {
    console.log('')
    console.log('Import complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Import failed:', error)
    process.exit(1)
  })
