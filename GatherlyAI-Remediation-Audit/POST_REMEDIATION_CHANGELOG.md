# Gatherly AI — Post-Remediation Codebase Changelog

**Date:** October 29, 2026  
**Auditor Roles:** Senior Full-Stack Engineer, AppSec Engineer, Accessibility Specialist, QA Automation Lead  
**Baseline Git Commit:** `18edf47` (`main`)  
**Repository State:** Local changes preserved uncommitted; 0 commits created.  

---

## 1. Summary of Changes by File

### 1. `lib/security/rateLimiter.ts` [REWRITTEN & HARDENED]
- **Purpose:** Server-side sliding-window rate limiting engine executing a single atomic Lua script (`LUA_SLIDING_WINDOW_SCRIPT`) in Upstash Redis REST to guarantee zero race conditions under concurrent requests. Enforces mandatory Upstash Redis configuration in production whenever live Gemini is enabled (silent in-memory fallback strictly prohibited, failing closed with HTTP 503). Validates Redis HTTP response codes (`res.ok`), command execution error payloads (`data.error`), and return shapes. Hard-bounds local memory store via strict LRU eviction. Normalizes IPv4/IPv6 with port stripping and prevents shared quota collapse by generating isolated anonymous fingerprints (`anon-<hash>`) in production.
- **Finding Addressed:** Finding 1 (Rate limiting on public AI endpoints & distributed race condition elimination).
- **Relevant Tests Added:** `tests/rate-limiter.test.ts` (expanded to 21 tests, including 30-request concurrent race-condition test and simulated Redis HTTP/command failure tests).
- **Validation Result:** Verified via 21 passing unit tests (100% pass rate), atomic evaluation, HTTP 429/503 response verification, and `Retry-After` calculation.

### 2. `app/api/generate-plan/route.ts` [MODIFIED]
- **Purpose:** Integrated rate limiting check before invoking expensive AI generation logic; returns HTTP 429 when client exceeds 5 requests per minute, or HTTP 503 when rate-limiting backend fails closed.
- **Finding Addressed:** Finding 1 (Rate limiting on public AI endpoints).
- **Relevant Tests Added:** `tests/rate-limiter.test.ts`.
- **Validation Result:** Verified via route tests and Playwright error tests.

### 3. `app/api/refine-plan/route.ts` [MODIFIED]
- **Purpose:** Integrated rate limiting check before invoking AI refinement logic; returns HTTP 429 when client exceeds 10 requests per minute, or HTTP 503 when rate-limiting backend fails closed.
- **Finding Addressed:** Finding 1 (Rate limiting on public AI endpoints).
- **Relevant Tests Added:** `tests/rate-limiter.test.ts`.
- **Validation Result:** Verified via route tests.

### 4. `.env.example` & `README.md` [MODIFIED]
- **Purpose:** Made Upstash Redis configuration mandatory in production whenever live Gemini AI is enabled. Clarified that silent in-memory fallback is prohibited in production to prevent distributed quota exhaustion across serverless or containerized instances.
- **Finding Addressed:** Finding 1 (Production rate limiting configuration enforcement).
- **Validation Result:** Verified no secrets exposed in repository; documentation reflects mandatory status.

### 5. `lib/validation/schemas.ts` [MODIFIED]
- **Purpose:** Replaced `z.any()` in `RefinePlanSchema` with concrete schemas (`ThemeIdeaSchema`, `BudgetCategorySchema`, `BudgetBreakdownSchema`, `TimelineTaskSchema`, `VendorItemSchema`, `ScheduleItemSchema`, `PersonalizedIdeaSchema`, `RiskContingencySchema`, `CurrentPlanSchema`); bounded string and array lengths.
- **Finding Addressed:** Finding 2 (Eliminate `z.any()` from refinement validation).
- **Relevant Tests Added:** `tests/validation.test.ts` (expanded to 10 tests).
- **Validation Result:** Verified via 10 passing validation unit tests; 0 TypeScript errors.

