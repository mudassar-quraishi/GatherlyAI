# Gatherly AI — Current Readiness

**Challenge vertical:** Celebration & Event Planner
**Checked:** November 1, 2026
**Current branch:** `main`
**Status:** Application checks pass; final GitHub submission and live-service checks remain deployment-dependent.

## Verified locally

| Check | Result |
|---|---|
| Vitest unit and integration suite | 66 tests passed across 9 files |
| Playwright browser suite | 10 scenarios passed against the production build |
| TypeScript | `npm run typecheck` passed |
| ESLint | `npm run lint` passed with no warnings |
| Production build | `npm run build` passed |
| Git branches | One local branch, `main`; `origin/main` is the only listed remote branch |

The browser suite is run with a small launcher that starts the production server, runs Playwright, and cleans up the server. Run `npm run test:e2e` to repeat the full check.

## Challenge fit

Gatherly AI selects the Celebration & Event Planner vertical. It uses event type, date, location, guest count, budget, priorities, dietary and accessibility needs, and style preferences to produce a structured plan. Deterministic application logic validates outputs, reconciles budgets, anchors tasks to calendar dates, and calculates readiness. Users can edit and export plans, manage separate events, and use demo mode without API credentials.

## Remaining verification and deployment items

- Live Gemini calls and production Upstash Redis have not been tested because deployment credentials are not configured in this checkout.
- The npm production dependency audit could not reach the registry in the current network environment; dependency vulnerability status is unverified.
- Confirm the final GitHub repository is public, has exactly one branch, and remains below the challenge's 10 MB repository limit after the final push.
- Deploy through Vercel after setting `GEMINI_API_KEY` and `GEMINI_MODEL` for live AI. Add both Upstash REST variables when live AI is enabled in production. Demo mode needs no provider credentials.

No official benchmark score is claimed here. The self-assessment in `GatherlyAI-Remediation-Audit/POST_REMEDIATION_SCORECARD.md` is indicative only.
