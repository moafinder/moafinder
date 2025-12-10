import { describe, it, expect, beforeAll } from 'vitest'
import { getPayload, type Payload } from 'payload'
import configPromise from '@payload-config'

/**
 * User Story 4: Calendar and navigation work smoothly on all devices
 * 
 * Integration tests for data-level concerns:
 * - Events have proper date/time fields for calendar display
 * - Locations have proper data for navigation
 * - Data structures support mobile-friendly rendering
 */

const TEST_DATABASE_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017/moafinder-test'

describe('User Story 4: Responsive Calendar and Navigation - Integration Tests', () => {
  let payload: Payload

  beforeAll(async () => {
    process.env.DATABASE_URI = TEST_DATABASE_URI
    const config = await configPromise
    payload = await getPayload({ config })
  })

  describe('Event Date/Time Fields for Calendar', () => {
    it('events have startDate field', async () => {
      const events = await payload.find({
        collection: 'events',
        limit: 1,
        overrideAccess: true,
      })

      if (events.docs.length > 0) {
        const event = events.docs[0]
        // startDate should be present for calendar display
        expect(event).toHaveProperty('startDate')
      }
    })

    it('events may have endDate field for multi-day events', async () => {
      const events = await payload.find({
        collection: 'events',
        limit: 10,
        overrideAccess: true,
      })

      // endDate is optional - check that schema supports it
      if (events.docs.length > 0) {
        // Verify the field can exist (some events may have it)
        const eventWithEndDate = events.docs.find(e => e.endDate)
        if (eventWithEndDate) {
          expect(typeof eventWithEndDate.endDate).toBe('string')
        }
        // Also check events without - should not error
        const eventWithoutEndDate = events.docs.find(e => !e.endDate)
        if (eventWithoutEndDate) {
          expect(eventWithoutEndDate.endDate).toBeFalsy()
        }
      }
    })

    it('events may have time group with from/to fields', async () => {
      const events = await payload.find({
        collection: 'events',
        limit: 10,
        overrideAccess: true,
      })

      // Time is optional - check that when present, it has proper structure
      const eventWithTime = events.docs.find(e => e.time && (e.time.from || e.time.to))
      
      if (eventWithTime) {
        // If time.from exists, it should be a string
        if (eventWithTime.time.from) {
          expect(typeof eventWithTime.time.from).toBe('string')
        }
        if (eventWithTime.time.to) {
          expect(typeof eventWithTime.time.to).toBe('string')
        }
      }
      
      // Events without time should not error
      const eventWithoutTime = events.docs.find(e => !e.time?.from && !e.time?.to)
      if (eventWithoutTime) {
        // Should handle missing time gracefully
        expect(eventWithoutTime.time?.from ?? null).toBeFalsy()
      }
    })

    it('events have eventType for recurring indicator', async () => {
      const events = await payload.find({
        collection: 'events',
        limit: 10,
        overrideAccess: true,
      })

      // All events should have eventType
      for (const event of events.docs) {
        expect(event).toHaveProperty('eventType')
        expect(['einmalig', 'wöchentlich', 'monatlich']).toContain(event.eventType)
      }
    })
  })

  describe('Location Data for Navigation', () => {
    it('locations have required fields for list display', async () => {
      const locations = await payload.find({
        collection: 'locations',
        limit: 5,
        overrideAccess: true,
      })

      for (const location of locations.docs) {
        // Required for navigation lists
        expect(location).toHaveProperty('id')
        expect(location).toHaveProperty('shortName')
        expect(location.shortName).toBeTruthy()
      }
    })

    it('locations have address for detail view', async () => {
      const locations = await payload.find({
        collection: 'locations',
        limit: 5,
        depth: 0,
        overrideAccess: true,
      })

      for (const location of locations.docs) {
        if (location.address) {
          expect(location.address).toHaveProperty('street')
          expect(location.address).toHaveProperty('city')
        }
      }
    })

    it('locations have mapPosition for interactive map', async () => {
      const locations = await payload.find({
        collection: 'locations',
        limit: 20,
        overrideAccess: true,
      })

      // At least some locations should have map positions
      const withMapPosition = locations.docs.filter(
        loc => loc.mapPosition?.x != null && loc.mapPosition?.y != null
      )
      
      // We expect map functionality to work if positions exist
      if (withMapPosition.length > 0) {
        const loc = withMapPosition[0]
        expect(typeof loc.mapPosition.x).toBe('number')
        expect(typeof loc.mapPosition.y).toBe('number')
        expect(loc.mapPosition.x).toBeGreaterThanOrEqual(0)
        expect(loc.mapPosition.x).toBeLessThanOrEqual(100)
        expect(loc.mapPosition.y).toBeGreaterThanOrEqual(0)
        expect(loc.mapPosition.y).toBeLessThanOrEqual(100)
      }
    })
  })

  describe('Tag Data for Filter Dropdowns', () => {
    it('tags have name for dropdown display', async () => {
      const tags = await payload.find({
        collection: 'tags',
        limit: 20,
        overrideAccess: true,
      })

      for (const tag of tags.docs) {
        expect(tag).toHaveProperty('name')
        expect(tag.name).toBeTruthy()
        expect(typeof tag.name).toBe('string')
      }
    })

    it('tags have category for grouping in filters', async () => {
      const tags = await payload.find({
        collection: 'tags',
        limit: 20,
        overrideAccess: true,
      })

      // Tags should have category for filter grouping
      // Values are 'target', 'topic', 'format' (not German labels)
      for (const tag of tags.docs) {
        expect(tag).toHaveProperty('category')
        expect(['target', 'topic', 'format']).toContain(tag.category)
      }
    })

    it('can group tags by category for dropdown menus', async () => {
      const tags = await payload.find({
        collection: 'tags',
        limit: 100,
        overrideAccess: true,
      })

      // Group by category
      const grouped = tags.docs.reduce((acc, tag) => {
        const cat = tag.category || 'Sonstiges'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(tag)
        return acc
      }, {} as Record<string, typeof tags.docs>)

      // Should have at least one category with tags
      const categories = Object.keys(grouped)
      expect(categories.length).toBeGreaterThan(0)
      
      // Each category should have tags
      for (const cat of categories) {
        expect(grouped[cat].length).toBeGreaterThan(0)
      }
    })
  })

  describe('Events with Location Relationship', () => {
    it('events can be fetched with location data for calendar', async () => {
      const events = await payload.find({
        collection: 'events',
        limit: 5,
        depth: 1, // Include related location
        overrideAccess: true,
      })

      for (const event of events.docs) {
        if (event.location && typeof event.location === 'object') {
          // Location should have display name
          expect(event.location).toHaveProperty('shortName')
        }
      }
    })

    it('events can be filtered by date range', async () => {
      const now = new Date()
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

      const events = await payload.find({
        collection: 'events',
        where: {
          startDate: {
            greater_than_equal: now.toISOString(),
            less_than_equal: futureDate.toISOString(),
          },
        },
        limit: 20,
        overrideAccess: true,
      })

      // All returned events should be in range
      for (const event of events.docs) {
        if (event.startDate) {
          const eventDate = new Date(event.startDate)
          expect(eventDate.getTime()).toBeGreaterThanOrEqual(now.getTime() - 1000)
          expect(eventDate.getTime()).toBeLessThanOrEqual(futureDate.getTime() + 1000)
        }
      }
    })
  })

  describe('Data Pagination for Mobile Performance', () => {
    it('events support pagination', async () => {
      const page1 = await payload.find({
        collection: 'events',
        limit: 5,
        page: 1,
        overrideAccess: true,
      })

      expect(page1).toHaveProperty('docs')
      expect(page1).toHaveProperty('totalDocs')
      expect(page1).toHaveProperty('totalPages')
      expect(page1).toHaveProperty('page')
      expect(page1).toHaveProperty('hasNextPage')
      expect(page1).toHaveProperty('hasPrevPage')
    })

    it('locations support pagination', async () => {
      const page1 = await payload.find({
        collection: 'locations',
        limit: 10,
        page: 1,
        overrideAccess: true,
      })

      expect(page1).toHaveProperty('docs')
      expect(page1).toHaveProperty('totalDocs')
      expect(page1).toHaveProperty('page')
    })

    it('can load limited data for mobile initial render', async () => {
      // Mobile should load fewer items initially
      const mobileLimit = 10
      
      const events = await payload.find({
        collection: 'events',
        limit: mobileLimit,
        depth: 1, // Minimal depth for faster load
        overrideAccess: true,
      })

      expect(events.docs.length).toBeLessThanOrEqual(mobileLimit)
    })
  })

  describe('Sort Options for Calendar View', () => {
    it('events can be sorted by startDate', async () => {
      const events = await payload.find({
        collection: 'events',
        sort: 'startDate',
        limit: 10,
        overrideAccess: true,
      })

      // Verify ascending order
      for (let i = 1; i < events.docs.length; i++) {
        const prev = events.docs[i - 1]
        const curr = events.docs[i]
        
        if (prev.startDate && curr.startDate) {
          const prevDate = new Date(prev.startDate).getTime()
          const currDate = new Date(curr.startDate).getTime()
          expect(currDate).toBeGreaterThanOrEqual(prevDate)
        }
      }
    })

    it('events can be sorted by startDate descending', async () => {
      const events = await payload.find({
        collection: 'events',
        sort: '-startDate',
        limit: 10,
        overrideAccess: true,
      })

      // Verify descending order
      for (let i = 1; i < events.docs.length; i++) {
        const prev = events.docs[i - 1]
        const curr = events.docs[i]
        
        if (prev.startDate && curr.startDate) {
          const prevDate = new Date(prev.startDate).getTime()
          const currDate = new Date(curr.startDate).getTime()
          expect(currDate).toBeLessThanOrEqual(prevDate)
        }
      }
    })

    it('locations can be sorted by shortName', async () => {
      const locations = await payload.find({
        collection: 'locations',
        sort: 'shortName',
        limit: 10,
        overrideAccess: true,
      })

      // Verify alphabetical order
      for (let i = 1; i < locations.docs.length; i++) {
        const prev = locations.docs[i - 1]
        const curr = locations.docs[i]
        
        if (prev.shortName && curr.shortName) {
          expect(curr.shortName.localeCompare(prev.shortName, 'de-DE')).toBeGreaterThanOrEqual(0)
        }
      }
    })
  })
})
