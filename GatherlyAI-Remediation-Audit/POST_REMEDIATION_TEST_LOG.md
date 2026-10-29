# Gatherly AI — Post-Remediation Test Execution Log

**Test Execution Date:** October 29, 2026  
**Environment:** Windows 11, Node.js v22.14.0, Next.js 16.4.3, Vitest v5.0.5, Playwright v1.64.1  
**Baseline Git Commit:** `18edf47` (`main`)  
**Total Automated Tests:** 50  
**Passed:** 50 (100%)  
**Failed:** 0  
**Skipped:** 0  

---

## 1. Vitest Unit & Integration Test Suite (`npm test`)

**Command:** `npm test` (`vitest run`)  
**Duration:** 39.99s  
**Outcome:** 8 test files passed (40 tests passed out of 40)  

### Suite 1: `tests/rate-limiter.test.ts` (6 tests) — NEW
- ✓ allows requests under the configured threshold (2ms)
- ✓ returns 429 when request rate exceeds the threshold (1ms)
- ✓ computes correct Retry-After header duration (1ms)
- ✓ enforces independent thresholds for generation vs refinement (1ms)
- ✓ isolates rate limit counters across distinct client identifiers (1ms)
- ✓ resets limit quota once time window expires (1ms)

### Suite 2: `tests/validation.test.ts` (10 tests) — EXPANDED
- ✓ accepts a valid event details payload (2ms)
- ✓ rejects invalid event type in creation schema (1ms)
- ✓ rejects negative or zero budget (1ms)
- ✓ enforces minimum length on event name (1ms)
- ✓ accepts a valid complete refinement request with typed currentPlan (2ms)
- ✓ rejects refinement request with non-numeric category spent amount (1ms)
- ✓ rejects refinement request with missing vendor serviceName (1ms)
- ✓ rejects refinement request with invalid vendor status enum (1ms)
- ✓ rejects refinement request exceeding maximum modification character length (1ms)
- ✓ rejects refinement request with invalid schedule item structure (1ms)

### Suite 3: `tests/accessibility.test.ts` (3 tests) — NEW
- ✓ renders workspace tabs with proper WAI-ARIA tablist and tab roles (18ms)
- ✓ supports roving tabindex and horizontal arrow navigation across tabs (16ms)
- ✓ updates dynamic readiness score announcement region appropriately (12ms)

### Suite 4: `tests/budget.test.ts` (6 tests)
- ✓ allocates budget categories proportional to default percentage weights (2ms)
- ✓ updates single category allocation while auto-rebalancing remainder (1ms)
- ✓ calculates actual expenditure and remaining variance accurately (1ms)
- ✓ tracks contingency reserve percentage and alerts when spending exceeds target (1ms)
- ✓ formats amounts into formatted currency strings (1ms)
- ✓ prevents negative allocations and ensures total equals target budget (1ms)

### Suite 5: `tests/storage.test.ts` (5 tests)
- ✓ saves and retrieves events from localStorage correctly (2ms)
- ✓ updates existing event state and increments updatedAt timestamp (2ms)
- ✓ deletes event by id and verifies removal (2ms)
- ✓ seeds default demo wedding event when storage is empty (2ms)
- ✓ exports event JSON and generates plain text summary string (2ms)

### Suite 6: `tests/readiness.test.ts` (2 tests)
- ✓ calculates baseline readiness score for newly created event with no progress (2ms)
- ✓ updates readiness score as tasks are completed and vendors are booked (2ms)

### Suite 7: `tests/ai-integration.test.ts` (3 tests)
- ✓ falls back to deterministic sample provider when GEMINI_API_KEY is not set (2ms)
- ✓ generates valid celebration plan matching all required schema constraints (2ms)
- ✓ refines existing plan according to natural language prompt (2ms)

### Suite 8: `tests/timeline.test.ts` (5 tests)
- ✓ generates chronological timeline tasks pegged to event target date (1ms)
- ✓ calculates correct calendar dates based on deadline offset days (1ms)
- ✓ toggles task completion state and updates progress percentage (1ms)
- ✓ filters tasks by planning phase correctly (1ms)
- ✓ adds custom task to timeline with valid target date (1ms)

---

## 2. Playwright End-to-End Browser Regression Suite (`npm run test:e2e`)

**Command:** `npx playwright test`  
**Browser:** Chromium Headless (1280x720 & 375x667)  
**Execution Target:** Next.js Production Build (`http://localhost:3005`)  
**Duration:** 14.6s  
**Outcome:** 10 passed out of 10  

### Scenario Breakdown:
1. **Test 1: Dashboard renders and loads demo celebration plan** (1.2s)
   - Navigates to `/`. Verifies Studio header. Clicks "Load Demo Event". Asserts demo event card appears in the grid.
2. **Test 2: Event creation wizard rejects invalid inputs and creates event** (1.7s)
   - Navigates to `/events/new`. Triggers step validation. Asserts "Please provide an event name" error. Fills valid event basics, sets budget, navigates through steps, submits, and verifies redirection to dedicated workspace header `Priya Golden Jubilee`.
3. **Test 3: Budget calculations update and persist across reload** (3.1s)
   - Navigates to demo event. Switches to Budget tab. Asserts target budget card and distribution charts. Reloads page and confirms state persistence.
4. **Test 4: Timeline task toggle updates status and readiness** (1.8s)
   - Switches to Timeline tab. Toggles task checkbox. Switches to Overview and verifies dedicated `role="status"` readiness announcement region. Reloads page and verifies persistence.
5. **Test 5: Vendor checklist status and items are visible** (613ms)
   - Switches to Vendor Checklist tab. Verifies vendor list, category badges, and notes.
6. **Test 6: Workspace tabs implement WAI-ARIA tablist and keyboard navigation** (766ms)
   - Inspects `[role="tablist"]`. Verifies `[aria-selected="true"]` on active tab and `[aria-selected="false"]` on inactive tabs. Tests keyboard right arrow navigation to Budget tab and panel focus.
7. **Test 7: Export JSON backup and plain-text summary** (908ms)
   - Triggers Copy Summary button and Backup JSON download action.
8. **Test 8: Independent events remain isolated without data cross-contamination** (856ms)
   - Loads demo event, switches to another event, verifies budget and data isolation in localStorage.
9. **Test 9: Invalid submission displays safe validation errors without stack traces** (463ms)
   - Exercises invalid form submission and confirms clear inline validation errors with no internal stack traces or environment secrets exposed.
10. **Test 10: Mobile viewport (375x667) renders without horizontal breakage** (437ms)
    - Emulates iPhone SE viewport (375x667). Verifies navbar, dashboard cards, buttons, and tablist render responsively without horizontal clipping.

---

## 3. Static Analysis & Build Verification Logs

- **TypeScript Typecheck (`npm run typecheck`):**
  - Command: `tsc --noEmit`
  - Result: 0 errors (Exit code 0).
- **ESLint Linting (`npx eslint app components lib types`):**
  - Command: `npx eslint app components lib types`
  - Result: 0 errors, 0 warnings (Exit code 0).
- **Production Build (`npm run build`):**
  - Command: `next build`
  - Result: Compiled successfully in 16.1s. All 9 routes optimized (Exit code 0).
- **Production Dependency Security Audit (`npm audit --omit=dev`):**
  - Result: `found 0 vulnerabilities` (Exit code 0).
