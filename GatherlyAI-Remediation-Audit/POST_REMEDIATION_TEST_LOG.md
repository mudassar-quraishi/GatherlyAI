# Gatherly AI — Post-Remediation Test Execution Log

**Test Execution Date:** October 30, 2026  
**Environment:** Windows 11, Node.js v22.14.0, Next.js 16.4.3, Vitest v5.0.5, Playwright v1.64.1  
**Repository:** `https://github.com/mudassar-quraishi/GatherlyAI.git`  
**Total Automated Tests:** 66  
**Passed:** 66 (100%)  
**Failed:** 0  
**Skipped:** 0  

---

## 1. Vitest Unit & Integration Test Suite (`npm test`)

**Command:** `npm test` (`vitest run`)  
**Duration:** ~14.2s  
**Outcome:** 8 test files passed (56 tests passed out of 56)  

### Suite 1: `tests/rate-limiter.test.ts` (21 tests) — ATOMIC LUA & CONCURRENCY
- ✓ allows requests within the configured threshold (2ms)
- ✓ rejects requests exceeding the limit with accurate retryAfterSeconds (1ms)
- ✓ isolates different clients independently (1ms)
- ✓ resets limits after the sliding window expires (1ms)
- ✓ enforces strict hard bounds via LRU eviction to prevent unbounded memory growth (2ms)
- ✓ executes atomic Lua script with Upstash Redis REST and returns correct sliding-window quota (3ms)
- ✓ **handles 30 simultaneous requests with limit of 5: exactly 5 succeed and 25 fail without race conditions (Atomic Redis)** (4ms)
- ✓ handles 30 simultaneous requests with limit of 5 on MemoryRateLimitStore (1ms)
- ✓ validates Redis HTTP response status and throws on HTTP 500 error (2ms)
- ✓ validates individual Redis command execution errors and throws on error payload (1ms)
- ✓ validates script return shape and throws on malformed output (1ms)
- ✓ validates DEL response when resetting key (1ms)
- ✓ enforces fail-closed behavior when backend fails and fail-closed is active (2ms)
- ✓ strictly prohibits silent in-memory fallback in production when live Gemini is enabled (2ms)
- ✓ allows in-memory fallback in local development or demo mode without Upstash (1ms)
- ✓ normalizes IPv4 addresses and strips port numbers (1ms)
- ✓ normalizes IPv6 addresses including bracketed ports (1ms)
- ✓ rejects invalid or malformed IP addresses (1ms)
- ✓ extracts client IP safely from trusted proxy headers without spoofing vulnerabilities (2ms)
- ✓ isolates unidentified production clients using anonymous fingerprints rather than 127.0.0.1 (2ms)
- ✓ enforces distinct policies for generate (5/min) vs refine (10/min) (1ms)

### Suite 2: `tests/validation.test.ts` (11 tests) — STRICT TYPED SCHEMAS
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
- ✓ rejects refinement request with invalid eventDetails fields (1ms)

### Suite 3: `tests/accessibility.test.ts` (3 tests) — RUNTIME COMPONENT TESTS
- ✓ renders complete WAI-ARIA tab pattern with matching tab-to-panel relationships (342ms)
- ✓ updates readiness score and announces to screen reader via live status region upon runtime changes (25ms)
- ✓ calculates circular keyboard navigation indices correctly across tab list (1ms)

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

**Command:** `npm run test:e2e` (`playwright test` with automated `pretest:e2e` Next.js build)  
**Browser:** Chromium Headless (1280x720 & 375x667)  
**Execution Target:** Next.js Production Build (`http://localhost:3005`)  
**Duration:** ~32.8s  
**Outcome:** 10 passed out of 10 (100% pass rate)  

### Strengthened Scenario Breakdown:
1. **Test 1: Dashboard renders and loads demo celebration plan** (1.6s)
   - Navigates to `/`. Verifies Studio header. Clicks "Load Demo Event". Asserts demo event card appears in the grid.
2. **Test 2: Event creation wizard rejects invalid inputs and creates event** (1.4s)
   - Navigates to `/events/new`. Triggers step validation. Asserts "Please provide an event name" error. Fills valid event basics, sets budget, navigates through steps, submits, and verifies redirection to dedicated workspace header `Priya Golden Jubilee`.
3. **Test 3: Budget calculations update and persist across reload** (2.0s)
   - Navigates to demo event. Switches to Budget tab. Edits planned allocation and actual spent amounts. Asserts recalculated totals. Reloads page and confirms persistent storage.
4. **Test 4: Timeline task toggle updates status and readiness** (1.7s)
   - Switches to Timeline tab. Toggles task checkbox. Asserts toggled `aria-label`. Asserts live status region `#workspace-readiness-announcement` announces update. Reloads and verifies persistence.
5. **Test 5: Vendor checklist status and notes update and persist** (2.1s)
   - Switches to Vendor Checklist tab. Changes vendor status to `confirmed`. Edits vendor note and saves. Reloads page and confirms both status and note persist.
6. **Test 6: Workspace tabs implement WAI-ARIA tablist, tabpanels, and keyboard navigation** (1.5s)
   - Verifies `role="tablist"` and all 6 tab-to-tabpanel relationships exist simultaneously in the DOM. Asserts active panel visibility and inactive panel `hidden` state. Tests keyboard `ArrowRight` and `ArrowLeft` navigation with circular wrap.
7. **Test 7: Export JSON backup and plain-text summary** (1.9s)
   - Verifies Copy Summary notification. Captures browser `download` event, reads data stream, parses JSON, and strictly asserts event structure, totalBudget (₹8,50,000), and plan properties.
8. **Test 8: Independent events remain isolated without data cross-contamination** (3.0s)
   - Loads demo event (₹8,50,000 budget), navigates to `/events/new`, creates `Rohan Birthday Party` (₹1,25,000 budget), populates plan via Load Sample Plan, and verifies demo event budget remains untouched at ₹8,50,000.
9. **Test 9: Invalid submission displays safe validation errors without stack traces** (1.2s)
   - Submits invalid event details and verifies safe user-facing validation errors without stack traces or secret key exposure.
10. **Test 10: Mobile viewport (375x667) renders without horizontal breakage** (1.5s)
    - Emulates mobile viewport (375x667). Evaluates `document.documentElement.scrollWidth <= window.innerWidth` confirming zero horizontal overflow. Exercises key mobile controls.

---

## 3. Static Analysis & Build Verification Logs

- **TypeScript Typecheck (`npm run typecheck`):**
  - Command: `tsc --noEmit`
  - Result: 0 errors (Exit code 0).
- **ESLint Linting (`npm run lint`):**
  - Command: `next lint` / `eslint`
  - Result: 0 errors, 0 warnings (Exit code 0).
- **Production Build (`npm run build`):**
  - Command: `next build`
  - Result: Compiled successfully with Turbopack. All 9 routes optimized (Exit code 0).
- **Production Dependency Security Audit (`npm audit --omit=dev`):**
  - Result: `found 0 vulnerabilities` (Exit code 0).

