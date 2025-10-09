// @ts-nocheck

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import type { Payload } from 'payload'
import dotenv from 'dotenv'

import type { Event, Location, Organization, Tag, User } from '../src/payload-types'
import { PROTOTYPE_TAGS } from '../src/data/prototypeTags'
import { slugify } from '../src/utils/slugify'

const adminEmail = 'admin@moafinder.local'
const organizerEmail = 'organizer@moafinder.local'

function log(message: string, extra?: unknown) {
  if (extra) {
    console.log(message, extra)
  } else {
    console.log(message)
  }
}

type PaginatedDocs<T> = { docs: T[]; totalDocs: number }

async function ensureAdminUser(payload: Payload) {
  const existing = (await payload.find({
    collection: 'users',
    where: { email: { equals: adminEmail } },
    limit: 1,
  })) as PaginatedDocs<User>

  if (existing.totalDocs > 0) {
    let user = existing.docs[0]
    if (user.role !== 'admin') {
      log('↻ Updating existing user to admin role', adminEmail)
      user = (await payload.update({
        collection: 'users',
        id: user.id,
        data: { role: 'admin' },
        overrideAccess: true,
        user: { role: 'admin', id: 'seed-script' } as any,
      })) as unknown as User
    } else {
      log('✔ Found existing admin user', adminEmail)
    }
    return user
  }

  log('➕ Creating admin user', adminEmail)
  return (await payload.create({
    collection: 'users',
    data: {
      email: adminEmail,
      password: 'ChangeMe123!',
      name: 'Seed Admin',
      role: 'admin',
    },
    overrideAccess: true,
    user: { role: 'admin', id: 'seed-script' } as any,
  })) as User
}

async function ensureOrganizerUser(payload: Payload) {
  const existing = (await payload.find({
    collection: 'users',
    where: { email: { equals: organizerEmail } },
    limit: 1,
  })) as PaginatedDocs<User>

  if (existing.totalDocs > 0) {
    let user = existing.docs[0]
    if (user.role !== 'organizer') {
      log('↻ Updating existing user to organizer role', organizerEmail)
      user = (await payload.update({
        collection: 'users',
        id: user.id,
        data: { role: 'organizer' },
        overrideAccess: true,
        user: { role: 'admin', id: 'seed-script' } as any,
      })) as unknown as User
    } else {
      log('✔ Found existing organizer user', organizerEmail)
    }
    return user
  }

  log('➕ Creating organizer user', organizerEmail)
  return (await payload.create({
    collection: 'users',
    data: {
      email: organizerEmail,
      password: 'ChangeMe123!',
      name: 'Seed Organizer',
      role: 'organizer',
    },
    overrideAccess: true,
    user: { role: 'admin', id: 'seed-script' } as any,
  })) as User
}

async function ensureTag(payload: Payload, data: { name: string; category: Tag['category']; color: string }) {
  const slug = slugify(data.name)
  const existing = (await payload.find({
    collection: 'tags',
    where: { slug: { equals: slug } },
    limit: 1,
  })) as PaginatedDocs<Tag>

  if (existing.totalDocs > 0) {
    return existing.docs[0]
  }

  log('➕ Creating tag', data.name)
  return (await payload.create({
    collection: 'tags',
    data: {
      ...data,
      slug,
    },
    overrideAccess: true,
  })) as Tag
}

async function ensureOrganization(
  payload: Payload,
  data: {
    name: string
    email: string
    ownerId: string
    contactPerson: string
    website: string
    phone: string
  },
) {
  const existing = (await payload.find({
    collection: 'organizations',
    where: { email: { equals: data.email } },
    limit: 1,
  })) as PaginatedDocs<Organization>

  if (existing.totalDocs > 0) {
    return existing.docs[0]
  }

  log('➕ Creating organization', data.name)
  return (await payload.create({
    collection: 'organizations',
    data: {
      owner: data.ownerId,
      name: data.name,
      email: data.email,
      contactPerson: data.contactPerson,
      website: data.website,
      phone: data.phone,
      approved: true,
    },
    overrideAccess: true,
  })) as Organization
}

