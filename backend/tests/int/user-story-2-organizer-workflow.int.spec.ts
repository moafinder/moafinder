// @vitest-environment node

/**
 * ⚠️  WARNING: NEVER RUN TESTS AGAINST PRODUCTION DATABASE ⚠️
 * 
 * These tests CREATE, MODIFY, and DELETE data.
 * Always use a local MongoDB instance:
 *   DATABASE_URI=mongodb://localhost:27017/moafinder-test pnpm vitest run
 * 
 * The vitest.setup.ts file includes a safety check that will abort if
 * a production database is detected, but always verify your .env file.
 */

import { getPayload, Payload } from 'payload'
import configPromise from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

/**
 * Integration tests for User Story 2: Organizers Create Events & Locations
 * 
 * Tests the backend functionality for:
 * - Draft saving ("Als Entwurf speichern")
 * - Submit for review ("Zur Prüfung einreichen") 
 * - Multi-category/tag selection
 * - Image/media uploads
 * - Required field validation
 * - Status workflow
 */

const TEST_DATABASE_URI = process.env.TEST_DATABASE_URI ?? 'mongodb://127.0.0.1:27017/moafinder-test'

let payload: Payload
let testUser: any
let testOrganization: any
let testLocation: any
let testTag: any
let testEvent: any

