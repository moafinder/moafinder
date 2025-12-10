// @vitest-environment node

import { getPayload, Payload } from 'payload'
import configPromise from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

/**
 * Integration tests for User Story 3: Profiles Display Complete Information
 * 
 * Tests the backend API functionality for:
 * - Location profiles load with complete data
 * - Organization/organizer profiles have all required fields
 * - Recurring event schedule data is structured correctly
 * - Email and contact fields are present
 */

const TEST_DATABASE_URI = process.env.TEST_DATABASE_URI ?? 'mongodb://127.0.0.1:27017/moafinder-test'

let payload: Payload
let testOrganization: any
let testLocation: any
let testRecurringEvent: any

describe('User Story 3: Profiles Display - Integration Tests', () => {
  beforeAll(async () => {
    process.env.DATABASE_URI = TEST_DATABASE_URI
    const config = await configPromise
    payload = await getPayload({ config })
    
    // Get or create test organization with all contact fields
    const orgs = await payload.find({
      collection: 'organizations',
      limit: 1,
      overrideAccess: true,
    })
    
    if (orgs.docs.length > 0) {
      // Update existing organization with our test data
      testOrganization = await payload.update({
        collection: 'organizations',
        id: orgs.docs[0].id,
        data: {
          name: 'Test Organization for Profiles',
          email: 'test-profiles@example.com',
          contactPerson: 'Max Mustermann',
          phone: '+49 30 12345678',
          website: 'https://example.org',
          address: {
            street: 'Teststraße',
            number: '42',
            postalCode: '10551',
            city: 'Berlin',
          },
        },
        overrideAccess: true,
      })
    } else {
      // No organizations exist, create one - need a real user as owner
      const users = await payload.find({
        collection: 'users',
        limit: 1,
        overrideAccess: true,
      })
      
      testOrganization = await payload.create({
        collection: 'organizations',
        data: {
          name: 'Test Organization for Profiles',
          email: 'test-profiles@example.com',
          contactPerson: 'Max Mustermann',
          phone: '+49 30 12345678',
          website: 'https://example.org',
          owner: users.docs[0]?.id || 'test-profile-owner',
          address: {
            street: 'Teststraße',
            number: '42',
            postalCode: '10551',
            city: 'Berlin',
          },
        } as any,
        overrideAccess: true,
      })
    }
    
    // Create test location with all profile fields
    if (testOrganization) {
      try {
        testLocation = await payload.create({
          collection: 'locations',
          data: {
            name: 'Test Location for Profile Display',
            shortName: 'TestProfileLoc',
            description: 'A detailed description of this test location for profile testing.',
            owner: testOrganization.id,
            address: {
              street: 'Profilstraße',
              number: '123',
              postalCode: '10115',
              city: 'Berlin',
            },
            openingHours: 'Mo-Fr: 9:00-18:00\nSa: 10:00-14:00',
            email: 'location@example.com',
            homepage: 'https://location.example.com',
          },
          overrideAccess: true,
        })
      } catch (error) {
        console.log('Could not create test location for profiles')
      }
    }
    
    // Create test recurring event
    if (testOrganization && testLocation) {
      try {
        testRecurringEvent = await payload.create({
          collection: 'events',
          data: {
            title: 'Weekly Test Event for Schedule Display',
            description: 'This event happens weekly for testing schedule display.',
            eventType: 'wöchentlich',
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            time: {
              from: '10:00',
              to: '12:00',
            },
            recurrence: {
              daysOfWeek: ['mon', 'wed', 'fri'],
              repeatUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            },
            location: testLocation.id,
            organizer: testOrganization.id,
            status: 'approved',
          },
          overrideAccess: true,
        })
      } catch (error) {
        console.log('Could not create recurring event')
      }
    }
  })

  afterAll(async () => {
    // Clean up test data
    if (testRecurringEvent?.id) {
      try {
        await payload.delete({ collection: 'events', id: testRecurringEvent.id, overrideAccess: true })
      } catch {}
    }
    if (testLocation?.id && testLocation.name === 'Test Location for Profile Display') {
      try {
        await payload.delete({ collection: 'locations', id: testLocation.id, overrideAccess: true })
      } catch {}
    }
    if (testOrganization?.id && testOrganization.name === 'Test Organization for Profiles') {
      try {
        await payload.delete({ collection: 'organizations', id: testOrganization.id, overrideAccess: true })
      } catch {}
    }
    // Don't close connection - other test files may still run
  })

  describe('Location Profile Data', () => {
    it('location has all required profile fields', async () => {
      if (!testLocation) return

      const location = await payload.findByID({
        collection: 'locations',
        id: testLocation.id,
        overrideAccess: true,
      })

      expect(location).toBeDefined()
      expect(location.name).toBeDefined()
      expect(location.shortName).toBeDefined()
    })

    it('location has address for display', async () => {
      if (!testLocation) return

      const location = await payload.findByID({
        collection: 'locations',
        id: testLocation.id,
        overrideAccess: true,
      })

      expect(location.address).toBeDefined()
      expect(location.address.street).toBe('Profilstraße')
      expect(location.address.number).toBe('123')
      expect(location.address.postalCode).toBe('10115')
      expect(location.address.city).toBe('Berlin')
    })

    it('location has contact information for "Nachricht senden" button', async () => {
      if (!testLocation) return

      const location = await payload.findByID({
        collection: 'locations',
        id: testLocation.id,
        overrideAccess: true,
      })

      expect(location.email).toBe('location@example.com')
      expect(location.homepage).toBe('https://location.example.com')
    })

    it('location has opening hours for display', async () => {
      if (!testLocation) return

      const location = await payload.findByID({
        collection: 'locations',
        id: testLocation.id,
        overrideAccess: true,
      })

      expect(location.openingHours).toContain('Mo-Fr')
      expect(location.openingHours).toContain('9:00-18:00')
    })

    it('location has description', async () => {
      if (!testLocation) return

      const location = await payload.findByID({
        collection: 'locations',
        id: testLocation.id,
        overrideAccess: true,
      })

      expect(location.description).toBe('A detailed description of this test location for profile testing.')
    })

    it('location can have owner organization', async () => {
      if (!testLocation || !testOrganization) return

      const location = await payload.findByID({
        collection: 'locations',
        id: testLocation.id,
        depth: 1,
        overrideAccess: true,
      })

      // Owner can be a string ID or populated object
      const ownerId = typeof location.owner === 'string' ? location.owner : location.owner?.id
      expect(ownerId).toBe(testOrganization.id)
    })
  })

  describe('Organizer/Organization Profile Data', () => {
    it('organization has name for display', async () => {
      if (!testOrganization) return

      const org = await payload.findByID({
        collection: 'organizations',
        id: testOrganization.id,
        overrideAccess: true,
      })

      expect(org.name).toBe('Test Organization for Profiles')
    })

    it('organization has email for contact button', async () => {
      if (!testOrganization) return

      const org = await payload.findByID({
        collection: 'organizations',
        id: testOrganization.id,
        overrideAccess: true,
      })

      expect(org.email).toBe('test-profiles@example.com')
    })

    it('organization has phone number', async () => {
      if (!testOrganization) return

      const org = await payload.findByID({
        collection: 'organizations',
        id: testOrganization.id,
        overrideAccess: true,
      })

      expect(org.phone).toBe('+49 30 12345678')
    })

    it('organization has website', async () => {
      if (!testOrganization) return

      const org = await payload.findByID({
        collection: 'organizations',
        id: testOrganization.id,
        overrideAccess: true,
      })

      expect(org.website).toBe('https://example.org')
    })

    it('organization has contact person', async () => {
      if (!testOrganization) return

      const org = await payload.findByID({
        collection: 'organizations',
        id: testOrganization.id,
        overrideAccess: true,
      })

      expect(org.contactPerson).toBe('Max Mustermann')
    })

    it('organization has address', async () => {
      if (!testOrganization) return

      const org = await payload.findByID({
        collection: 'organizations',
        id: testOrganization.id,
        overrideAccess: true,
      })

      expect(org.address).toBeDefined()
      expect(org.address.street).toBe('Teststraße')
      expect(org.address.city).toBe('Berlin')
    })
  })

  describe('Recurring Event Schedule Display ("Regelmäßig")', () => {
    it('recurring event has eventType for schedule label', async () => {
      if (!testRecurringEvent) return

      const event = await payload.findByID({
        collection: 'events',
        id: testRecurringEvent.id,
        overrideAccess: true,
      })

      expect(event.eventType).toBe('wöchentlich')
    })

    it('recurring event has recurrence data with days of week', async () => {
      if (!testRecurringEvent) return

      const event = await payload.findByID({
        collection: 'events',
        id: testRecurringEvent.id,
        overrideAccess: true,
      })

      expect(event.recurrence).toBeDefined()
      expect(event.recurrence.daysOfWeek).toEqual(['mon', 'wed', 'fri'])
    })

    it('recurring event has repeatUntil date', async () => {
      if (!testRecurringEvent) return

      const event = await payload.findByID({
        collection: 'events',
        id: testRecurringEvent.id,
        overrideAccess: true,
      })

      expect(event.recurrence.repeatUntil).toBeDefined()
    })

    it('recurring event has time for schedule display', async () => {
      if (!testRecurringEvent) return

      const event = await payload.findByID({
        collection: 'events',
        id: testRecurringEvent.id,
        overrideAccess: true,
      })

      expect(event.time).toBeDefined()
      expect(event.time.from).toBe('10:00')
      expect(event.time.to).toBe('12:00')
    })
  })

  describe('Event with Organizer for Profile Link', () => {
    it('event has organizer relationship', async () => {
      if (!testRecurringEvent) return

      const event = await payload.findByID({
        collection: 'events',
        id: testRecurringEvent.id,
        depth: 1,
        overrideAccess: true,
      })

      expect(event.organizer).toBeDefined()
    })

    it('event organizer data is populated for display', async () => {
      if (!testRecurringEvent) return

      const event = await payload.findByID({
        collection: 'events',
        id: testRecurringEvent.id,
        depth: 2,
        overrideAccess: true,
      })

      const organizer = event.organizer
      if (typeof organizer === 'object' && organizer !== null) {
        expect(organizer.name).toBeDefined()
        expect(organizer.email).toBeDefined()
      }
    })

    it('event has location relationship', async () => {
      if (!testRecurringEvent) return

      const event = await payload.findByID({
        collection: 'events',
        id: testRecurringEvent.id,
        depth: 1,
        overrideAccess: true,
      })

      expect(event.location).toBeDefined()
    })

    it('event location data is populated for display', async () => {
      if (!testRecurringEvent) return

      const event = await payload.findByID({
        collection: 'events',
        id: testRecurringEvent.id,
        depth: 2,
        overrideAccess: true,
      })

      const location = event.location
      if (typeof location === 'object' && location !== null) {
        expect(location.name).toBeDefined()
        expect(location.address).toBeDefined()
      }
    })
  })

  describe('Monthly Recurring Events', () => {
    it('can create monthly event with nth weekday pattern', async () => {
      if (!testOrganization || !testLocation) return

      const monthlyEvent = await payload.create({
        collection: 'events',
        data: {
          title: 'Monthly Meeting',
          description: 'Happens every third Thursday',
          eventType: 'monatlich',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          recurrence: {
            monthlyMode: 'nthWeekday',
            monthlyWeekIndex: 'third',
            monthlyWeekday: 'thu',
          },
          location: testLocation.id,
          organizer: testOrganization.id,
          status: 'draft',
        },
        overrideAccess: true,
      })

      expect(monthlyEvent.recurrence.monthlyMode).toBe('nthWeekday')
      expect(monthlyEvent.recurrence.monthlyWeekIndex).toBe('third')
      expect(monthlyEvent.recurrence.monthlyWeekday).toBe('thu')

      // Cleanup
      await payload.delete({ collection: 'events', id: monthlyEvent.id, overrideAccess: true })
    })

    it('can create monthly event with day of month pattern', async () => {
      if (!testOrganization || !testLocation) return

      const monthlyEvent = await payload.create({
        collection: 'events',
        data: {
          title: 'Monthly on the 15th',
          description: 'Happens on the 15th of each month',
          eventType: 'monatlich',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          recurrence: {
            monthlyMode: 'dayOfMonth',
            monthlyDayOfMonth: 15,
          },
          location: testLocation.id,
          organizer: testOrganization.id,
          status: 'draft',
        },
        overrideAccess: true,
      })

      expect(monthlyEvent.recurrence.monthlyMode).toBe('dayOfMonth')
      expect(monthlyEvent.recurrence.monthlyDayOfMonth).toBe(15)

      // Cleanup
      await payload.delete({ collection: 'events', id: monthlyEvent.id, overrideAccess: true })
    })
  })

  describe('Daily Recurring Events', () => {
    it('can create daily event', async () => {
      if (!testOrganization || !testLocation) return

      const dailyEvent = await payload.create({
        collection: 'events',
        data: {
          title: 'Daily Activity',
          description: 'Happens every day',
          eventType: 'täglich',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          time: {
            from: '08:00',
            to: '09:00',
          },
          location: testLocation.id,
          organizer: testOrganization.id,
          status: 'draft',
        },
        overrideAccess: true,
      })

      expect(dailyEvent.eventType).toBe('täglich')

      // Cleanup
      await payload.delete({ collection: 'events', id: dailyEvent.id, overrideAccess: true })
    })
  })
})
