import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type GlobalWithCachedPayload = typeof globalThis & {
  __payloadHealthInstance?: ReturnType<typeof getPayload>
}

const globalWithCachedPayload = globalThis as GlobalWithCachedPayload

const getCachedPayload = () => {
  if (!globalWithCachedPayload.__payloadHealthInstance) {
    globalWithCachedPayload.__payloadHealthInstance = getPayload({
      config: configPromise,
    })
  }

  return globalWithCachedPayload.__payloadHealthInstance
}

const parseDuration = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

const healthResponse = async () => {
  const warmupWindowMs = parseDuration(process.env.HEALTHCHECK_WARMUP_MS, 2 * 60 * 1000)
  const pingTimeoutMs = parseDuration(process.env.HEALTHCHECK_PING_TIMEOUT_MS, 1500)
  const warmupActive = process.uptime() * 1000 < warmupWindowMs

  try {
    const payload = await getCachedPayload()

    // Run a cheap command to assert the DB connection is alive.
    const client =
      // Payload 3 exposes the native Mongo client via payload.db.client
      // but keep the older fallback for safety when running tests.
      // @ts-expect-error - payload types don't expose the internal client.
      payload.db?.client ?? payload.mongoConnection?.getClient?.()

    if (!client) {
      throw new Error('Mongo client is not available yet')
    }

    await Promise.race([
      client.db().command({ ping: 1 }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Mongo ping timed out after ${pingTimeoutMs}ms`)), pingTimeoutMs),
      ),
    ])

    return Response.json(
      { status: 'ok', uptimeMs: Math.round(process.uptime() * 1000) },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (warmupActive) {
      return Response.json(
        {
          status: 'starting',
          message,
          uptimeMs: Math.round(process.uptime() * 1000),
        },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } },
      )
    }

    return Response.json(
      {
        status: 'error',
        message,
        uptimeMs: Math.round(process.uptime() * 1000),
      },
      { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  }
}

export const GET = healthResponse

export const HEAD = async () => {
  const response = await healthResponse()
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  })
}