async function ensureLocation(
  payload: Payload,
  data: {
    name: string
    shortName: string
    description: string
    address: {
      street: string
      number: string
      postalCode: string
      city: string
    }
    mapPosition: { x: number; y: number }
    openingHours: string
  },
) {
  const existing = (await payload.find({
    collection: 'locations',
    where: { shortName: { equals: data.shortName } },
    limit: 1,
  })) as PaginatedDocs<Location>

  if (existing.totalDocs > 0) {
    return existing.docs[0]
  }

  log('➕ Creating location', data.name)
  return (await payload.create({
    collection: 'locations',
    data,
    overrideAccess: true,
  })) as Location
}

async function ensureEvent(
  payload: Payload,
  data: Partial<Event> & Pick<Event, 'title' | 'startDate'>,
) {
  const existing = (await payload.find({
    collection: 'events',
    where: {
      title: { equals: data.title },
      startDate: { equals: data.startDate },
    },
    limit: 1,
  })) as PaginatedDocs<Event>

  if (existing.totalDocs > 0) {
    return existing.docs[0]
  }

  log('➕ Creating event', data.title)
  return (await payload.create({
    collection: 'events',
    // payload.create is typed strictly; we know the seed data is valid for creation.
    data: data as Record<string, unknown>,
    overrideAccess: true,
  })) as Event
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function seed() {
  dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true })

  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET missing. Ensure backend/.env is configured before seeding.')
  }

  process.env.PAYLOAD_CONFIG_PATH = path.resolve(__dirname, '../src/payload.config.ts')
  process.env.NODE_ENV = process.env.NODE_ENV || 'development'

  log('Using PAYLOAD_SECRET', process.env.PAYLOAD_SECRET)

  process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET.trim()

  const { getPayload } = await import('payload')
  const configModule = await import(process.env.PAYLOAD_CONFIG_PATH)
  const config = configModule.default ?? configModule

  log('Config secret before init', config.secret)
  config.secret = process.env.PAYLOAD_SECRET

  const payload = await getPayload({
    config,
    secret: process.env.PAYLOAD_SECRET,
  })

  const adminUser = await ensureAdminUser(payload)
  const organizerUser = await ensureOrganizerUser(payload)

  const tags = await Promise.all(PROTOTYPE_TAGS.map((tag) => ensureTag(payload, tag)))

  const tagByName = Object.fromEntries(tags.map((tag) => [tag.name, tag]))

  let organization = await ensureOrganization(payload, {
    name: 'Stephans Nachbarschaftsladen',
    email: 'kontakt@stephans.example',
    ownerId: organizerUser.id,
    contactPerson: 'S. Beispiel',
    website: 'https://stephans.example',
    phone: '+49 30 1234567',
  })

  // If organization already existed with a different owner, reassign to organizer user
  if ((organization as any).owner !== organizerUser.id) {
    log('↻ Reassigning organization owner to organizer user')
    organization = (await payload.update({
      collection: 'organizations',
      id: (organization as any).id,
      data: { owner: organizerUser.id },
      overrideAccess: true,
      user: { role: 'admin', id: 'seed-script' } as any,
    })) as any
  }

  const locations = await Promise.all([
    ensureLocation(payload, {
      name: 'Stephans – Der Nachbarschaftsladen',
      shortName: 'Stephans',
      description:
        'Nachbarschaftsladen mit wöchentlichen Treffpunkten, Beratungsangeboten und Raum für gemeinsame Aktivitäten im Herzen von Moabit.',
      address: {
        street: 'Stephansstraße',
        number: '45',
        postalCode: '10559',
        city: 'Berlin',
      },
      mapPosition: { x: 42, y: 38 },
      openingHours: 'Mo–Fr 10:00–18:00 Uhr',
    }),
    ensureLocation(payload, {
      name: 'Stadtschloss Moabit',
      shortName: 'Stadtschloss',
      description:
        'Ort für Kulturangebote, Empowerment-Workshops und offenen Austausch. Besonders Familien- und Jugendarbeit stehen im Fokus.',
      address: {
        street: 'Rostocker Straße',
        number: '32',
        postalCode: '10553',
        city: 'Berlin',
      },
      mapPosition: { x: 38, y: 55 },
      openingHours: 'Di–Sa 12:00–20:00 Uhr',
    }),
  ])

  const locationByShortName = Object.fromEntries(
    locations.map((location) => [location.shortName, location]),
  )

  const now = new Date()

  const upcomingEvents: Array<Partial<Event> & Pick<Event, 'title' | 'startDate'>> = [
    {
      title: 'Sommerfest für Groß und Klein',
      subtitle: 'Ein Tag voller Musik, Workshops und Begegnung',
      eventType: 'einmalig',
      startDate: new Date(now.getFullYear(), now.getMonth() + 1, 12, 12).toISOString(),
      time: { from: '12:00 Uhr', to: '20:00 Uhr' },
      description:
        'Ein buntes Sommerfest mit Bühnenprogramm, Kinderaktionen und kulinarischen Angeboten. Lokale Initiativen stellen ihre Arbeit vor.',
      location: locationByShortName.Stephans.id,
      organizer: organization.id,
      tags: [
        tagByName['Einmalig'].id,
        tagByName['Begegnung & Party'].id,
        tagByName['Kinder'].id,
        tagByName['Erwachsene'].id,
      ],
      cost: { isFree: true, details: 'Eintritt frei, Spenden willkommen' },
      isAccessible: true,
      status: 'approved',
    },
    {
      title: 'Mit Feuer und Flamme gegen Rassismus',
      subtitle: 'Empowerment-Workshop-Reihe für Jugendliche',
      eventType: 'wöchentlich',
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21, 17).toISOString(),
      time: { from: '17:00 Uhr', to: '19:00 Uhr' },
      description:
        'Wöchentliche Workshop-Reihe zu antirassistischen Strategien, Selbstermächtigung und kreativen Ausdrucksformen. Mit wechselnden Gästen aus der Community.',
      location: locationByShortName.Stadtschloss.id,
      organizer: organization.id,
      tags: [
        tagByName['Regelmäßig'].id,
        tagByName['Antirassismus & Empowerment'].id,
        tagByName['Jugendliche'].id,
      ],
      cost: { isFree: true },
      isAccessible: true,
      status: 'approved',
    },
    {
      title: 'Open Mic im Stadtschloss',
      subtitle: 'Offene Bühne für Musik und Spoken Word',
      eventType: 'monatlich',
      startDate: new Date(now.getFullYear(), now.getMonth() + 2, 28, 19, 30).toISOString(),
      time: { from: '19:30 Uhr', to: '22:30 Uhr' },
      description:
        'Einmal im Monat gehört die Bühne euch: Bringt Songs, Gedichte oder Geschichten mit. Wir sorgen für Technik, Snacks und eine wohlwollende Atmosphäre.',
      location: locationByShortName.Stadtschloss.id,
      organizer: organization.id,
      tags: [
        tagByName['Regelmäßig'].id,
        tagByName['Musik & Gesang'].id,
        tagByName['Erwachsene'].id,
      ],
      cost: { isFree: false, details: 'Eintritt auf Spendenbasis' },
      isAccessible: false,
      status: 'approved',
    },
  ]

  for (const eventData of upcomingEvents) {
    // eslint-disable-next-line no-await-in-loop
    await ensureEvent(payload, {
      ...eventData,
      organizer: eventData.organizer ?? organization.id,
      location: eventData.location ?? locationByShortName.Stephans.id,
      status: eventData.status ?? 'approved',
    })
  }

  log('✅ Demo-Daten erfolgreich (oder bereits) vorhanden.')
  process.exit(0)
}

seed().catch((error) => {
  console.error('❌ Fehler beim Befüllen der Demo-Daten', error)
  process.exit(1)
})
