// @ts-nocheck

import path from 'node:path'
import process from 'node:process'
import { getPayload } from 'payload'
import type { Payload } from 'payload'

import type { Event, Location, Organization, Tag, User } from '../src/payload-types'

const seedUserEmail = 'seed@moafinder.local'

function log(message: string, extra?: unknown) {
  if (extra) {
    console.log(message, extra)
  } else {
    console.log(message)
  }
}

function slugify(input: string) {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type PaginatedDocs<T> = { docs: T[]; totalDocs: number }

async function ensureUser(payload: Payload) {
  const existing = (await payload.find({
    collection: 'users',
    where: { email: { equals: seedUserEmail } },
    limit: 1,
  })) as PaginatedDocs<User>

  if (existing.totalDocs > 0) {
    log('✔ Found existing seed user', seedUserEmail)
    return existing.docs[0]
  }

  log('➕ Creating seed user', seedUserEmail)
  return (await payload.create({
    collection: 'users',
    data: {
      email: seedUserEmail,
      password: 'ChangeMe123!',
      name: 'Seed Admin',
      role: 'admin',
    },
    overrideAccess: true,
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

async function seed() {
  process.env.PAYLOAD_CONFIG_PATH = path.resolve(process.cwd(), 'src/payload.config.ts')

  const payload = await getPayload({
    config: import(process.env.PAYLOAD_CONFIG_PATH),
  })

  const user = await ensureUser(payload)

  const tags = await Promise.all([
    ensureTag(payload, { name: 'Kinder', category: 'target', color: '#7CB92C' }),
    ensureTag(payload, { name: 'Jugendliche', category: 'target', color: '#FFAA33' }),
    ensureTag(payload, { name: 'Erwachsene', category: 'target', color: '#3366CC' }),
    ensureTag(payload, { name: 'Begegnung & Party', category: 'topic', color: '#F97316' }),
    ensureTag(payload, { name: 'Musik & Gesang', category: 'topic', color: '#8B5CF6' }),
    ensureTag(payload, { name: 'Antirassismus & Empowerment', category: 'topic', color: '#0EA5E9' }),
    ensureTag(payload, { name: 'Einmalig', category: 'format', color: '#6366F1' }),
    ensureTag(payload, { name: 'Regelmäßig', category: 'format', color: '#EC4899' }),
  ])

  const tagByName = Object.fromEntries(tags.map((tag) => [tag.name, tag]))

  const organization = await ensureOrganization(payload, {
    name: 'Stephans Nachbarschaftsladen',
    email: 'kontakt@stephans.example',
    ownerId: user.id,
    contactPerson: 'S. Beispiel',
    website: 'https://stephans.example',
    phone: '+49 30 1234567',
  })

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
