# Current Verification Record

**Checked:** November 1, 2026
**Project:** Gatherly AI
**Selected vertical:** Celebration & Event Planner

This file records local checks run in the current checkout. It is not an independent audit, a security certification, or an official contest result.

## PromptWars portal baseline

The latest user-provided PromptWars screenshot shows **96.72/100**: Code Quality 88, Security 99, Efficiency 100, Testing 99, Accessibility 99, and Problem Statement Alignment 100. The earlier submitted version scored **94.35/100** (Code Quality 88, Security 99, Efficiency 100, Testing 98, Accessibility 98, Alignment 93). The code changes recorded below have not been submitted, so they have no portal score yet. The user reported two submission attempts remained; this work did not consume one.

## Automated checks

| Command | Result |
|---|---|
| `npm run test` | 78 tests passed across 10 files |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed; no warnings reported |
| `npm run build` | Passed |
| `npm run test:e2e` | 10 browser scenarios passed against the production build; command exited 0 |
| `npm run verify` | Passed the combined type, lint, unit, build, and browser sequence |

The latest `npm run verify` passed. Browser scenarios cover dashboard loading, event creation, budget and task persistence, vendor notes, accessible workspace tabs, JSON export, event isolation, validation feedback, and mobile layout. Vitest is capped at two workers to avoid worker-start timeouts in this Windows environment.

## Repository submission checks

- GitHub repository: [public](https://github.com/mudassar-quraishi/GatherlyAI).
- Remote branch check: exactly one branch, `main` (`git ls-remote --heads origin`).
- Local `.git` directory measured under 1 MiB, below the 10 MB limit.
- Local checkout is clean and tracks `origin/main`.

## Not verified in this environment

- Live Gemini API behavior: no API key is configured.
- Production Upstash Redis behavior: no production credentials are configured.
- Dependency vulnerability status: `npm audit --omit=dev` could not reach the npm registry, so no audit result is claimed.
- The GitHub Actions workflow is committed to `main`; its first hosted run has not yet been verified.

These automated checks do not predict a PromptWars score; only the portal can provide a new score after a submission.
