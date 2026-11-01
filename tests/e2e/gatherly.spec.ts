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

    const eventTypeGroup = page.getByRole('group', { name: 'Celebration Type *' });
    await expect(eventTypeGroup).toBeVisible();
    await expect(eventTypeGroup.getByRole('button').first()).toHaveAttribute('aria-pressed', /^(true|false)$/);

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

  // Test 3: Budget calculations, inline editing, and persistence across reload
  test('Test 3: Budget calculations update and persist across reload', async ({ page }) => {
    await page.goto('/events/demo-event-wedding-2026');
    await expect(page.getByText('Live Gemini sends event details to Google when you generate a plan.')).toBeVisible();

    // Navigate to Budget tab
    await page.click('#tab-budget');
    await expect(page.locator('h3:has-text("Category Allocation Distribution")').first()).toBeVisible();

    // Click edit on the first category row
    const editBtn = page.locator('button[title="Edit category amount"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Fill actual spent amount with 45000
    const actualSpentInput = page.locator('tbody tr input[type="number"]').nth(1);
    await expect(actualSpentInput).toBeVisible();
    await actualSpentInput.fill('45000');

    // Save edit
    await page.click('button:has-text("Save")');

    // Verify formatted amount displayed in table
    await expect(page.locator('tbody tr').first()).toContainText('₹45,000');

    // Hard reload page to verify persistence in localStorage
    await page.reload();
    await page.click('#tab-budget');
    await expect(page.locator('tbody tr').first()).toContainText('₹45,000');
  });

  // Test 4: Task completion, readiness score updates, and persistence across reload
  test('Test 4: Timeline task toggle updates status and readiness', async ({ page }) => {
    await page.goto('/events/demo-event-wedding-2026');

    // Switch to Timeline & Tasks tab
    await page.click('#tab-timeline');
    await expect(page.locator('text=Preparation Progress').first()).toBeVisible();

    // Locate the first task toggle button inside timeline panel
    const taskToggleButton = page.locator('#tabpanel-timeline button[aria-label*="Mark"]').first();
    await expect(taskToggleButton).toBeVisible();
    const initialLabel = await taskToggleButton.getAttribute('aria-label');
    const expectedToggledPattern = initialLabel?.includes('incomplete') ? /as complete$/ : /as incomplete$/;

    // Click to toggle task status
    await taskToggleButton.click();

    // Verify button label toggled
    await expect(taskToggleButton).toHaveAttribute('aria-label', expectedToggledPattern);

    // Verify workspace-level live status region announced readiness update
    const announcer = page.locator('#workspace-readiness-announcement');
    await expect(announcer).toBeAttached();
    await expect(announcer).toContainText(/Event preparation readiness updated to \d+ percent/);

    // Hard reload and verify task status persisted
    await page.reload();
    await page.click('#tab-timeline');
    const reloadedToggle = page.locator('#tabpanel-timeline button[aria-label*="Mark"]').first();
    await expect(reloadedToggle).toHaveAttribute('aria-label', expectedToggledPattern);
  });

  // Test 5: Vendor checklist management, status change, and note persistence
  test('Test 5: Vendor checklist status and notes update and persist', async ({ page }) => {
    await page.goto('/events/demo-event-wedding-2026');

    // Switch to Vendors tab
    await page.click('#tab-vendors');
    await expect(page.locator('text=Supplier Confirmation Readiness').first()).toBeVisible();

    // Select first vendor status select and change to 'confirmed'
    const statusSelect = page.locator('select.capitalize').first();
    await expect(statusSelect).toBeVisible();
    await statusSelect.selectOption('confirmed');
    expect(await statusSelect.inputValue()).toBe('confirmed');

    // Open notes editor for first vendor
    const editNoteBtn = page.locator('button:has-text("Edit")').first();
    await editNoteBtn.click();

    const noteTextarea = page.locator('textarea[placeholder*="Add your local supplier notes"]');
    await noteTextarea.fill('Tasting appointment confirmed for Saturday 3pm with chef');
    await page.click('button:has-text("Save Notes")');

    // Verify note rendered in the card (using first() to prevent strict mode duplicate matches)
    await expect(page.locator('text=Tasting appointment confirmed for Saturday 3pm with chef').first()).toBeVisible();

    // Reload page to verify persistence
    await page.reload();
    await page.click('#tab-vendors');
    const reloadedSelect = page.locator('select.capitalize').first();
    expect(await reloadedSelect.inputValue()).toBe('confirmed');
    await expect(page.locator('text=Tasting appointment confirmed for Saturday 3pm with chef').first()).toBeVisible();
  });

  // Test 6: Workspace navigation & WAI-ARIA tab semantics and relationships
  test('Test 6: Workspace tabs implement WAI-ARIA tablist, tabpanels, and keyboard navigation', async ({ page }) => {
    await page.goto('/events/demo-event-wedding-2026');

    // Verify role="tablist"
    const tablist = page.locator('div[role="tablist"]');
    await expect(tablist).toBeVisible();
    await expect(tablist).toHaveAttribute('aria-label', 'Workspace Sections');

    // Verify all 6 tabs have role="tab" and their corresponding panel IDs exist in the DOM
    const tabs = ['overview', 'budget', 'timeline', 'vendors', 'schedule', 'ideas'];
    for (const tabId of tabs) {
      const tabButton = page.locator(`#tab-${tabId}`);
      await expect(tabButton).toHaveAttribute('role', 'tab');
      await expect(tabButton).toHaveAttribute('aria-controls', `tabpanel-${tabId}`);

      // Crucial WAI-ARIA check: The referenced panel MUST exist in the document
      const panel = page.locator(`#tabpanel-${tabId}`);
      await expect(panel).toBeAttached();
      await expect(panel).toHaveAttribute('role', 'tabpanel');
      await expect(panel).toHaveAttribute('aria-labelledby', `tab-${tabId}`);
    }

    // Default overview tab is selected and visible; others are hidden
    await expect(page.locator('#tab-overview')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tabpanel-overview')).toBeVisible();
    await expect(page.locator('#tabpanel-budget')).toBeHidden();

    // Test keyboard ArrowRight navigation
    await page.locator('#tab-overview').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-budget')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tabpanel-budget')).toBeVisible();
    await expect(page.locator('#tabpanel-overview')).toBeHidden();

    // Test keyboard ArrowLeft navigation back
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#tab-overview')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tabpanel-overview')).toBeVisible();
    await expect(page.locator('#tabpanel-budget')).toBeHidden();
  });

  // Test 7: Export JSON backup and validate exported payload structure
  test('Test 7: Export JSON backup and plain-text summary', async ({ page }) => {
    await page.goto('/events/demo-event-wedding-2026');

    await page.click('#tab-ideas');
    await expect(page.getByText(/event context, your current plan summary, budget categories, and refinement request are sent to Google/i)).toBeVisible();
    await expect(page.getByLabel('Custom Refinement Instruction')).toHaveAttribute('maxlength', '600');

    // Trigger copy summary
    await page.click('#tab-overview');
    await page.click('button:has-text("Copy Summary")');
    await expect(page.locator('text=Copied!')).toBeVisible();

    // Trigger JSON backup download and strictly assert the downloaded file
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Backup JSON")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('.json');

    // Read and parse downloaded JSON
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const content = Buffer.concat(chunks).toString('utf-8');
    const parsed = JSON.parse(content);

    expect(parsed).toHaveProperty('id', 'demo-event-wedding-2026');
    expect(parsed.name).toContain('Aarav & Meera');
    expect(parsed).toHaveProperty('totalBudget', 850000);
    expect(parsed).toHaveProperty('plan');
    expect(parsed.plan).toHaveProperty('budgetBreakdown');
  });

  // Test 8: Multi-event isolation (changes in one event do not contaminate another)
  test('Test 8: Independent events remain isolated without data cross-contamination', async ({ page }) => {
    await page.goto('/events/demo-event-wedding-2026');

    // Ensure demo event has budget of 850000
    await page.click('#tab-budget');
    await expect(page.locator('#tabpanel-budget')).toContainText(/8,50,000/);

    // Create a new independent celebration
    await page.goto('/events/new');
    await page.fill('#name', 'Rohan Birthday Party');
    await page.fill('#date', '2026-11-20');
    await page.fill('#location', 'Goa Beach Resort');
    await page.fill('#guestCount', '50');
    await page.click('button:has-text("Continue")');

    await expect(page.locator('h2:has-text("Budget & Aesthetic Vision")')).toBeVisible();
    await page.fill('#totalBudget', '125000');
    await page.click('button:has-text("Continue")');

    const step3Header = page.locator('h2:has-text("Personalization & Special Requirements")');
    const isStep3 = await step3Header.isVisible({ timeout: 3000 }).catch(() => false);
    if (isStep3) {
      const submitBtn = page.locator('button:has-text("Create Event Workspace")');
      await submitBtn.scrollIntoViewIfNeeded();
      await submitBtn.click({ force: true });
    }

    // Verify new workspace shows Rohan Birthday Party and load plan
    await expect(page.locator('h1').first()).toContainText('Rohan Birthday Party', { timeout: 15000 });
    await expect(page.locator('text=1,25,000').first()).toBeVisible();

    // Populate plan using Load Sample Plan
    await page.click('button:has-text("Load Sample Plan")');
    await page.click('#tab-budget');
    await expect(page.locator('#tabpanel-budget')).toContainText(/1,25,000/);

    // Navigate back to demo event and ensure its budget remained untouched at 8,50,000
    await page.goto('/events/demo-event-wedding-2026');
    await page.click('#tab-budget');
    await expect(page.locator('#tabpanel-budget')).toContainText(/8,50,000/);
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

  // Test 10: Responsive mobile layout (375 x 667) without horizontal overflow
  test('Test 10: Mobile viewport (375x667) renders without horizontal breakage', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/events/demo-event-wedding-2026');

    // Verify document does not have horizontal scroll/overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Verify tablist remains accessible and scrollable
    const tablist = page.locator('div[role="tablist"]');
    await expect(tablist).toBeVisible();

    // Check headline visible without overflowing
    await expect(page.locator('h1:has-text("Aarav & Meera")').first()).toBeVisible();

    // Test interacting with key control on mobile
    await page.click('#tab-budget');
    await expect(page.locator('#tabpanel-budget')).toBeVisible();
  });
});
