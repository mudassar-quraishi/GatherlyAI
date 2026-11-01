# Gatherly AI — Post-Remediation Defect Register

**Date:** October 29, 2026  
**Review Type:** Historical internal self-review
**Baseline Git Commit:** `18edf47` (`main`)  

> Historical self-review notes from October 29, 2026. The listed resolutions are not an independent audit or a substitute for checking the current checkout. See [CURRENT_VERIFICATION.md](CURRENT_VERIFICATION.md) for current automated results.

---

## 1. Summary of Defect Resolutions

| Defect ID | Severity | Category | Description | Baseline Status | Post-Remediation Status | Verification Method |
|:---:|:---:|:---:|---|:---:|:---:|---|
| **SEC-01** | High | Security | Public AI endpoints (`/api/generate-plan`, `/api/refine-plan`) lacked atomic server-side rate limiting and production Redis enforcement. | OPEN | **RESOLVED** | Atomic Lua script in `lib/security/rateLimiter.ts`; mandatory production Upstash enforcement; 21 unit tests in `tests/rate-limiter.test.ts` including 30-request concurrent race test (5 pass, 25 fail). |
| **VAL-01** | Medium | Code Quality / Validation | `RefinePlanSchema` in `lib/validation/schemas.ts` used `z.any()` for nested plan structures. | OPEN | **RESOLVED** | Concrete sub-schemas extracted and validated in `tests/validation.test.ts` (10 tests passing). |
| **A11Y-01** | Medium | Accessibility | Workspace navigation lacked WAI-ARIA tab semantics (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"`) and roving tabindex keyboard navigation. | OPEN | **RESOLVED** | Tested in `tests/accessibility.test.ts` and automated Playwright E2E Test 6. |
| **A11Y-02** | Low | Accessibility | Dynamic readiness-score updates in `OverviewTab.tsx` lacked accessible screen-reader live announcements. | OPEN | **RESOLVED** | Dedicated live region `<div role="status" aria-live="polite" aria-atomic="true">` added and tested in `tests/accessibility.test.ts`. |
| **QA-01** | Medium | QA / Testing | Lack of automated browser-based end-to-end regression tests. | OPEN | **RESOLVED** | Playwright test framework configured with 10 core regression scenarios in `tests/e2e/gatherly.spec.ts` (10/10 passing). |

---

## 2. Detailed Defect Resolution Analysis

### DEFECT SEC-01: Public AI Endpoints Lack Server-Side Rate Limiting
- **Original Audit Finding:** Any client could send unlimited concurrent or repeated requests to `/api/generate-plan` and `/api/refine-plan`, exhausting API rate limits, incurring high API costs, or destabilizing the server process.
- **Root Cause:** Absence of rate limiting middleware or service layer before reaching AI generation logic.
- **Resolution:**
  - Implemented `lib/security/rateLimiter.ts` using a **single atomic Lua script** (`LUA_SLIDING_WINDOW_SCRIPT`) executed in Upstash Redis REST. Pruning, counting, conditional insertion, and expiration TTL are executed within a single Redis atomic transaction, eliminating race conditions under concurrent requests.
  - Made **Upstash Redis mandatory in production** whenever live Gemini AI is enabled. Silent in-memory fallback is strictly prohibited in production, failing closed (HTTP 503) if unconfigured.
  - Added strict validation of Redis HTTP response status (`res.ok`), command execution error payloads (`data.error`), and return script shape (`Array.isArray(data.result)`).
  - Improved IPv4/IPv6 normalization with port stripping (`normalizeIp`) and isolated unidentified production callers using anonymous fingerprints (`anon-<hash>`) rather than collapsing onto `127.0.0.1`.
  - Added **30-request concurrent race-condition test** in `tests/rate-limiter.test.ts` where with a limit of 5, exactly 5 succeed and 25 fail without race conditions.
  - Returns HTTP 429 Too Many Requests with RFC-compliant `Retry-After` header and sanitized error payload.
- **Status:** **CLOSED — VERIFIED**

---

### DEFECT VAL-01: `RefinePlanSchema` Uses `z.any()` for Nested Plan Fields
- **Original Audit Finding:** `currentPlan: z.record(z.string(), z.any())` allowed arbitrary, invalid, or malformed plan data into the plan refinement pipeline without runtime type checking.
- **Root Cause:** Loose typing during rapid initial prototyping.
- **Resolution:**
  - Replaced `z.any()` with concrete Zod models:
    - `BudgetBreakdownSchema` & `BudgetCategorySchema`
    - `TimelineTaskSchema`
    - `VendorItemSchema` with status enum
    - `ScheduleItemSchema`
    - `PersonalizedIdeaSchema`
    - `RiskContingencySchema`
    - `CurrentPlanSchema`
  - Added length constraints on `modificationRequest` (max 2,000 characters).
  - Maintained full TypeScript inference across refinement route handlers and tests.
- **Status:** **CLOSED — VERIFIED**

---

### DEFECT A11Y-01: Missing WAI-ARIA Tab Semantics and Keyboard Navigation
- **Original Audit Finding:** The workspace navigation buttons rendered as regular buttons without tablist semantics, aria-selected states, aria-controls bindings, tabpanels, or arrow-key navigation.
- **Root Cause:** Standard clickable button UI without WAI-ARIA tab pattern markup.
- **Resolution:**
  - Added `role="tablist"` to the navigation tab bar.
  - Added `role="tab"`, `aria-selected={activeTab === tab.id}`, `aria-controls={"tabpanel-" + tab.id}`, and stable `id={"tab-" + tab.id}` to each tab.
  - Added `tabIndex={activeTab === tab.id ? 0 : -1}` for roving tabindex.
  - Implemented keyboard handler for `ArrowRight`, `ArrowLeft`, `Home`, and `End` keys with wrap-around focus.
  - Wrapped active content in `role="tabpanel"`, `id={"tabpanel-" + activeTab}`, and `aria-labelledby={"tab-" + activeTab}`.
- **Status:** **CLOSED — VERIFIED**

---

### DEFECT A11Y-02: Dynamic Readiness Score Changes Not Announced to Screen Readers
- **Original Audit Finding:** When tasks were toggled or vendors booked, the visual readiness score updated dynamically, but assistive technologies received no status updates.
- **Root Cause:** No `aria-live` or `role="status"` region existed in `OverviewTab.tsx`.
- **Resolution:**
  - Added a dedicated, visually hidden live announcement region:
    `<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">`
  - Managed score updates via React state with initial-mount suppression so screen readers only announce actual user-initiated changes (e.g., "Celebration readiness score is now 45% (mid-planning)").
- **Status:** **CLOSED — VERIFIED**

---

### DEFECT QA-01: Automated Browser Regression Tests Missing
- **Original Audit Finding:** Verification relied strictly on unit tests and manual browser exploration without automated CI/CD-ready browser regression tests.
- **Root Cause:** Playwright was not installed or configured in the baseline repository.
- **Resolution:**
  - Installed `@playwright/test` and installed Chromium headless browser.
  - Configured `playwright.config.ts` targeting local production server.
  - Created `tests/e2e/gatherly.spec.ts` covering 10 distinct end-to-end user flows including dashboard demo loading, creation wizard, budget rebalancing and persistence, timeline task toggles, vendor management, tab keyboard navigation, data export, event isolation, error validation, and mobile responsive viewports.
- **Status:** **CLOSED — VERIFIED**
