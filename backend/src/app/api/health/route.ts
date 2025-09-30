import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Lightweight health check that ensures the server booted
 * and can talk to MongoDB. Keeps the response fast so App Runner
 * health checks do not time out while Payload is starting up.
 */
export const GET = async () => {
  try {
    const payload = await getPayload({
      config: configPromise,
    })

    // Run a cheap command to assert the DB connection is alive.
    const client =
      // Payload 3 exposes the native Mongo client via payload.db.client
      // but keep the older fallback for safety when running tests.
      // @ts-expect-error - payload types don't expose the internal client.
      payload.db?.client ?? payload.mongoConnection?.getClient?.()

    if (client) {
      await client.db().command({ ping: 1 })
    }

    return Response.json({ status: 'ok' }, { status: 200 })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 },
    )
  }
}
