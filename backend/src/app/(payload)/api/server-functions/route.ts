import config from '@payload-config'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from '../../admin/importMap'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { name, args } = body || {}
    const result = await handleServerFunctions({ name, args, config, importMap })
    return Response.json(result)
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}

