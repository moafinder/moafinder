import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('fetches organizations', async () => {
    const organizations = await payload.find({
      collection: 'organizations',
    })
    expect(organizations).toBeDefined()
  })
})
