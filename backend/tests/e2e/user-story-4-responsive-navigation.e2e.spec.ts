import { test, expect } from '@playwright/test'

/**
 * User Story 4: Calendar and navigation work smoothly on all devices
 * 
 * As a user on mobile or tablet,
 * I want to browse the calendar and events easily,
 * so that I can access MoaFinder anywhere.
 * 
 * Done when:
 * - Calendar opens on iPad without issues
 * - Navigation between pages is stable
 * - Dropdown menus are understandable (clear checkmark state)
 * - Homepage has no duplicated subtitles or overlapping elements
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

// Device viewports for testing
const VIEWPORTS = {
  mobile: { width: 375, height: 812 }, // iPhone X
  tablet: { width: 768, height: 1024 }, // iPad
  ipadPro: { width: 1024, height: 1366 }, // iPad Pro
  desktop: { width: 1280, height: 800 },
}

test.describe('User Story 4: Responsive Navigation and Calendar', () => {
  
  test.describe('Homepage Layout - No Duplicates', () => {
    test('homepage has no duplicate subtitles', async ({ page }) => {
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Check that there's only one header graphic
      const headerImages = await page.locator('img[alt="MoaFinder Banner"]').count()
      expect(headerImages).toBeLessThanOrEqual(1)
      
      // Check for duplicate text elements
      const pageContent = await page.textContent('body')
      const moabitMatches = pageContent?.match(/Meine Mitte ist Moabit/g) || []
      // Should have 0 or 1 occurrence (text may be in graphic)
      expect(moabitMatches.length).toBeLessThanOrEqual(1)
    })

    test('homepage has no overlapping elements on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile)
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Check filter bar is visible and not overlapping
      const filterBar = page.locator('.bg-white.p-4, .bg-white.p-6').first()
      if (await filterBar.isVisible()) {
        const box = await filterBar.boundingBox()
        expect(box).not.toBeNull()
        expect(box!.width).toBeGreaterThan(0)
        expect(box!.width).toBeLessThanOrEqual(VIEWPORTS.mobile.width)
      }
    })

    test('homepage has no overlapping elements on tablet', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.tablet)
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Filter buttons should wrap properly
      const filterButtons = page.locator('button.rounded-full')
      const count = await filterButtons.count()
      
      if (count > 0) {
        // Check first few buttons are visible and don't overflow
        for (let i = 0; i < Math.min(count, 3); i++) {
          const btn = filterButtons.nth(i)
          if (await btn.isVisible()) {
            const box = await btn.boundingBox()
            expect(box).not.toBeNull()
            expect(box!.x).toBeGreaterThanOrEqual(0)
            expect(box!.x + box!.width).toBeLessThanOrEqual(VIEWPORTS.tablet.width + 20) // Allow small margin
          }
        }
      }
    })
  })

  test.describe('Navigation Stability', () => {
    test('navigation between pages works on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile)
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Open mobile menu
      const menuButton = page.locator('button[aria-label*="Menü"]')
      if (await menuButton.isVisible()) {
        await menuButton.click()
        await page.waitForTimeout(300)
      }
      
      // Navigate to Orte
      const orteLink = page.locator('a:has-text("Orte")').first()
      await orteLink.click()
      await page.waitForLoadState('networkidle')
      
      expect(page.url()).toContain('/orte')
      
      // Navigate to Kontakt
      const kontaktLink = page.locator('a:has-text("Kontakt")').first()
      if (await kontaktLink.isVisible()) {
        await kontaktLink.click()
      } else {
        // Open menu again
        if (await menuButton.isVisible()) {
          await menuButton.click()
          await page.waitForTimeout(300)
        }
        await page.locator('nav a:has-text("Kontakt")').first().click()
      }
      await page.waitForLoadState('networkidle')
      
      expect(page.url()).toContain('/kontakt')
    })

    test('navigation between pages works on tablet', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.tablet)
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // On tablet, desktop nav should be visible
      const orteLink = page.locator('nav a:has-text("Orte")').first()
      await orteLink.click()
      await page.waitForLoadState('networkidle')
      
      expect(page.url()).toContain('/orte')
      
      // Navigate back to events
      const eventsLink = page.locator('nav a:has-text("Events")').first()
      await eventsLink.click()
      await page.waitForLoadState('networkidle')
      
      expect(page.url()).toMatch(/\/(formate)?$/)
    })

    test('mobile menu opens and closes correctly', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile)
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      const menuButton = page.locator('button[aria-label*="Menü"]')
      
      if (await menuButton.isVisible()) {
        // Menu should be closed initially
        const mobileNav = page.locator('nav.animate-fadeIn')
        expect(await mobileNav.isVisible()).toBeFalsy()
        
        // Open menu
        await menuButton.click()
        await page.waitForTimeout(300)
        
        // Menu should now be visible
        const navLinks = page.locator('nav.animate-fadeIn a, nav.animate-fadeIn button')
        expect(await navLinks.count()).toBeGreaterThan(0)
        
        // Close menu
        await menuButton.click()
        await page.waitForTimeout(300)
        
        // Menu should be hidden
        expect(await page.locator('nav.animate-fadeIn').isVisible()).toBeFalsy()
      }
    })
  })

  test.describe('Calendar/Date Picker on iPad', () => {
    test('date picker input is accessible on iPad viewport', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.tablet)
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Find date input/selector
      const dateInput = page.locator('input[aria-label="Termine wählen"]')
      
      if (await dateInput.isVisible()) {
        // Check it has proper touch target size
        const box = await dateInput.boundingBox()
        expect(box).not.toBeNull()
        expect(box!.height).toBeGreaterThanOrEqual(44) // iOS minimum touch target
        
        // Click should work
        await dateInput.click()
        // Native date picker behavior varies, but click should not error
      }
    })

    test('date picker button has touch-friendly size', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.ipadPro)
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      const dateButton = page.locator('button[aria-label="Kalender öffnen"]')
      
      if (await dateButton.isVisible()) {
        const box = await dateButton.boundingBox()
        expect(box).not.toBeNull()
        expect(box!.height).toBeGreaterThanOrEqual(44)
        expect(box!.width).toBeGreaterThanOrEqual(44)
      }
    })
  })

  test.describe('Dropdown Menus - Clear Selection State', () => {
    test('theme dropdown shows selection count when items selected', async ({ page }) => {
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Find themes dropdown
      const themesSelect = page.locator('select').filter({ hasText: 'Themen' }).first()
      
      if (await themesSelect.isVisible()) {
        // Get options
        const options = await themesSelect.locator('option').allTextContents()
        
        if (options.length > 1) {
          // Select first non-placeholder option
          const firstOption = options.find(o => o && !o.includes('Themen'))
          if (firstOption) {
            // The dropdown uses onChange to add to selected list
            await themesSelect.selectOption({ label: firstOption.replace('✓ ', '') })
            
            // Check that selection indicator appears
            await page.waitForTimeout(300)
            
            // Should show selected tag below
            const selectedTag = page.locator('.bg-green-100').filter({ hasText: firstOption.replace('✓ ', '') })
            expect(await selectedTag.isVisible()).toBeTruthy()
          }
        }
      }
    })

    test('selected items show checkmark in tags', async ({ page }) => {
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Find any dropdown and select an item
      const selects = page.locator('select')
      const count = await selects.count()
      
      if (count > 0) {
        const select = selects.first()
        const options = await select.locator('option').allTextContents()
        
        const validOption = options.find(o => o && !o.includes('ausgewählt') && o !== 'Themen' && o !== 'Orte' && o !== 'Termine')
        
        if (validOption) {
          await select.selectOption({ label: validOption.replace('✓ ', '') })
          await page.waitForTimeout(300)
          
          // Check for checkmark in selected tags
          const checkmarks = page.locator('.bg-green-100 .text-green-600:has-text("✓")')
          expect(await checkmarks.count()).toBeGreaterThan(0)
        }
      }
    })

    test('dropdown border changes color when items are selected', async ({ page }) => {
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      const themesSelect = page.locator('select').filter({ hasText: 'Themen' }).first()
      
      if (await themesSelect.isVisible()) {
        // Initially should have black border
        const initialClass = await themesSelect.getAttribute('class')
        expect(initialClass).toContain('border-black')
        
        // Select an option
        const options = await themesSelect.locator('option').allTextContents()
        const validOption = options.find(o => o && !o.includes('Themen') && !o.includes('ausgewählt'))
        
        if (validOption) {
          await themesSelect.selectOption({ label: validOption.replace('✓ ', '') })
          await page.waitForTimeout(300)
          
          // After selection, should have brand border
          const selectedClass = await themesSelect.getAttribute('class')
          expect(selectedClass).toContain('border-brand')
        }
      }
    })
  })

  test.describe('Touch Target Sizes', () => {
    test('filter buttons have minimum 44px touch target', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile)
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      const filterButtons = page.locator('button.rounded-full.min-h-\\[44px\\]')
      const count = await filterButtons.count()
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 5); i++) {
          const btn = filterButtons.nth(i)
          if (await btn.isVisible()) {
            const box = await btn.boundingBox()
            expect(box).not.toBeNull()
            expect(box!.height).toBeGreaterThanOrEqual(44)
          }
        }
      }
    })

    test('header buttons have minimum 44px touch target on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile)
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Search button
      const searchButton = page.locator('button[aria-label="Suche öffnen"]')
      if (await searchButton.isVisible()) {
        const box = await searchButton.boundingBox()
        expect(box).not.toBeNull()
        expect(box!.height).toBeGreaterThanOrEqual(44)
        expect(box!.width).toBeGreaterThanOrEqual(44)
      }
      
      // Menu button
      const menuButton = page.locator('button[aria-label*="Menü"]')
      if (await menuButton.isVisible()) {
        const box = await menuButton.boundingBox()
        expect(box).not.toBeNull()
        expect(box!.height).toBeGreaterThanOrEqual(44)
        expect(box!.width).toBeGreaterThanOrEqual(44)
      }
    })
  })
})