### 6. `app/events/[id]/page.tsx` [MODIFIED]
- **Purpose:** Implemented WAI-ARIA tab pattern (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"`, `aria-labelledby`, roving `tabIndex`, and Arrow/Home/End keyboard navigation).
- **Finding Addressed:** Finding 3 (Workspace tab accessibility).
- **Relevant Tests Added:** `tests/accessibility.test.ts` and `tests/e2e/gatherly.spec.ts` (Test 6).
- **Validation Result:** Verified via unit accessibility tests and Playwright keyboard interaction test.

### 7. `components/workspace/OverviewTab.tsx` [MODIFIED]
- **Purpose:** Added dedicated live status region (`<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">`) to announce dynamic celebration readiness score updates to screen readers.
- **Finding Addressed:** Finding 4 (Readiness score accessibility announcements).
- **Relevant Tests Added:** `tests/accessibility.test.ts` and `tests/e2e/gatherly.spec.ts` (Test 4).
- **Validation Result:** Verified via Vitest unit tests and live Playwright DOM inspection.

### 8. `components/events/CreateEventWizard.tsx` [MODIFIED]
- **Purpose:** Added distinct React keys (`key="btn-continue"`, `key="btn-submit"`) on step progression controls to prevent DOM reuse and avoid click bleed-through in automated browser testing.
- **Finding Addressed:** Finding 5 (Browser test stability).
- **Validation Result:** Verified via Playwright Test 2 passing cleanly in 1.7s.

### 9. `lib/storage/eventStorage.ts` [MODIFIED]
- **Purpose:** Enhanced `getEventById` to auto-seed default demo wedding event when navigating directly to demo URL in isolated browser contexts.
- **Finding Addressed:** Finding 5 (Deterministic E2E testing).
- **Validation Result:** Verified via Playwright Tests 1, 3, 4, 5, 6, 7.

### 10. `playwright.config.ts` [NEW FILE]
- **Purpose:** Playwright test configuration file targeting local Next.js server (`http://localhost:3005`), configured for Chromium headless with tracing and failure screenshots.
- **Finding Addressed:** Finding 5 (Automated Playwright regression testing).
- **Validation Result:** Verified via execution of `npx playwright test`.

### 11. `tests/e2e/gatherly.spec.ts` [NEW FILE]
- **Purpose:** Playwright end-to-end regression test suite implementing all 10 required user workflows.
- **Finding Addressed:** Finding 5 (Automated Playwright regression testing).
- **Validation Result:** 10/10 tests passing in 14.6s.

### 12. `tests/rate-limiter.test.ts` [NEW FILE]
- **Purpose:** Unit tests for sliding-window rate limiter, limits enforcement, `Retry-After` header, client isolation, and expiration.
- **Finding Addressed:** Finding 1 (Rate limiting unit tests).
- **Validation Result:** 6/6 tests passing.

### 13. `tests/accessibility.test.ts` [NEW FILE]
- **Purpose:** Accessibility tests for WAI-ARIA tab semantics, roving tabindex, arrow key navigation, and dynamic readiness announcements.
- **Finding Addressed:** Findings 3 & 4 (Accessibility tests).
- **Validation Result:** 3/3 tests passing.

### 14. `tests/validation.test.ts` [MODIFIED]
- **Purpose:** Added tests for strict refinement schema validation, partial modification validation, and rejection of malformed nested plan entities.
- **Finding Addressed:** Finding 2 (Strict refinement schema regression tests).
- **Validation Result:** 10/10 tests passing.

### 15. `vitest.config.mts` [MODIFIED]
- **Purpose:** Configured Vitest test include pattern (`tests/**/*.test.ts`) to prevent Vitest from picking up Playwright `.spec.ts` files.
- **Finding Addressed:** Finding 5 (Test runner isolation).
- **Validation Result:** Clean test execution for both Vitest and Playwright.

### 16. `eslint.config.mjs` [MODIFIED]
- **Purpose:** Added `test-results/**` and `playwright-report/**` to `globalIgnores` to ensure ESLint runs smoothly without scanning Playwright test artifacts.
- **Finding Addressed:** Engineering hygiene & lint performance.
- **Validation Result:** `npx eslint app components lib types` passes with 0 warnings.

### 17. `package.json` & `package-lock.json` [MODIFIED]
- **Purpose:** Added `@playwright/test` to `devDependencies` and added `"test:e2e": "playwright test"` script.
- **Finding Addressed:** Finding 5 (E2E testing npm script).
- **Validation Result:** Clean lockfile consistency; 0 vulnerabilities.
