import { buildConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Payload } from 'payload'
import Organizations from './collections/Organizations'
import Events from './collections/Events'
import Locations from './collections/Locations'
import Tags from './collections/Tags'
import Media from './collections/Media'
import { Users } from './collections/Users'
import Notes from './collections/Notes'
import 'dotenv/config' // make sure env vars are available
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import type { Tag } from './payload-types'
import { PROTOTYPE_TAGS } from './data/prototypeTags'
import { slugify } from './utils/slugify'
import sharp from 'sharp'
import nodemailer from 'nodemailer'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

type PaginatedDocs<T> = { docs: T[]; totalDocs: number }

async function ensurePrototypeTags(payload: Payload) {
  for (const tag of PROTOTYPE_TAGS) {
    const slug = slugify(tag.name)
    const existing = (await payload.find({
      collection: 'tags',
      where: { slug: { equals: slug } },
      limit: 1,
    })) as PaginatedDocs<Tag>

    if (existing.totalDocs > 0) {
      const current = existing.docs[0]
      if (current.name !== tag.name || current.category !== tag.category || current.color !== tag.color) {
        await payload.update({
          collection: 'tags',
          id: current.id,
          data: { ...tag, slug },
          overrideAccess: true,
        })
      }
      continue
    }

    await payload.create({
      collection: 'tags',
      data: { ...tag, slug },
      overrideAccess: true,
    })
  }
}

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET as string,
  sharp,
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
  // Provide an email adapter function or promise (Payload will initialize it)
  email: nodemailerAdapter({
    defaultFromAddress: process.env.EMAIL_FROM || 'no-reply@localhost',
    defaultFromName: process.env.EMAIL_FROM_NAME || 'MoaFinder CMS',
    // Use real SMTP only when explicitly enabled; otherwise use JSON transport to avoid network calls in dev/tools
    transport:
      process.env.SMTP_ENABLE === 'true' && process.env.SMTP_HOST
        ? nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 25),
            secure: false,
            auth: process.env.SMTP_USER
              ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
              : undefined,
          })
        : nodemailer.createTransport({ jsonTransport: true }),
  }),
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  cors: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
  csrf: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
  onInit: async (payload) => {
    try {
      await ensurePrototypeTags(payload)
    } catch (error) {
      console.error('Failed to ensure prototype tags', error)
    }
  },
})
