import { buildConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import Organizations from './collections/Organizations'
import Events from './collections/Events'
import Locations from './collections/Locations'
import Tags from './collections/Tags'
import Media from './collections/Media'
import 'dotenv/config' // make sure env vars are available
import { mongooseAdapter } from '@payloadcms/db-mongodb'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET as string,
  db: mongooseAdapter({
    url: process.env.DATABASE_URI as string,
  }),
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Organizations.slug,
    meta: {
      titleSuffix: '- MoaFinder CMS',
    },
  },
  collections: [Organizations, Events, Locations, Tags, Media],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  cors: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
  csrf: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
})
