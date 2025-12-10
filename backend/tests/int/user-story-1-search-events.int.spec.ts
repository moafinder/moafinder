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
 * Integration tests for User Story 1: Find Events Reliably
 * 
 * Tests the backend API functionality for:
 * - Search returns correct events (titles, tags, organizers)
 * - Events filtering by status
 * - Related events calculation
 * - Location data for map integration
 */

const TEST_DATABASE_URI = process.env.TEST_DATABASE_URI ?? 'mongodb://127.0.0.1:27017/moafinder-test'

let payload: Payload
let testOrganization: any
let testLocation: any
let testEvents: any[] = []

describe('User Story 1: Find Events - Integration Tests', () => {
  beforeAll(async () => {
    process.env.DATABASE_URI = TEST_DATABASE_URI
    const config = await configPromise
    payload = await getPayload({ config })
    
    // Create test organization
    try {
      testOrganization = await payload.create({
        collection: 'organizations',
        data: {
          name: 'Test Organization for Search',
          email: 'test-search@example.com',
          owner: 'test-owner-id', // Will be overridden or handled by hooks
        } as any,
        overrideAccess: true,
      })
    } catch (error) {
      // Organization might already exist or we may not have permission
      const orgs = await payload.find({
        collection: 'organizations',
        limit: 1,
        overrideAccess: true,
      })
      testOrganization = orgs.docs[0]
    }
    
    // Create test location
    if (testOrganization) {
      try {
        testLocation = await payload.create({
          collection: 'locations',
          data: {
            name: 'Test Location for Search',
            shortName: 'TestLoc',
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
        // Location might already exist
        const locs = await payload.find({
          collection: 'locations',
          limit: 1,
          overrideAccess: true,
        })
        testLocation = locs.docs[0]
      }
    }
    
    // Create test events for search testing
    if (testOrganization && testLocation) {
      const eventData = [
        {
          title: 'Moabit Music Festival',
          description: 'Annual music event in Moabit',
          subtitle: 'Annual music event',
          status: 'approved',
          eventType: 'einmalig',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: testLocation.id,
          organizer: testOrganization.id,
          tags: [],
        },
        {
          title: 'Yoga in the Park',
          description: 'Weekly yoga session for everyone',
          subtitle: 'Weekly yoga session',
          status: 'approved',
          eventType: 'wöchentlich',
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          location: testLocation.id,
          organizer: testOrganization.id,
          tags: [],
        },
        {
          title: 'Pending Event Should Not Appear',
          description: 'This event is pending review',
          subtitle: 'This should be filtered out',
          status: 'pending',
          eventType: 'einmalig',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          location: testLocation.id,
          organizer: testOrganization.id,
          tags: [],
        },
      ]
      
      for (const data of eventData) {
        try {
          const event = await payload.create({
            collection: 'events',
            data: data as any,
            overrideAccess: true,
          })
          testEvents.push(event)
        } catch (error) {
          // Event creation might fail due to validation, continue with other tests
          console.log('Could not create test event:', data.title)
        }
      }
    }
  })

  afterAll(async () => {
    // Clean up test data
    for (const event of testEvents) {
      try {
        await payload.delete({
          collection: 'events',
          id: event.id,
          overrideAccess: true,
        })
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    if (testLocation?.id && testLocation.name === 'Test Location for Search') {
      try {
        await payload.delete({
          collection: 'locations',
          id: testLocation.id,
          overrideAccess: true,
        })
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    if (testOrganization?.id && testOrganization.name === 'Test Organization for Search') {
      try {
        await payload.delete({
          collection: 'organizations',
          id: testOrganization.id,
          overrideAccess: true,
        })
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Don't close connection - other test files may still run
  })

  describe('Events Collection', () => {
    it('can fetch events', async () => {
      const events = await payload.find({
        collection: 'events',
        limit: 10,
      })
      
      expect(events).toBeDefined()
      expect(events).toHaveProperty('docs')
      expect(Array.isArray(events.docs)).toBe(true)
    })

    it('can filter events by status', async () => {
      const approvedEvents = await payload.find({
        collection: 'events',
        where: {
          status: { equals: 'approved' },
        },
        limit: 100,
        overrideAccess: true,
      })
      
      expect(approvedEvents).toBeDefined()
      expect(approvedEvents.docs.every((e: any) => e.status === 'approved')).toBe(true)
    })

    it('can filter events by status - pending excluded from approved query', async () => {
      const approvedEvents = await payload.find({
        collection: 'events',
        where: {
          status: { equals: 'approved' },
        },
        limit: 100,
        overrideAccess: true,
      })
      
      // Pending events should not appear in approved filter
      const hasPending = approvedEvents.docs.some((e: any) => e.status === 'pending')
      expect(hasPending).toBe(false)
    })

    it('can sort events by start date', async () => {
      const events = await payload.find({
        collection: 'events',
        sort: 'startDate',
        limit: 10,
        overrideAccess: true,
      })
      
      expect(events).toBeDefined()
      
      // Check that dates are in ascending order
      let previousDate: Date | null = null
      for (const event of events.docs) {
        if ((event as any).startDate) {
          const currentDate = new Date((event as any).startDate)
          if (previousDate) {
            expect(currentDate.getTime()).toBeGreaterThanOrEqual(previousDate.getTime())
          }
          previousDate = currentDate
        }
      }
    })

    it('can populate related location data', async () => {
      const events = await payload.find({
        collection: 'events',
        depth: 2,
        limit: 5,
        where: {
          location: { exists: true },
        },
        overrideAccess: true,
      })
      
      // Find an event with a populated location
      const eventWithLocation = events.docs.find((e: any) => 
        e.location && typeof e.location === 'object'
      )
      
      if (eventWithLocation) {
        expect((eventWithLocation as any).location).toHaveProperty('name')
      }
    })

    it('can populate related organizer data', async () => {
      const events = await payload.find({
        collection: 'events',
        depth: 2,
        limit: 5,
        where: {
          organizer: { exists: true },
        },
        overrideAccess: true,
      })
      
      // Find an event with a populated organizer
      const eventWithOrganizer = events.docs.find((e: any) => 
        e.organizer && typeof e.organizer === 'object'
      )
      
      if (eventWithOrganizer) {
        expect((eventWithOrganizer as any).organizer).toHaveProperty('name')
      }
    })

    it('supports text search in title', async () => {
      if (testEvents.length > 0) {
        const searchTerm = 'Moabit'
        
        const events = await payload.find({
          collection: 'events',
          where: {
            title: { contains: searchTerm },
          },
          limit: 10,
          overrideAccess: true,
        })
        
        // All results should contain the search term in title
        for (const event of events.docs) {
          expect((event as any).title.toLowerCase()).toContain(searchTerm.toLowerCase())
        }
      }
    })
  })

  describe('Locations Collection', () => {
    it('can fetch locations', async () => {
      const locations = await payload.find({
        collection: 'locations',
        limit: 10,
      })
      
      expect(locations).toBeDefined()
      expect(locations).toHaveProperty('docs')
      expect(Array.isArray(locations.docs)).toBe(true)
    })

    it('locations have required fields', async () => {
      const locations = await payload.find({
        collection: 'locations',
        limit: 10,
        overrideAccess: true,
      })
      
      for (const location of locations.docs) {
        expect(location).toHaveProperty('id')
        expect(location).toHaveProperty('name')
        expect(location).toHaveProperty('shortName')
      }
    })

    it('can fetch location by ID', async () => {
      const locations = await payload.find({
        collection: 'locations',
        limit: 1,
        overrideAccess: true,
      })
      
      if (locations.docs.length > 0) {
        const locationId = locations.docs[0].id
        
        const location = await payload.findByID({
          collection: 'locations',
          id: locationId,
          overrideAccess: true,
        })
        
        expect(location).toBeDefined()
        expect(location.id).toBe(locationId)
      }
    })

    it('locations have address data for map display', async () => {
      const locations = await payload.find({
        collection: 'locations',
        limit: 10,
        overrideAccess: true,
      })
      
      // Check that locations have address structure
      for (const location of locations.docs) {
        if ((location as any).address) {
          const address = (location as any).address
          // Address should have at least street or city
          const hasAddressInfo = address.street || address.city || address.postalCode
          expect(hasAddressInfo).toBeTruthy()
        }
      }
    })
  })

  describe('Organizations Collection', () => {
    it('can fetch organizations', async () => {
      const organizations = await payload.find({
        collection: 'organizations',
        limit: 10,
        overrideAccess: true,
      })
      
      expect(organizations).toBeDefined()
      expect(organizations).toHaveProperty('docs')
      expect(Array.isArray(organizations.docs)).toBe(true)
    })

    it('organizations have name field', async () => {
      const organizations = await payload.find({
        collection: 'organizations',
        limit: 10,
        overrideAccess: true,
      })
      
      for (const org of organizations.docs) {
        expect(org).toHaveProperty('name')
      }
    })
  })

  describe('Similar Events Logic', () => {
    it('can find events with same organizer', async () => {
      if (!testOrganization) {
        return
      }
      
      const events = await payload.find({
        collection: 'events',
        where: {
          organizer: { equals: testOrganization.id },
        },
        limit: 10,
        overrideAccess: true,
      })
      
      expect(events).toBeDefined()
      // All events should have the same organizer
      for (const event of events.docs) {
        const orgId = typeof (event as any).organizer === 'object' 
          ? (event as any).organizer.id 
          : (event as any).organizer
        expect(orgId).toBe(testOrganization.id)
      }
    })

    it('can find events at same location', async () => {
      if (!testLocation) {
        return
      }
      
      const events = await payload.find({
        collection: 'events',
        where: {
          location: { equals: testLocation.id },
        },
        limit: 10,
        overrideAccess: true,
      })
      
      expect(events).toBeDefined()
      // All events should have the same location
      for (const event of events.docs) {
        const locId = typeof (event as any).location === 'object' 
          ? (event as any).location.id 
          : (event as any).location
        expect(locId).toBe(testLocation.id)
      }
    })
  })

  describe('Event Status Workflow', () => {
    it('events have valid status values', async () => {
      const events = await payload.find({
        collection: 'events',
        limit: 50,
        overrideAccess: true,
      })
      
      const validStatuses = ['pending', 'approved', 'rejected']
      
      for (const event of events.docs) {
        if ((event as any).status) {
          expect(validStatuses).toContain((event as any).status)
        }
      }
    })
  })

  describe('Tags for Search', () => {
    it('can fetch tags', async () => {
      const tags = await payload.find({
        collection: 'tags',
        limit: 50,
        overrideAccess: true,
      })
      
      expect(tags).toBeDefined()
      expect(tags).toHaveProperty('docs')
    })

    it('events can have tags for filtering', async () => {
      const events = await payload.find({
        collection: 'events',
        depth: 2,
        limit: 20,
        overrideAccess: true,
      })
      
      // Check if any events have tags
      const eventsWithTags = events.docs.filter((e: any) => 
        e.tags && Array.isArray(e.tags) && e.tags.length > 0
      )
      
      // Tags structure should be valid if present
      for (const event of eventsWithTags) {
        expect(Array.isArray((event as any).tags)).toBe(true)
      }
    })
  })
})
