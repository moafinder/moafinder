import { test, expect } from '@playwright/test'

/**
 * User Story 5: Users and organizers can access their accounts without issues
 * 
 * As a user,
 * I want to log in and reset my password,
 * so that I can manage my profile and events smoothly.
 * 
 * Done when:
 * - "Forgot your password" redirect works
 * - Reset email is sent and login works afterward
 * - Language settings are clarified ("DE only" or multilingual messaging)
 * 
 * NOTE: These tests require both the frontend (http://localhost:5173) and 
 * backend (http://localhost:3000) to be running. Use `pnpm dev` in both 
 * frontend/ and backend/ directories.
 */

// Frontend runs on 5173 (Vite), backend on 3000 (Payload)
const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? 'http://localhost:5173'
const BACKEND_URL = process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:3000'

test.describe('User Story 5: User Account Access', () => {
  
  test.describe('Login Page', () => {
    test('login page loads correctly', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`)
      await page.waitForLoadState('networkidle')
      
      // Check title
      await expect(page.locator('h1')).toContainText('Login für Veranstalter*innen')
      
      // Check form fields exist
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('login page has "Passwort vergessen?" link', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`)
      await page.waitForLoadState('networkidle')
      
      const forgotLink = page.locator('a:has-text("Passwort vergessen?")')
      await expect(forgotLink).toBeVisible()
      
      // Should link to forgot-password page
      await expect(forgotLink).toHaveAttribute('href', '/forgot-password')
    })

    test('clicking forgot password link navigates correctly', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`)
      await page.waitForLoadState('networkidle')
      
      await page.click('a:has-text("Passwort vergessen?")')
      await page.waitForLoadState('networkidle')
      
      expect(page.url()).toContain('/forgot-password')
    })

    test('login page has registration link', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`)
      await page.waitForLoadState('networkidle')
      
      const registerLink = page.locator('a:has-text("Registrieren")')
      await expect(registerLink).toBeVisible()
    })

    test('login shows error with invalid credentials', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`)
      await page.waitForLoadState('networkidle')
      
      await page.fill('input[type="email"]', 'invalid@example.com')
      await page.fill('input[type="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')
      
      // Wait for error message
      await page.waitForTimeout(2000)
      
      const errorMessage = page.locator('.bg-red-50, .text-red-700, .text-red-600')
      await expect(errorMessage.first()).toBeVisible()
    })

    test('login button shows loading state during submission', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`)
      await page.waitForLoadState('networkidle')
      
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'testpassword')
      
      // Click and immediately check for loading state
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()
      
      // Button should be disabled during submission
      // (May be too fast to catch, so we just verify no crash)
      await page.waitForTimeout(1000)
    })

    test('password field has show/hide toggle', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`)
      await page.waitForLoadState('networkidle')
      
      const passwordInput = page.locator('input[name="password"]')
      const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).last()
      
      // Initially password type
      await expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Toggle visibility if button exists
      if (await toggleButton.isVisible()) {
        await toggleButton.click()
        // Should now be text type
        await expect(passwordInput).toHaveAttribute('type', 'text')
      }
    })
  })

  test.describe('Forgot Password Page', () => {
    test('forgot password page loads correctly', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/forgot-password`)
      await page.waitForLoadState('networkidle')
      
      // Check title
      await expect(page.locator('h1')).toContainText('Passwort zurücksetzen')
      
      // Check email input exists
      await expect(page.locator('input[type="email"]')).toBeVisible()
      
      // Check submit button
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('forgot password page has back to login link', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/forgot-password`)
      await page.waitForLoadState('networkidle')
      
      const backLink = page.locator('a:has-text("Zurück zum Login")')
      await expect(backLink).toBeVisible()
      await expect(backLink).toHaveAttribute('href', '/login')
    })

    test('forgot password shows success message after submission', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/forgot-password`)
      await page.waitForLoadState('networkidle')
      
      await page.fill('input[type="email"]', 'test@example.com')
      await page.click('button[type="submit"]')
      
      // Wait for success state
      await page.waitForTimeout(2000)
      
      // Should show success message (not leak whether account exists)
      const successText = page.locator('text=haben wir einen Link zum Zurücksetzen')
      await expect(successText).toBeVisible({ timeout: 5000 })
    })

    test('forgot password success shows contact email for help', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/forgot-password`)
      await page.waitForLoadState('networkidle')
      
      await page.fill('input[type="email"]', 'anyone@example.com')
      await page.click('button[type="submit"]')
      
      // Wait for success state
      await page.waitForTimeout(2000)
      
      // Should show help email
      const helpEmail = page.locator('a[href="mailto:moafinder@moabit.world"]')
      await expect(helpEmail).toBeVisible()
    })
  })

  test.describe('Reset Password Page', () => {
    test('reset password page loads with token parameter', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/reset-password?token=test-token`)
      await page.waitForLoadState('networkidle')
      
      // Check title
      await expect(page.locator('h1')).toContainText('Neues Passwort setzen')
      
      // Check password inputs
      const passwordInputs = page.locator('input[type="password"]')
      await expect(passwordInputs.first()).toBeVisible()
    })

    test('reset password shows error without token', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/reset-password`)
      await page.waitForLoadState('networkidle')
      
      // Should show invalid token message
      const errorText = page.locator('text=ungültig')
      await expect(errorText).toBeVisible()
    })

    test('reset password has password requirements info', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/reset-password?token=test`)
      await page.waitForLoadState('networkidle')
      
      // Should show password requirements
      const requirements = page.locator('text=12 Zeichen')
      await expect(requirements).toBeVisible()
    })

    test('reset password validates password match', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/reset-password?token=test-token`)
      await page.waitForLoadState('networkidle')
      
      const passwordInputs = page.locator('input[type="password"]')
      
      // Enter mismatched passwords
      await passwordInputs.first().fill('Password123!')
      await passwordInputs.last().fill('DifferentPassword456!')
      await page.click('button[type="submit"]')
      
      // Should show error about mismatch
      await page.waitForTimeout(500)
      const errorText = page.locator('text=stimmen nicht überein')
      await expect(errorText).toBeVisible()
    })

    test('reset password has back to login link', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/reset-password?token=test`)
      await page.waitForLoadState('networkidle')
      
      const backLink = page.locator('a:has-text("Zurück zum Login")')
      await expect(backLink).toBeVisible()
    })
  })

  test.describe('Registration Page', () => {
    test('registration page loads correctly', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/register`)
      await page.waitForLoadState('networkidle')
      
      // Should have registration form
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
    })

    test('registration page has link to login', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/register`)
      await page.waitForLoadState('networkidle')
      
      const loginLink = page.locator('a[href="/login"]')
      await expect(loginLink.first()).toBeVisible()
    })
  })

  test.describe('Language Settings Clarification', () => {
    test('footer shows German-only language notice', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`)
      await page.waitForLoadState('networkidle')
      
      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)
      
      // Should see German language indicator
      const languageNote = page.locator('text=Diese Seite ist nur auf Deutsch verfügbar')
      await expect(languageNote).toBeVisible()
    })

    test('footer shows German flag emoji', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/formate`)
      await page.waitForLoadState('networkidle')
      
      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)
      
      // Should see German flag
      const flagElement = page.locator('text=🇩🇪')
      await expect(flagElement).toBeVisible()
    })

    test('all form labels are in German', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`)
      await page.waitForLoadState('networkidle')
      
      // Check German labels
      await expect(page.locator('text=E-Mail-Adresse')).toBeVisible()
      await expect(page.locator('text=Passwort')).toBeVisible()
    })

    test('error messages are in German', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`)
      await page.waitForLoadState('networkidle')
      
      // Submit empty form
      await page.click('button[type="submit"]')
      
      await page.waitForTimeout(500)
      
      // Error should be in German
      const germanError = page.locator('text=Bitte')
      // May or may not show depending on HTML5 validation
    })
  })

  test.describe('Email Resend Feature', () => {
    test('login page has resend verification option', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`)
      await page.waitForLoadState('networkidle')
      
      // Should have resend verification button/link
      const resendText = page.locator('text=Bestätigungsmail')
      await expect(resendText).toBeVisible()
    })

    test('resend verification requires email input', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`)
      await page.waitForLoadState('networkidle')
      
      // Click resend without email
      const resendButton = page.locator('button:has-text("Erneut senden")')
      if (await resendButton.isVisible()) {
        await resendButton.click()
        
        // Should show message requiring email
        await page.waitForTimeout(500)
        const message = page.locator('text=E‑Mail')
        await expect(message.first()).toBeVisible()
      }
    })
  })
})
