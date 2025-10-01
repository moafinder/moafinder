import { buildConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import Organizations from './collections/Organizations'
import Events from './collections/Events'
import Locations from './collections/Locations'
import Tags from './collections/Tags'
import Media from './collections/Media'
import { Users } from './collections/Users'
import Notes from './collections/Notes'
import 'dotenv/config' // make sure env vars are available
import { mongooseAdapter } from '@payloadcms/db-mongodb'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const stripTrailingSlash = (origin: string) => origin.replace(/\/$/, '')

const isNonEmptyString = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.length > 0

const parseOrigins = (value?: string | null) =>
  value
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(isNonEmptyString)
    .map(stripTrailingSlash) ?? []

const defaultCorsOrigins = [
  process.env.FRONTEND_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.PAYLOAD_PUBLIC_SITE_URL,
  process.env.PAYLOAD_PUBLIC_SERVER_URL,
  // Production frontend hosted on Amplify.
  'https://main.d1i5ilm5fqb0i9.amplifyapp.com',
  // Local development ports for Next.js and Vite frontends.
  'http://localhost:3000',
  'http://localhost:5173',
]
  .filter(isNonEmptyString)
  .map(stripTrailingSlash)

const corsOrigins = Array.from(
  new Set([
    ...defaultCorsOrigins,
    ...parseOrigins(process.env.CORS_ORIGINS),
  ]),
)

const corsConfig = {
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET as string,
  db: mongooseAdapter({
    url: process.env.DATABASE_URI as string,
  }),
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- MoaFinder CMS',
    },
  },
  collections: [Users, Organizations, Events, Locations, Tags, Media, Notes],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  cors: corsConfig,
  csrf: corsOrigins,
})
