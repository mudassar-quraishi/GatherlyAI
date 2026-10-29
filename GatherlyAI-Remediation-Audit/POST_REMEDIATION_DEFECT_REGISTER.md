# Gatherly AI — Post-Remediation Defect Register

**Date:** October 29, 2026  
**Auditor Roles:** Senior Full-Stack Engineer, AppSec Engineer, Accessibility Specialist, QA Automation Lead  
**Baseline Git Commit:** `18edf47` (`main`)  

---

## 1. Summary of Defect Resolutions

| Defect ID | Severity | Category | Description | Baseline Status | Post-Remediation Status | Verification Method |
|:---:|:---:|:---:|---|:---:|:---:|---|
| **SEC-01** | Medium | Security | Public AI endpoints (`/api/generate-plan`, `/api/refine-plan`) lacked server-side rate limiting. | OPEN | **RESOLVED** | Unit tests in `tests/rate-limiter.test.ts` (6 tests passing); HTTP 429 and `Retry-After` verified. |
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
  - Implemented `lib/security/rateLimiter.ts` providing sliding-window rate limiting.
  - Defined per-endpoint policies:
    - `GENERATE_PLAN`: 5 requests per minute per IP.
    - `REFINE_PLAN`: 10 requests per minute per IP.
  - Client IP resolved with proxy support (`x-forwarded-for` leftmost untrusted client IP parsing).
  - Memory store bounded with automatic expiration purging to prevent memory leaks.
  - Returns HTTP 429 Too Many Requests with RFC-compliant `Retry-After` header and sanitized error payload.
  - Documented shared Upstash Redis configuration in `.env.example`.
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
