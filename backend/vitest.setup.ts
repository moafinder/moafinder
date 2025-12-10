// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// SAFETY: Force tests to use local MongoDB, never production
// This prevents accidental data corruption in production
const productionPatterns = [
  'mongodb.net',      // MongoDB Atlas
  'mongodb+srv://',   // Atlas connection string
  'moafinder.dlqfbls', // Our production cluster
]

const dbUri = process.env.DATABASE_URI || ''
const isProduction = productionPatterns.some(pattern => dbUri.includes(pattern))

if (isProduction) {
  console.error('\n⚠️  SAFETY CHECK FAILED ⚠️')
  console.error('Tests are configured to run against a production database!')
  console.error('DATABASE_URI contains:', dbUri.substring(0, 50) + '...')
  console.error('\nTo run tests safely, use a local MongoDB:')
  console.error('  DATABASE_URI=mongodb://localhost:27017/moafinder-test pnpm vitest run')
  console.error('\nOr set up test.env file with local database.\n')
  process.exit(1)
}
