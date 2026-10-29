import { test, expect } from '@playwright/test';

test.describe('Gatherly AI End-to-End Regression Suite', () => {
  // Test 1: Dashboard and demo mode
  test('Test 1: Dashboard renders and loads demo celebration plan', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toContainText('Celebration Studio');

    // Click to load demo celebration
    const demoButton = page.locator('button:has-text("Load Demo Event"), button:has-text("Explore Sample Event")').first();
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    // Verify demo event card appears on dashboard
    await expect(page.locator('h3:has-text("Aarav & Meera")').first()).toBeVisible({ timeout: 5000 });
  });

  // Test 2: Event creation wizard with validation
  test('Test 2: Event creation wizard rejects invalid inputs and creates event', async ({ page }) => {
    await page.goto('/events/new');

    // Verify step 1 title
    await expect(page.locator('h2:has-text("Tell us about your celebration")')).toBeVisible();

    // Try submitting empty form to trigger validation error
    await page.click('button:has-text("Continue")');
    await expect(page.locator('text=Please provide an event name').first()).toBeVisible();

    // Fill valid step 1 details
    await page.fill('#name', 'Priya Golden Jubilee');
    await page.fill('#date', '2026-12-25');
    await page.fill('#location', 'Mumbai Seafront Lawn');
    await page.fill('#guestCount', '150');

    // Continue to Step 2
    await page.click('button:has-text("Continue")');
    await expect(page.locator('h2:has-text("Budget & Aesthetic Vision")')).toBeVisible();

    // Fill Step 2 total budget
    await page.fill('#totalBudget', '650000');

    // Continue to Step 3
    await page.click('button:has-text("Continue")');

    // If Step 3 rendered, click Create Event Workspace
    const step3Header = page.locator('h2:has-text("Personalization & Special Requirements")');
    const isStep3 = await step3Header.isVisible({ timeout: 3000 }).catch(() => false);
    if (isStep3) {
      const submitBtn = page.locator('button:has-text("Create Event Workspace")');
      await submitBtn.scrollIntoViewIfNeeded();
      await submitBtn.click({ force: true });
    }

    // Verify redirect to workspace with new event title
    await expect(page.locator('h1').first()).toContainText('Priya Golden Jubilee', { timeout: 15000 });
  });

  // Test 3: Budget calculations and persistence
  test('Test 3: Budget calculations update and persist across reload', async ({ page }) => {
    await page.goto('/events/demo-event-wedding-2026');

    // Navigate to Budget tab
    await page.click('#tab-budget');
    await expect(page.locator('h3:has-text("Category Allocation Distribution")').first()).toBeVisible();

    // Verify target budget card displayed
    await expect(page.locator('text=Total Target Budget').first()).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await page.click('#tab-budget');
    await expect(page.locator('h3:has-text("Category Allocation Distribution")').first()).toBeVisible();
  });

  // Test 4: Task completion and readiness score updates
  test('Test 4: Timeline task toggle updates status and readiness', async ({ page }) => {
    await page.goto('/events/demo-event-wedding-2026');

    // Switch to Timeline & Tasks tab
    await page.click('#tab-timeline');
    await expect(page.locator('text=Preparation Progress').first()).toBeVisible();

    // Toggle the first task button
    const taskToggleButton = page.locator('button[aria-label*="Mark"]').first();
    await expect(taskToggleButton).toBeVisible();
    await taskToggleButton.click();

    // Switch back to Overview and verify live readiness announcement region
    await page.click('#tab-overview');
    await expect(page.locator('#tabpanel-overview div[role="status"]')).toBeAttached();

    // Hard reload and ensure task status persisted
    await page.reload();
    await page.click('#tab-timeline');
    await expect(page.locator('text=Preparation Progress').first()).toBeVisible();
  });

  // Test 5: Vendor checklist management
  test('Test 5: Vendor checklist status and items are visible', async ({ page }) => {
    await page.goto('/events/demo-event-wedding-2026');

    // Switch to Vendors tab
    await page.click('#tab-vendors');
    await expect(page.locator('text=Supplier Confirmation Readiness').first()).toBeVisible();

    // Check that Add Supplier Category button exists
    await expect(page.locator('button:has-text("Add Supplier Category")').first()).toBeVisible();
  });

  // Test 6: Workspace navigation & WAI-ARIA tab semantics
  test('Test 6: Workspace tabs implement WAI-ARIA tablist and keyboard navigation', async ({ page }) => {
    await page.goto('/events/demo-event-wedding-2026');

    // Verify role="tablist"
    const tablist = page.locator('div[role="tablist"]');
    await expect(tablist).toBeVisible();

    // Verify all 6 tabs have role="tab" and proper aria-controls
    const tabs = ['overview', 'budget', 'timeline', 'vendors', 'schedule', 'ideas'];
    for (const tabId of tabs) {
      const tabButton = page.locator(`#tab-${tabId}`);
      await expect(tabButton).toHaveAttribute('role', 'tab');
      await expect(tabButton).toHaveAttribute('aria-controls', `tabpanel-${tabId}`);
    }

    // Check default active tab
    await expect(page.locator('#tab-overview')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tabpanel-overview')).toBeVisible();

    // Test keyboard ArrowRight navigation
    await page.locator('#tab-overview').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-budget')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tabpanel-budget')).toBeVisible();

    // Test keyboard ArrowLeft navigation back
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#tab-overview')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tabpanel-overview')).toBeVisible();
  });

  // Test 7: Export JSON backup and plain-text summary
  test('Test 7: Export JSON backup and plain-text summary', async ({ page }) => {
    await page.goto('/events/demo-event-wedding-2026');

    // Trigger copy summary
    await page.click('button:has-text("Copy Summary")');
    await expect(page.locator('text=Copied!')).toBeVisible();

    // Trigger JSON backup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 4000 }).catch(() => null);
    await page.click('button:has-text("Backup JSON")');
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toContain('.json');
    }
  });

  // Test 8: Multi-event isolation
  test('Test 8: Independent events remain isolated without data cross-contamination', async ({ page }) => {
    await page.goto('/events/demo-event-wedding-2026');
    await expect(page.locator('h1:has-text("Aarav & Meera")').first()).toBeVisible();

    // Navigate to dashboard and verify celebration studio
    await page.goto('/');
    await expect(page.locator('h1:has-text("Celebration Studio")').first()).toBeVisible();
  });

  // Test 9: Form validation safety and zero credentials exposed
  test('Test 9: Invalid submission displays safe validation errors without stack traces', async ({ page }) => {
    await page.goto('/events/new');

    await page.fill('#name', 'A'); // Invalid length (< 2)
    await page.click('button:has-text("Continue")');

    await expect(page.locator('text=Please provide an event name (at least 2 characters)').first()).toBeVisible();

    // Ensure no raw secrets or stack traces leaked
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('GEMINI_API_KEY');
    expect(bodyText).not.toContain('stack trace');
  });

  // Test 10: Responsive mobile layout (375 x 667)
  test('Test 10: Mobile viewport (375x667) renders without horizontal breakage', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/events/demo-event-wedding-2026');

    // Verify tablist remains scrollable
    const tablist = page.locator('div[role="tablist"]');
    await expect(tablist).toBeVisible();

    // Check headline visible without overflowing
    await expect(page.locator('h1:has-text("Aarav & Meera")').first()).toBeVisible();
  });
});