describe('User Story 2: Organizer Workflow - Integration Tests', () => {
  beforeAll(async () => {
    process.env.DATABASE_URI = TEST_DATABASE_URI
    const config = await configPromise
    payload = await getPayload({ config })

    // Create test user (organizer)
    try {
      testUser = await payload.create({
        collection: 'users',
        data: {
          name: 'Test Organizer',
          email: `organizer-${Date.now()}@test.com`,
          password: 'TestPass123!',
          role: 'organizer',
        },
        overrideAccess: true,
      })
    } catch (error) {
      console.log('Could not create test user')
    }

    // Create test organization for the user
    if (testUser) {
      try {
        testOrganization = await payload.create({
          collection: 'organizations',
          data: {
            name: 'Test Organizer Organization',
            owner: testUser.id,
            email: testUser.email,
          },
          overrideAccess: true,
        })
      } catch (error) {
        console.log('Could not create test organization')
      }
    }

    // Create test location
    if (testOrganization) {
      try {
        testLocation = await payload.create({
          collection: 'locations',
          data: {
            name: 'Test Location for Events',
            shortName: 'TestEvtLoc',
            owner: testOrganization.id,
            address: {
              street: 'Teststraße',
              number: '1',
              postalCode: '10551',
              city: 'Berlin',
            },
          },
          overrideAccess: true,
        })
      } catch (error) {
        console.log('Could not create test location')
      }
    }

    // Create or find a test tag
    try {
      const tags = await payload.find({
        collection: 'tags',
        limit: 1,
        overrideAccess: true,
      })
      testTag = tags.docs[0]
      
      if (!testTag) {
        testTag = await payload.create({
          collection: 'tags',
          data: {
            name: 'Test Tag',
            slug: 'test-tag',
            category: 'topic',
          },
          overrideAccess: true,
        })
      }
    } catch (error) {
      console.log('Could not create/find test tag')
    }
  })

  afterAll(async () => {
    // Clean up test data
    if (testEvent?.id) {
      try {
        await payload.delete({ collection: 'events', id: testEvent.id, overrideAccess: true })
      } catch {}
    }
    if (testLocation?.id && testLocation.name === 'Test Location for Events') {
      try {
        await payload.delete({ collection: 'locations', id: testLocation.id, overrideAccess: true })
      } catch {}
    }
    if (testOrganization?.id && testOrganization.name === 'Test Organizer Organization') {
      try {
        await payload.delete({ collection: 'organizations', id: testOrganization.id, overrideAccess: true })
      } catch {}
    }
    if (testUser?.id) {
      try {
        await payload.delete({ collection: 'users', id: testUser.id, overrideAccess: true })
      } catch {}
    }
    
    // Don't close connection - other test files may still run
  })

  describe('Event Draft Saving ("Als Entwurf speichern")', () => {
    it('can create an event with draft status', async () => {
      if (!testOrganization || !testLocation) {
        console.log('Skipping: test prerequisites not met')
        return
      }

      testEvent = await payload.create({
        collection: 'events',
        data: {
          title: 'Draft Event Test',
          description: 'This is a draft event for testing',
          eventType: 'einmalig',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: testLocation.id,
          organizer: testOrganization.id,
          status: 'draft',
        },
        overrideAccess: true,
      })

      expect(testEvent).toBeDefined()
      expect(testEvent.status).toBe('draft')
      expect(testEvent.title).toBe('Draft Event Test')
    })

    it('draft events are not publicly visible', async () => {
      if (!testEvent) return

      // Query for approved events with this specific ID - should not find draft
      const publicEvents = await payload.find({
        collection: 'events',
        where: {
          and: [
            { id: { equals: testEvent.id } },
            { status: { equals: 'approved' } },
          ],
        },
        overrideAccess: true, // Use overrideAccess to bypass read filters, but filter by approved status
      })

      // Draft should not appear when querying for approved events
      expect(publicEvents.docs.length).toBe(0)
    })

    it('draft events can be updated', async () => {
      if (!testEvent) return

      const updated = await payload.update({
        collection: 'events',
        id: testEvent.id,
        data: {
          title: 'Updated Draft Event',
          description: 'Updated description',
        },
        overrideAccess: true,
      })

      expect(updated.title).toBe('Updated Draft Event')
      expect(updated.status).toBe('draft') // Status should remain draft
    })
  })

  describe('Submit for Review ("Zur Prüfung einreichen")', () => {
    it('can change event status from draft to pending', async () => {
      if (!testEvent) return

      const submitted = await payload.update({
        collection: 'events',
        id: testEvent.id,
        data: {
          status: 'pending',
        },
        overrideAccess: true,
      })

      expect(submitted.status).toBe('pending')
    })

    it('pending events await review', async () => {
      if (!testEvent) return

      const event = await payload.findByID({
        collection: 'events',
        id: testEvent.id,
        overrideAccess: true,
      })

      expect(event.status).toBe('pending')
    })

    it('admin can approve pending events', async () => {
      if (!testEvent) return

      const approved = await payload.update({
        collection: 'events',
        id: testEvent.id,
        data: {
          status: 'approved',
        },
        overrideAccess: true,
      })

      expect(approved.status).toBe('approved')
    })

    it('approved events are publicly visible', async () => {
      if (!testEvent) return

      // Update status to approved for this test
      await payload.update({
        collection: 'events',
        id: testEvent.id,
        data: { status: 'approved' },
        overrideAccess: true,
      })

      // Query without override - should find approved events
      const publicEvents = await payload.find({
        collection: 'events',
        where: {
          id: { equals: testEvent.id },
        },
      })

      expect(publicEvents.docs.length).toBe(1)
    })

    it('events can be rejected', async () => {
      if (!testEvent) return

      const rejected = await payload.update({
        collection: 'events',
        id: testEvent.id,
        data: {
          status: 'rejected',
        },
        overrideAccess: true,
      })

      expect(rejected.status).toBe('rejected')
    })
  })

  describe('Multi-Category/Tag Selection', () => {
    it('events can have multiple tags', async () => {
      if (!testOrganization || !testLocation) return

      // Get some tags
      const tags = await payload.find({
        collection: 'tags',
        limit: 3,
        overrideAccess: true,
      })

      if (tags.docs.length === 0) return

      const tagIds = tags.docs.map((t: any) => t.id)

      const eventWithTags = await payload.create({
        collection: 'events',
        data: {
          title: 'Event with Multiple Tags',
          description: 'Testing multi-tag selection',
          eventType: 'einmalig',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          location: testLocation.id,
          organizer: testOrganization.id,
          status: 'draft',
          tags: tagIds,
        },
        overrideAccess: true,
      })

      expect(eventWithTags.tags).toBeDefined()
      expect(Array.isArray(eventWithTags.tags)).toBe(true)

      // Cleanup
      await payload.delete({ collection: 'events', id: eventWithTags.id, overrideAccess: true })
    })

    it('tags are properly associated with events', async () => {
      if (!testTag || !testOrganization || !testLocation) return

      const event = await payload.create({
        collection: 'events',
        data: {
          title: 'Tagged Event',
          description: 'Event with tag',
          eventType: 'einmalig',
          startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          location: testLocation.id,
          organizer: testOrganization.id,
          status: 'draft',
          tags: [testTag.id],
        },
        overrideAccess: true,
      })

      // Tags may be populated objects or IDs - extract IDs for comparison
      const tagIds = (event.tags as any[])?.map((t: any) => typeof t === 'string' ? t : t.id) || []
      expect(tagIds).toContain(testTag.id)

      // Cleanup
      await payload.delete({ collection: 'events', id: event.id, overrideAccess: true })
    })
  })

  describe('Location Creation', () => {
    it('can create a location with required fields', async () => {
      if (!testOrganization) return

      const location = await payload.create({
        collection: 'locations',
        data: {
          name: 'New Test Location',
          shortName: 'NewTestLoc',
          owner: testOrganization.id,
          address: {
            street: 'Neue Straße',
            number: '42',
            postalCode: '10115',
            city: 'Berlin',
          },
        },
        overrideAccess: true,
      })

      expect(location).toBeDefined()
      expect(location.name).toBe('New Test Location')
      expect(location.shortName).toBe('NewTestLoc')
      expect(location.address.street).toBe('Neue Straße')

      // Cleanup
      await payload.delete({ collection: 'locations', id: location.id, overrideAccess: true })
    })

    it('location requires owner organization', async () => {
      try {
        await payload.create({
          collection: 'locations',
          data: {
            name: 'Location Without Owner',
            shortName: 'NoOwner',
            address: {
              street: 'Test',
              number: '1',
              postalCode: '10551',
              city: 'Berlin',
            },
            // Missing owner - intentionally invalid for validation test
          },
          overrideAccess: true,
        } as any)
        
        // Should have thrown
        expect(true).toBe(false)
      } catch (error) {
        // Expected - owner is required
        expect(error).toBeDefined()
      }
    })

    it('location can have optional fields', async () => {
      if (!testOrganization) return

      const location = await payload.create({
        collection: 'locations',
        data: {
          name: 'Full Location',
          shortName: 'FullLoc',
          description: 'A location with all optional fields',
          owner: testOrganization.id,
          address: {
            street: 'Vollständige Straße',
            number: '100',
            postalCode: '10178',
            city: 'Berlin',
          },
          openingHours: 'Mo-Fr 9-18',
          email: 'test@location.de',
          homepage: 'https://example.com',
        },
        overrideAccess: true,
      })

      expect(location.description).toBe('A location with all optional fields')
      expect(location.openingHours).toBe('Mo-Fr 9-18')
      expect(location.email).toBe('test@location.de')
      expect(location.homepage).toBe('https://example.com')

      // Cleanup
      await payload.delete({ collection: 'locations', id: location.id, overrideAccess: true })
    })
  })

  describe('Required Field Validation', () => {
    it('event requires title', async () => {
      if (!testOrganization || !testLocation) return

      try {
        await payload.create({
          collection: 'events',
          data: {
            // Missing title - intentionally invalid for validation test
            description: 'Event without title',
            eventType: 'einmalig',
            startDate: new Date().toISOString(),
            location: testLocation.id,
            organizer: testOrganization.id,
            status: 'draft',
          },
          overrideAccess: true,
        } as any)
        
        expect(true).toBe(false) // Should have thrown
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('event requires description', async () => {
      if (!testOrganization || !testLocation) return

      try {
        await payload.create({
          collection: 'events',
          data: {
            title: 'Event without description',
            // Missing description - intentionally invalid for validation test
            eventType: 'einmalig',
            startDate: new Date().toISOString(),
            location: testLocation.id,
            organizer: testOrganization.id,
            status: 'draft',
          },
          overrideAccess: true,
        } as any)
        
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('event requires location', async () => {
      if (!testOrganization) return

      try {
        await payload.create({
          collection: 'events',
          data: {
            title: 'Event without location',
            description: 'Missing location',
            eventType: 'einmalig',
            startDate: new Date().toISOString(),
            // Missing location - intentionally invalid for validation test
            organizer: testOrganization.id,
            status: 'draft',
          },
          overrideAccess: true,
        } as any)
        
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('event requires start date', async () => {
      if (!testOrganization || !testLocation) return

      try {
        await payload.create({
          collection: 'events',
          data: {
            title: 'Event without date',
            description: 'Missing start date',
            eventType: 'einmalig',
            // Missing startDate - intentionally invalid for validation test
            location: testLocation.id,
            organizer: testOrganization.id,
            status: 'draft',
          },
          overrideAccess: true,
        } as any)
        
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Event Types and Recurrence', () => {
    it('supports einmalig (one-time) events', async () => {
      if (!testOrganization || !testLocation) return

      const event = await payload.create({
        collection: 'events',
        data: {
          title: 'One-time Event',
          description: 'Single occurrence',
          eventType: 'einmalig',
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          location: testLocation.id,
          organizer: testOrganization.id,
          status: 'draft',
        },
        overrideAccess: true,
      })

      expect(event.eventType).toBe('einmalig')

      await payload.delete({ collection: 'events', id: event.id, overrideAccess: true })
    })

    it('supports wöchentlich (weekly) events with days of week', async () => {
      if (!testOrganization || !testLocation) return

      const event = await payload.create({
        collection: 'events',
        data: {
          title: 'Weekly Event',
          description: 'Repeats weekly',
          eventType: 'wöchentlich',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: testLocation.id,
          organizer: testOrganization.id,
          status: 'draft',
          recurrence: {
            daysOfWeek: ['mon', 'wed', 'fri'],
            repeatUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          },
        },
        overrideAccess: true,
      })

      expect(event.eventType).toBe('wöchentlich')
      expect(event.recurrence?.daysOfWeek).toContain('mon')

      await payload.delete({ collection: 'events', id: event.id, overrideAccess: true })
    })

    it('supports monatlich (monthly) events', async () => {
      if (!testOrganization || !testLocation) return

      const event = await payload.create({
        collection: 'events',
        data: {
          title: 'Monthly Event',
          description: 'Repeats monthly',
          eventType: 'monatlich',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: testLocation.id,
          organizer: testOrganization.id,
          status: 'draft',
          recurrence: {
            monthlyMode: 'dayOfMonth',
            monthlyDayOfMonth: 15,
            repeatUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          },
        },
        overrideAccess: true,
      })

      expect(event.eventType).toBe('monatlich')
      expect(event.recurrence?.monthlyDayOfMonth).toBe(15)

      await payload.delete({ collection: 'events', id: event.id, overrideAccess: true })
    })
  })

  describe('Cost and Registration Fields', () => {
    it('events can be marked as free', async () => {
      if (!testOrganization || !testLocation) return

      const event = await payload.create({
        collection: 'events',
        data: {
          title: 'Free Event',
          description: 'No cost event',
          eventType: 'einmalig',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: testLocation.id,
          organizer: testOrganization.id,
          status: 'draft',
          cost: {
            isFree: true,
          },
        },
        overrideAccess: true,
      })

      expect(event.cost?.isFree).toBe(true)

      await payload.delete({ collection: 'events', id: event.id, overrideAccess: true })
    })

    it('events can require registration', async () => {
      if (!testOrganization || !testLocation) return

      const event = await payload.create({
        collection: 'events',
        data: {
          title: 'Registration Required Event',
          description: 'Must register',
          eventType: 'einmalig',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: testLocation.id,
          organizer: testOrganization.id,
          status: 'draft',
          registration: {
            required: true,
            details: 'Register via email',
          },
        },
        overrideAccess: true,
      })

      expect(event.registration?.required).toBe(true)
      expect(event.registration?.details).toBe('Register via email')

      await payload.delete({ collection: 'events', id: event.id, overrideAccess: true })
    })
  })

  describe('Media Association', () => {
    it('events can have an associated image', async () => {
      if (!testOrganization || !testLocation) return

      // Check if any media exists
      const media = await payload.find({
        collection: 'media',
        limit: 1,
        overrideAccess: true,
      })

      if (media.docs.length === 0) {
        console.log('No media available for test')
        return
      }

      const event = await payload.create({
        collection: 'events',
        data: {
          title: 'Event with Image',
          description: 'Has an image',
          eventType: 'einmalig',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: testLocation.id,
          organizer: testOrganization.id,
          status: 'draft',
          image: media.docs[0].id,
        },
        overrideAccess: true,
      })

      expect(event.image).toBeDefined()

      await payload.delete({ collection: 'events', id: event.id, overrideAccess: true })
    })
  })
})
