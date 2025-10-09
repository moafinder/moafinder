// Align with Payload v3 API: use getPayload with config rather than payload.init
import config from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config })

  // Express may not be present in Next-managed environments; guard access.
  const router = (payload as any).express?.Router?.()
  if (!router) return

  router.post('/debug-upload', async (req: any, res: any) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: any) => {
      chunks.push(chunk)
    })
    req.on('end', () => {
      const body = Buffer.concat(chunks)
      res.json({ length: body.length })
    })
  })
}

main().catch((err) => {
  console.error('debug-upload failed', err)
  process.exit(1)
})
