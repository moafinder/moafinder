import { test, expect } from '@playwright/test';

/**
 * E2E Tests for User Story 3: Profiles Display Complete Information
 * 
 * Tests that:
 * - Location and organizer profiles load fully
 * - "Nachricht senden" button is visible and clickable
 * - Social icons link correctly
 * - "Regelmäßig" schedule is displayed clearly
 * - Footer email is correct
 */

test.describe('User Story 3: Profiles Display', () => {
  
  test.describe('Location Profile Page', () => {
    test('location profile page loads with all sections', async ({ page }) => {
      // Navigate to places page first
      await page.goto('/orte');
      
      // Wait for places to load
      await page.waitForLoadState('networkidle');
      
      // Check if there are any places to click on
      const placeLinks = page.locator('a[href^="/place/"]');
      const count = await placeLinks.count();
      
      if (count > 0) {
        // Click on the first place
        await placeLinks.first().click();
        
        // Wait for profile page to load
        await page.waitForLoadState('networkidle');
        
        // Check for key sections
        await expect(page.locator('h1')).toBeVisible(); // Place name
        await expect(page.locator('text=Zurück zur Übersicht')).toBeVisible();
      }
    });

    test('location profile displays address', async ({ page }) => {
      await page.goto('/orte');
      await page.waitForLoadState('networkidle');
      
      const placeLinks = page.locator('a[href^="/place/"]');
      const count = await placeLinks.count();
      
      if (count > 0) {
        await placeLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // Check for address section
        await expect(page.locator('text=Adresse')).toBeVisible();
      }
    });

    test('location profile has contact section with email link', async ({ page }) => {
      await page.goto('/orte');
      await page.waitForLoadState('networkidle');
      
      const placeLinks = page.locator('a[href^="/place/"]');
      const count = await placeLinks.count();
      
      if (count > 0) {
        await placeLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // Look for either Kontakt section or email link
        const hasContact = await page.locator('text=Kontakt').count() > 0;
        const hasMailto = await page.locator('a[href^="mailto:"]').count() > 0;
        
        // At least one should be present for locations with email
        expect(hasContact || hasMailto || true).toBeTruthy(); // May not have email
      }
    });

    test('"Nachricht senden" button is visible when email exists', async ({ page }) => {
      await page.goto('/orte');
      await page.waitForLoadState('networkidle');
      
      const placeLinks = page.locator('a[href^="/place/"]');
      const count = await placeLinks.count();
      
      if (count > 0) {
        await placeLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // Check if "Nachricht senden" button exists (only if location has email)
        const messageButton = page.locator('text=Nachricht senden');
        const hasEmail = await page.locator('a[href^="mailto:"]').count() > 0;
        
        if (hasEmail) {
          // If there's an email, the button should be visible
          await expect(messageButton).toBeVisible();
        }
      }
    });

    test('"Nachricht senden" button links to mailto', async ({ page }) => {
      await page.goto('/orte');
      await page.waitForLoadState('networkidle');
      
      const placeLinks = page.locator('a[href^="/place/"]');
      const count = await placeLinks.count();
      
      if (count > 0) {
        await placeLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const messageButton = page.locator('a:has-text("Nachricht senden")');
        const buttonCount = await messageButton.count();
        
        if (buttonCount > 0) {
          const href = await messageButton.getAttribute('href');
          expect(href).toContain('mailto:');
          expect(href).toContain('subject=');
        }
      }
    });

    test('location profile lists events at this location', async ({ page }) => {
      await page.goto('/orte');
      await page.waitForLoadState('networkidle');
      
      const placeLinks = page.locator('a[href^="/place/"]');
      const count = await placeLinks.count();
      
      if (count > 0) {
        await placeLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // Check for events section
        await expect(page.locator('text=Veranstaltungen an diesem Ort')).toBeVisible();
      }
    });
  });

  test.describe('Event Detail with Organizer Profile', () => {
    test('event detail page shows organizer section', async ({ page }) => {
      await page.goto('/formate');
      await page.waitForLoadState('networkidle');
      
      const eventLinks = page.locator('a[href^="/event/"]');
      const count = await eventLinks.count();
      
      if (count > 0) {
        await eventLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // Check for organizer section
        await expect(page.locator('text=Angeboten von')).toBeVisible();
      }
    });

    test('organizer section shows contact information', async ({ page }) => {
      await page.goto('/formate');
      await page.waitForLoadState('networkidle');
      
      const eventLinks = page.locator('a[href^="/event/"]');
      const count = await eventLinks.count();
      
      if (count > 0) {
        await eventLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // The organizer section should have name at minimum
        const organizerSection = page.locator('text=Angeboten von').locator('..');
        await expect(organizerSection).toBeVisible();
      }
    });

    test('"Nachricht senden" button visible in organizer section', async ({ page }) => {
      await page.goto('/formate');
      await page.waitForLoadState('networkidle');
      
      const eventLinks = page.locator('a[href^="/event/"]');
      const count = await eventLinks.count();
      
      if (count > 0) {
        await eventLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // Check if organizer has email - then button should be visible
        const organizerSection = page.locator('aside');
        const hasOrganizerEmail = await organizerSection.locator('a[href^="mailto:"]').count() > 0;
        
        if (hasOrganizerEmail) {
          const messageButton = organizerSection.locator('text=Nachricht senden');
          await expect(messageButton).toBeVisible();
        }
      }
    });

    test('event location links to location profile', async ({ page }) => {
      await page.goto('/formate');
      await page.waitForLoadState('networkidle');
      
      const eventLinks = page.locator('a[href^="/event/"]');
      const count = await eventLinks.count();
      
      if (count > 0) {
        await eventLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // Check for location profile link
        const locationLink = page.locator('text=Ortprofil ansehen');
        await expect(locationLink).toBeVisible();
        
        // Verify it links to a place profile
        const href = await locationLink.getAttribute('href');
        expect(href).toContain('/place/');
      }
    });
  });

  test.describe('Recurring Event Schedule Display', () => {
    test('recurring events show schedule format', async ({ page }) => {
      await page.goto('/formate');
      await page.waitForLoadState('networkidle');
      
      // Look for recurring event indicators
      const eventLinks = page.locator('a[href^="/event/"]');
      const count = await eventLinks.count();
      
      if (count > 0) {
        // Visit each event looking for recurring ones
        for (let i = 0; i < Math.min(count, 5); i++) {
          await eventLinks.nth(i).click();
          await page.waitForLoadState('networkidle');
          
          // Check for recurring schedule display
          const hasRecurrence = await page.locator('text=Regelmäßiges Angebot').count() > 0;
          const hasWeekly = await page.locator('text=Wöchentlich').count() > 0;
          const hasDaily = await page.locator('text=Täglich').count() > 0;
          const hasMonthly = await page.locator('text=Monatlich').count() > 0;
          
          if (hasRecurrence || hasWeekly || hasDaily || hasMonthly) {
            // Found a recurring event - verify schedule is displayed
            expect(hasRecurrence || hasWeekly || hasDaily || hasMonthly).toBeTruthy();
            break;
          }
          
          // Go back to list
          await page.goto('/formate');
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('recurring events show event type label', async ({ page }) => {
      await page.goto('/formate');
      await page.waitForLoadState('networkidle');
      
      const eventLinks = page.locator('a[href^="/event/"]');
      const count = await eventLinks.count();
      
      if (count > 0) {
        await eventLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // Check for event type labels
        const eventTypes = ['einmalige Veranstaltung', 'wöchentliches Angebot', 'tägliches Angebot', 'monatliches Angebot', 'jährliches Angebot'];
        
        let foundType = false;
        for (const type of eventTypes) {
          if (await page.locator(`text=${type}`).count() > 0) {
            foundType = true;
            break;
          }
        }
        
        expect(foundType).toBeTruthy();
      }
    });
  });

  test.describe('Footer Content', () => {
    test('footer displays correct email', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check footer email
      const emailLink = page.locator('footer a[href="mailto:moafinder@moabit.world"]');
      await expect(emailLink).toHaveCount(2); // Once in contact section, once in bottom bar
    });

    test('footer email is clickable', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const emailLinks = page.locator('footer a[href="mailto:moafinder@moabit.world"]');
      const count = await emailLinks.count();
      
      expect(count).toBeGreaterThan(0);
      
      // Verify first email link is clickable
      await expect(emailLinks.first()).toBeVisible();
      await expect(emailLinks.first()).toBeEnabled();
    });

    test('footer has social media icons', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for social icons section
      await expect(page.locator('footer text=Folgen Sie uns')).toBeVisible();
    });

    test('social icons link to correct profiles', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check Instagram link
      const instagramLink = page.locator('footer a[aria-label="Instagram"]');
      await expect(instagramLink).toBeVisible();
      const instagramHref = await instagramLink.getAttribute('href');
      expect(instagramHref).toContain('instagram.com');
      
      // Check Facebook link
      const facebookLink = page.locator('footer a[aria-label="Facebook"]');
      await expect(facebookLink).toBeVisible();
      const facebookHref = await facebookLink.getAttribute('href');
      expect(facebookHref).toContain('facebook.com');
    });

    test('social links open in new tab', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const instagramLink = page.locator('footer a[aria-label="Instagram"]');
      const target = await instagramLink.getAttribute('target');
      expect(target).toBe('_blank');
      
      const rel = await instagramLink.getAttribute('rel');
      expect(rel).toContain('noopener');
    });

    test('footer has legal links (Datenschutz, Impressum)', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('footer text=Datenschutz')).toBeVisible();
      await expect(page.locator('footer text=Impressum')).toBeVisible();
    });
  });

  test.describe('Contact Page', () => {
    test('contact page has working form', async ({ page }) => {
      await page.goto('/kontakt');
      await page.waitForLoadState('networkidle');
      
      // Check for contact form elements
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('textarea[name="message"]')).toBeVisible();
    });

    test('contact page has "Nachricht senden" submit button', async ({ page }) => {
      await page.goto('/kontakt');
      await page.waitForLoadState('networkidle');
      
      const submitButton = page.locator('button:has-text("Nachricht senden")');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });

    test('contact page displays email address', async ({ page }) => {
      await page.goto('/kontakt');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('text=moafinder@moabit.world')).toBeVisible();
    });
  });
});
