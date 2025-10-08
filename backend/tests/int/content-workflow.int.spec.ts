// @vitest-environment node

import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { getPayload, Payload } from 'payload'
import configPromise from '@/payload.config'
import { POST as registerPOST } from '@/app/api/users/register/route'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const TEST_DATABASE_URI = process.env.TEST_DATABASE_URI ?? 'mongodb://127.0.0.1:27017/moafinder-test'

let payload: Payload
let createdUser: any
let adminUser: any
let organization: any
let location: any
let tag: any
let mediaOne: any
let mediaTwo: any
let createdEvent: any
const tempFiles: string[] = []

const createTempImage = (filename: string) => {
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
  const buffer = Buffer.from(base64, 'base64')
  const filePath = path.join(os.tmpdir(), `${Date.now()}-${filename}`)
  fs.writeFileSync(filePath, buffer)
  tempFiles.push(filePath)
  return filePath
}

describe('Content workflow', () => {
  beforeAll(async () => {
    process.env.DATABASE_URI = TEST_DATABASE_URI
    const config = await configPromise
    payload = await getPayload({ config })
    await payload.db.client?.db().dropDatabase()
  })

  afterAll(async () => {
    await payload?.db.client?.db().dropDatabase()
    await payload?.db.client?.close()
    tempFiles.forEach((file) => {
      try {
        fs.unlinkSync(file)
      } catch (error) {
        // ignore cleanup errors
      }
    })
  })

  it('registers organizer and creates linked organization', async () => {
    const email = `test-${Date.now()}@example.com`
    const response = await registerPOST(
      new Request('http://localhost/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Integration Tester',
          email,
          password: 'TestPass123!',
        }),
      }),
    )

    expect(response.status).toBe(201)
    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
    })
    expect(users.totalDocs).toBe(1)
    createdUser = users.docs[0]

    const organizations = await payload.find({
      collection: 'organizations',
      where: { owner: { equals: createdUser.id } },
    })
    expect(organizations.totalDocs).toBe(1)
    organization = organizations.docs[0]

    expect(organization.email).toBe(email)
    expect(getId(organization.owner)).toBe(createdUser.id)
  })

  it('creates an admin user', async () => {
    const response = await payload.create({
      collection: 'users',
      data: {
        name: 'Admin Tester',
        email: `admin-${Date.now()}@example.com`,
        password: 'AdminPass123!',
        role: 'admin',
      },
      overrideAccess: true,
      user: {
        role: 'admin',
        id: 'integration-admin',
      },
    })
    expect(response.role).toBe('admin')
    adminUser = response
  })

  it('creates supporting records (location, tag, media)', async () => {
    location = await payload.create({
      collection: 'locations',
      overrideAccess: true,
      data: {
        name: 'Test Location',
        shortName: 'TestOrt',
        description: 'Ort für Tests',
        address: {
          street: 'Teststraße',
          number: '1',
          postalCode: '10555',
          city: 'Berlin',
        },
      },
    })
    expect(location.name).toBe('Test Location')

    tag = await payload.create({
      collection: 'tags',
      overrideAccess: true,
      data: {
        name: 'Kultur',
        slug: `kultur-${Date.now()}`,
        category: 'topic',
        color: '#7CB92C',
      },
    })
    expect(tag.name).toBe('Kultur')

    const filePath1 = createTempImage('media-one.png')
    mediaOne = await payload.create({
      collection: 'media',
      filePath: filePath1,
      data: { alt: 'Testbild 1' },
      user: createdUser,
    })
    expect(getId(mediaOne.owner)).toBe(createdUser.id)

    const filePath2 = createTempImage('media-two.png')
    mediaTwo = await payload.create({
      collection: 'media',
      filePath: filePath2,
      data: { alt: 'Testbild 2' },
      user: createdUser,
    })
  })

  it('creates a single event draft', async () => {
    const now = new Date()
    createdEvent = await payload.create({
      collection: 'events',
      user: createdUser,
      data: {
        title: 'Test Veranstaltung',
        description: 'Beschreibung für das Event',
        eventType: 'einmalig',
        startDate: now.toISOString(),
        location: location.id,
        organizer: organization.id,
        image: mediaOne.id,
        tags: [tag.id],
        cost: { isFree: true },
        registration: { required: false },
        status: 'draft',
      },
    })

    expect(getId(createdEvent.organizer)).toBe(organization.id)
    expect(createdEvent.status).toBe('draft')
  })

  it('updates the event and submits for approval', async () => {
    const updated = await payload.update({
      collection: 'events',
      id: createdEvent.id,
      user: createdUser,
      data: {
        title: 'Aktualisierte Veranstaltung',
        image: mediaTwo.id,
        status: 'pending',
      },
    })

    expect(updated.title).toBe('Aktualisierte Veranstaltung')
    expect(getId(updated.image)).toBe(mediaTwo.id)
    expect(updated.status).toBe('pending')
    createdEvent = updated
  })

  it('admin approves organization and event, deletes media', async () => {
    expect(adminUser).toBeDefined()

    const approvedOrg = await payload.update({
      collection: 'organizations',
      id: organization.id,
      user: adminUser,
      data: { approved: true },
      overrideAccess: false,
    })
    expect(approvedOrg.approved).toBe(true)

    const approvedEvent = await payload.update({
      collection: 'events',
      id: createdEvent.id,
      user: adminUser,
      data: { status: 'approved' },
      overrideAccess: false,
    })
    expect(approvedEvent.status).toBe('approved')

    await payload.delete({
      collection: 'media',
      id: mediaOne.id,
      user: adminUser,
      overrideAccess: false,
    })
    const removed = await payload.find({
      collection: 'media',
      where: { id: { equals: mediaOne.id } },
      overrideAccess: true,
    })
    expect(removed.totalDocs).toBe(0)

    const users = await payload.find({
      collection: 'users',
      user: adminUser,
      limit: 10,
    })
    expect(users.totalDocs).toBeGreaterThanOrEqual(2)
  })

  it('creates a recurring weekly event', async () => {
    const weekly = await payload.create({
      collection: 'events',
      user: createdUser,
      data: {
        title: 'Wöchentliche Reihe',
        description: 'Findet jede Woche statt',
        eventType: 'wöchentlich',
        startDate: new Date().toISOString(),
        recurrence: {
          daysOfWeek: ['mon', 'wed'],
          repeatUntil: new Date(Date.now() + 14 * 86400000).toISOString(),
        },
        location: location.id,
        organizer: organization.id,
        status: 'pending',
      },
    })

    expect(weekly.recurrence?.daysOfWeek).toEqual(['mon', 'wed'])
    expect(weekly.eventType).toBe('wöchentlich')
  })

  it('archives and deletes events', async () => {
    const archived = await payload.update({
      collection: 'events',
      id: createdEvent.id,
      user: createdUser,
      data: { status: 'archived' },
    })
    expect(archived.status).toBe('archived')

    await payload.delete({ collection: 'events', id: createdEvent.id, user: createdUser })
    const remaining = await payload.find({
      collection: 'events',
      where: { id: { equals: createdEvent.id } },
    })
    expect(remaining.totalDocs).toBe(0)
  })
})
const getId = (value: unknown) => {
  if (!value) return value
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value && 'id' in value) {
    return (value as { id: string }).id
  }
  return value
}
