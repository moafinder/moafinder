import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { MongoClient, Db } from 'mongodb'
import type { Connection } from 'mongoose'

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

type CachedPayload = Awaited<ReturnType<typeof getCachedPayload>>
type ExtendedConnection = Connection & { client?: MongoClient; db?: Db }

const resolveMongoConnectivity = (payload: CachedPayload) => {
  const adapterConnection = (payload.db as unknown as { connection?: ExtendedConnection } | undefined)?.connection

  if (adapterConnection) {
    if (typeof adapterConnection.getClient === 'function') {
      try {
        const client = adapterConnection.getClient()
        if (client) {
          return {
            ping: () => client.db().command({ ping: 1 }),
            ready: true,
          }
        }
      } catch (error) {
        payload.logger?.debug?.({ msg: 'Health check getClient threw, falling back', error })
      }
    }

    if (adapterConnection.client) {
      const client = adapterConnection.client
      return {
        ping: () => client.db().command({ ping: 1 }),
        ready: true,
      }
    }

    const { db } = adapterConnection
    if (db && typeof db.command === 'function') {
      const execPing = () => db.command({ ping: 1 })
      return {
        ping: execPing,
        ready: adapterConnection.readyState === 1,
      }
    }

    return { ping: null, ready: adapterConnection.readyState === 1 }
  }

  const legacyConnection = (payload as { mongoConnection?: { getClient?: () => MongoClient } }).mongoConnection
  const legacyClient = legacyConnection?.getClient?.()
  if (legacyClient) {
    return {
      ping: () => legacyClient.db().command({ ping: 1 }),
      ready: true,
    }
  }

  return { ping: null, ready: false }
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
    const connectivity = resolveMongoConnectivity(payload)

    if (!connectivity.ping) {
      if (!connectivity.ready) {
        throw new Error('Mongo client is not available yet')
      }

      return Response.json(
        {
          status: 'ok',
          detail: 'Mongo connection ready (adapter does not expose raw client)',
          uptimeMs: Math.round(process.uptime() * 1000),
        },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } },
      )
    }

    await Promise.race([
      connectivity.ping(),
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
