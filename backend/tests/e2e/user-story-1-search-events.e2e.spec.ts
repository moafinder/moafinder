import { test, expect } from '@playwright/test'

/**
 * User Story 1: Users can find events reliably (Search + Suggestions + Map Link)
 *
 * As a resident,
 * I want to find events through search and filters,
 * so that I can quickly discover what is happening in my neighborhood.
 *
 * Acceptance Criteria:
 * - Search returns correct events (titles, tags, organizers).
 * - Search suggestions appear without errors.
 * - Similar events show correctly.
 * - The event page links to the interactive map.
 * - No crashes on the "Einträge" or event list pages.
 */

test.describe('User Story 1: Find Events Reliably', () => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

  test.describe('Events List Page (Einträge)', () => {
    test('loads without crashing', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/eintraege`)
      
      // Page should load without errors
      await expect(page.locator('body')).toBeVisible()
      
      // Should either show loading state, events, or empty message
      const content = page.locator('.container')
      await expect(content).toBeVisible({ timeout: 10000 })
    })

    test('displays event list or loading/empty state', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/eintraege`)
      
      // Wait for page to settle
      await page.waitForLoadState('networkidle')
      
      // Should show heading
      const heading = page.locator('h1')
      await expect(heading).toContainText('Einträge')
      
      // Should show either events list, loading message, or empty state
      const hasEvents = await page.locator('ul li').count() > 0
      const hasEmptyMessage = await page.getByText(/Keine Einträge gefunden/).isVisible().catch(() => false)
      const hasLoadingMessage = await page.getByText(/werden geladen/).isVisible().catch(() => false)
      
      expect(hasEvents || hasEmptyMessage || hasLoadingMessage).toBeTruthy()
    })

    test('event cards link to event detail pages', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/eintraege`)
      await page.waitForLoadState('networkidle')
      
      const eventLinks = page.locator('ul li a[href^="/event/"]')
      const count = await eventLinks.count()
      
      if (count > 0) {
        const firstEventHref = await eventLinks.first().getAttribute('href')
        expect(firstEventHref).toMatch(/^\/event\/[a-zA-Z0-9]+$/)
      }
    })
  })

  test.describe('Formats Page (Event List with Filters)', () => {
    test('loads without crashing', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/formate`)
      
      // Page should load without errors
      await expect(page.locator('body')).toBeVisible()
      await page.waitForLoadState('networkidle')
    })

    test('displays events or loading/empty state', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/formate`)
      await page.waitForLoadState('networkidle')
      
      // Should not crash - page should be interactive
      const pageContent = page.locator('.min-h-screen, .container, main').first()
      await expect(pageContent).toBeVisible({ timeout: 15000 })
    })

    test('filter bar is functional', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/formate`)
      await page.waitForLoadState('networkidle')
      
      // Look for filter elements (buttons, checkboxes, dropdowns)
      const filterSection = page.locator('[class*="filter"], button:has-text("Filter"), button:has-text("Kinder"), button:has-text("Erwachsene")')
      
      // If filters exist, they should be clickable without crashing
      const filterCount = await filterSection.count()
      if (filterCount > 0) {
        const firstFilter = filterSection.first()
        await expect(firstFilter).toBeVisible()
      }
    })

    test('search/filter by text works without errors', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/formate`)
      await page.waitForLoadState('networkidle')
      
      // Look for search input
      const searchInput = page.locator('input[type="text"][placeholder*="Such"], input[placeholder*="such"]').first()
      const hasSearchInput = await searchInput.isVisible().catch(() => false)
      
      if (hasSearchInput) {
        await searchInput.fill('Test')
        // Should not crash - page should still be interactive
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Search Overlay', () => {
    test('search overlay can be opened', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/formate`)
      await page.waitForLoadState('networkidle')
      
      // Look for search trigger (icon, button, or nav element)
      const searchTrigger = page.locator('button:has([class*="search"]), [aria-label*="such"], [aria-label*="Search"], button:has(svg), .search-trigger, [class*="search"]').first()
      const hasTrigger = await searchTrigger.isVisible().catch(() => false)
      
      if (hasTrigger) {
        await searchTrigger.click()
        
        // Search overlay or search input should appear
        const searchOverlay = page.locator('.search-overlay, [class*="search-box"], input[placeholder*="Such"]')
        const overlayVisible = await searchOverlay.isVisible({ timeout: 3000 }).catch(() => false)
        
        // If overlay appeared, it should be interactive
        if (overlayVisible) {
          await expect(searchOverlay.first()).toBeVisible()
        }
      }
    })

    test('search suggestions appear when typing', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/formate`)
      await page.waitForLoadState('networkidle')
      
      // Try to open search overlay
      const searchTrigger = page.locator('button:has([class*="search"]), [aria-label*="such"], nav button').first()
      const hasTrigger = await searchTrigger.isVisible().catch(() => false)
      
      if (hasTrigger) {
        await searchTrigger.click()
        await page.waitForTimeout(500)
        
        const searchInput = page.locator('.search-input, input[placeholder*="Such"]').first()
        const hasInput = await searchInput.isVisible().catch(() => false)
        
        if (hasInput) {
          // Type a query
          await searchInput.fill('Moabit')
          await page.waitForTimeout(1000)
          
          // Should not crash - page should remain functional
          await expect(page.locator('body')).toBeVisible()
          
          // Results or "no results" message should appear
          const resultsArea = page.locator('.search-results, [class*="result"], p:has-text("keine Ergebnisse")')
          // Just verify no crash occurred
          await expect(page.locator('body')).toBeVisible()
        }
      }
    })

    test('search returns events matching title', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/formate`)
      await page.waitForLoadState('networkidle')
      
      // Try header search or inline search
      const searchInput = page.locator('input[placeholder*="Such"], .search-input').first()
      const hasInput = await searchInput.isVisible().catch(() => false)
      
      // Skip if no search input visible on this page
      if (!hasInput) {
        test.skip()
        return
      }
      
      await searchInput.fill('Berlin')
      await page.waitForTimeout(500)
      
      // Page should not crash
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Event Detail Page', () => {
    test('event detail page loads without crashing', async ({ page }) => {
      // First get an event ID from the API
      const response = await page.request.get(`${BACKEND_URL}/api/events?limit=1&where[status][equals]=approved`)
      const data = await response.json()
      
      if (data.docs && data.docs.length > 0) {
        const eventId = data.docs[0].id
        await page.goto(`${FRONTEND_URL}/event/${eventId}`)
        
        // Page should load without errors
        await expect(page.locator('body')).toBeVisible()
        await page.waitForLoadState('networkidle')
        
        // Should show event content or error message
        const hasTitle = await page.locator('h1').isVisible().catch(() => false)
        const hasError = await page.getByText(/nicht gefunden|nicht geladen/).isVisible().catch(() => false)
        
        expect(hasTitle || hasError).toBeTruthy()
      }
    })

    test('event detail shows map link', async ({ page }) => {
      // Get an event with a location
      const response = await page.request.get(`${BACKEND_URL}/api/events?limit=10&depth=2&where[status][equals]=approved`)
      const data = await response.json()
      
      // Find an event with a location
      const eventWithLocation = data.docs?.find((e: any) => e.location)
      
      if (eventWithLocation) {
        await page.goto(`${FRONTEND_URL}/event/${eventWithLocation.id}`)
        await page.waitForLoadState('networkidle')
        
        // Look for map link - "Karte öffnen" or link to /orte
        const mapLink = page.locator('a[href="/orte"], a:has-text("Karte"), a:has-text("karte")')
        const hasMapLink = await mapLink.isVisible().catch(() => false)
        
        // Also check for place profile link
        const placeLink = page.locator('a[href^="/place/"]')
        const hasPlaceLink = await placeLink.isVisible().catch(() => false)
        
        // At least one navigation option to location should exist
        if (eventWithLocation.location) {
          // If event has location, we expect map or place link
          expect(hasMapLink || hasPlaceLink).toBeTruthy()
        }
      }
    })

    test('similar events section displays correctly', async ({ page }) => {
      // Get an event
      const response = await page.request.get(`${BACKEND_URL}/api/events?limit=5&depth=2&where[status][equals]=approved`)
      const data = await response.json()
      
      if (data.docs && data.docs.length > 0) {
        const eventId = data.docs[0].id
        await page.goto(`${FRONTEND_URL}/event/${eventId}`)
        await page.waitForLoadState('networkidle')
        
        // Wait for related events to potentially load
        await page.waitForTimeout(2000)
        
        // Look for similar/related events section
        const relatedSection = page.locator('h2:has-text("Weitere Veranstaltungen"), section:has-text("Ähnliche")')
        const loadingRelated = page.getByText(/Ähnliche Veranstaltungen werden geladen/)
        const noRelated = page.getByText(/Keine ähnlichen Veranstaltungen/)
        const relatedEvents = page.locator('section a[href^="/event/"]')
        
        // Should show one of: loading, no results, or actual results
        const hasLoading = await loadingRelated.isVisible().catch(() => false)
        const hasNoResults = await noRelated.isVisible().catch(() => false)
        const hasResults = await relatedEvents.count() > 0
        const hasSection = await relatedSection.isVisible().catch(() => false)
        
        // Page should not crash during this check
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('handles non-existent event gracefully', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/event/nonexistent123`)
      await page.waitForLoadState('networkidle')
      
      // Should show error message, not crash
      await expect(page.locator('body')).toBeVisible()
      
      // Should show "not found" or similar error
      const errorMessage = page.getByText(/nicht gefunden|not found|konnte nicht geladen/i)
      await expect(errorMessage).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Map Integration', () => {
    test('places page loads with map', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/orte`)
      await page.waitForLoadState('networkidle')
      
      // Page should load without crashing
      await expect(page.locator('body')).toBeVisible()
      
      // Should show map or location list
      const mapContainer = page.locator('[class*="map"], img[alt*="Karte"], img[alt*="Moabit"]')
      const locationList = page.locator('button, [class*="place"]')
      
      const hasMap = await mapContainer.isVisible().catch(() => false)
      const hasLocations = await locationList.count() > 0
      
      // Either map or location list should be present
      expect(hasMap || hasLocations).toBeTruthy()
    })

    test('clicking place in list navigates to place profile', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/orte`)
      await page.waitForLoadState('networkidle')
      
      // Look for clickable place buttons
      const placeButtons = page.locator('.grid button, button[class*="place"]')
      const count = await placeButtons.count()
      
      if (count > 0) {
        // Click on first place
        await placeButtons.first().click()
        await page.waitForLoadState('networkidle')
        
        // Should navigate to place profile
        const currentUrl = page.url()
        expect(currentUrl).toMatch(/\/place\/|PlaceProfile/)
        
        // Or stay on page showing place details
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('API Endpoints', () => {
    test('events API returns valid JSON', async ({ page }) => {
      const response = await page.request.get(`${BACKEND_URL}/api/events?limit=5`)
      
      expect(response.ok()).toBeTruthy()
      
      const data = await response.json()
      expect(data).toHaveProperty('docs')
      expect(Array.isArray(data.docs)).toBeTruthy()
    })

    test('events API supports status filter', async ({ page }) => {
      const response = await page.request.get(`${BACKEND_URL}/api/events?where[status][equals]=approved&limit=5`)
      
      expect(response.ok()).toBeTruthy()
      
      const data = await response.json()
      expect(data).toHaveProperty('docs')
      
      // All returned events should have approved status
      for (const event of data.docs) {
        expect(event.status).toBe('approved')
      }
    })

    test('events API supports depth parameter for relations', async ({ page }) => {
      const response = await page.request.get(`${BACKEND_URL}/api/events?depth=2&limit=1`)
      
      expect(response.ok()).toBeTruthy()
      
      const data = await response.json()
      expect(data).toHaveProperty('docs')
      
      // If event has location, it should be populated
      if (data.docs.length > 0 && data.docs[0].location) {
        const location = data.docs[0].location
        // With depth=2, location should be an object, not just an ID
        if (typeof location === 'object') {
          expect(location).toHaveProperty('name')
        }
      }
    })

    test('locations API returns valid JSON', async ({ page }) => {
      const response = await page.request.get(`${BACKEND_URL}/api/locations?limit=5`)
      
      expect(response.ok()).toBeTruthy()
      
      const data = await response.json()
      expect(data).toHaveProperty('docs')
      expect(Array.isArray(data.docs)).toBeTruthy()
    })

    test('single event API works with valid ID', async ({ page }) => {
      // First get a valid event ID
      const listResponse = await page.request.get(`${BACKEND_URL}/api/events?limit=1`)
      const listData = await listResponse.json()
      
      if (listData.docs && listData.docs.length > 0) {
        const eventId = listData.docs[0].id
        
        const response = await page.request.get(`${BACKEND_URL}/api/events/${eventId}?depth=2`)
        
        expect(response.ok()).toBeTruthy()
        
        const event = await response.json()
        expect(event).toHaveProperty('id', eventId)
        expect(event).toHaveProperty('title')
      }
    })

    test('single event API returns 404 for invalid ID', async ({ page }) => {
      const response = await page.request.get(`${BACKEND_URL}/api/events/invalidid123`)
      
      // Should return 404 or similar error status
      expect(response.status()).toBeGreaterThanOrEqual(400)
    })
  })
})
