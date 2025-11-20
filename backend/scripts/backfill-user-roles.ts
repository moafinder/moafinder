// @ts-nocheck
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  // Load backend/.env
  dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true })

  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET missing. Ensure backend/.env is configured before running this script.')
  }

  // Point Payload to our config
  const configPath = path.resolve(__dirname, '../src/payload.config.ts')
  process.env.PAYLOAD_CONFIG_PATH = configPath
  process.env.NODE_ENV = process.env.NODE_ENV || 'development'

  const { getPayload } = await import('payload')
  const cfgModule = await import(configPath)
  const config = cfgModule.default ?? cfgModule

  const payload = await getPayload({ config, secret: process.env.PAYLOAD_SECRET })

  const valid = new Set(['admin', 'editor', 'organizer'])
  let totalChecked = 0
  let totalUpdated = 0

  const limit = 200
  let page = 1

  payload.logger.info('Scanning users for missing/invalid roles …')

  while (true) {
    const res = await payload.find({
      collection: 'users',
      where: {},
      page,
      limit,
      depth: 0,
      overrideAccess: true,
    })

    if (!res || !Array.isArray(res.docs) || res.docs.length === 0) break

    for (const doc of res.docs) {
      totalChecked += 1
      const role = (doc as any)?.role
      if (!valid.has(role)) {
        await payload.update({
          collection: 'users',
          id: (doc as any).id,
          data: { role: 'organizer' },
          overrideAccess: true,
        })
        totalUpdated += 1
      }
    }

    if (res.docs.length < limit) break
    page += 1
  }

  payload.logger.info(`Backfill complete. Checked: ${totalChecked}, updated: ${totalUpdated}.`)
  process.exit(0)
}

main().catch((error) => {
  console.error('Backfill failed:', error)
  process.exit(1)
})

