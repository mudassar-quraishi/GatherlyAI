# Indicative Challenge Self-Assessment

**Checked:** November 1, 2026
**Selected vertical:** Celebration & Event Planner
**Scale:** 0–10 per area; unweighted estimate, not an official PromptWars score.

| Evaluation area | Estimate | Evidence | Main remaining gap |
|---|---:|---|---|
| Code quality | 8.5 | Strict TypeScript, bounded Zod schemas, separated planning logic, clean lint and typecheck | Keep implementation/status documents synchronized and review dependency updates |
| Security | 8.0 | Server-side API key use, request validation, hashed rate-limit identifiers, fail-closed production rate limiting, generic provider errors | Live Gemini/Upstash deployment and dependency audit are unverified |
| Efficiency | 8.5 | Integer-based budget reconciliation, deterministic demo mode, bounded in-memory rate-limit store | No production load or provider-cost measurements |
| Testing | 8.5 | 66 unit/integration tests, 10 browser scenarios, production build, typecheck, lint, and a GitHub Actions workflow | Live provider behavior and screen-reader testing need an equipped environment; CI has not run on GitHub yet |
| Accessibility | 8.0 | Keyboard-operable WAI-ARIA tabs, persistent readiness announcements, labeled refinement input, mobile regression coverage | No automated axe scan or manual screen-reader audit |
| Problem alignment and usability | 9.5 | End-to-end event planning for weddings, birthdays, and community gatherings; budgets, timelines, vendors, run sheets, editing, export, and demo mode | Validate the assumptions and estimate quality with real organizers |
| **Unweighted mean** | **8.5** | Average of the six estimates above | Contest scoring weights and judge interpretation are unknown |

## Highest-value remaining work

1. Deploy a public demo with live AI protected by production rate limiting, then exercise generation and refinement with test data.
2. Run a dependency audit when npm registry access is available and record the actual result.
3. Ask organizers to complete a short usability task; fix any discovered keyboard, screen-reader, or planning-flow friction.
4. Verify the final public GitHub URL, one-branch rule, and repository size after the final submission push.

These estimates are an engineering self-review, not a promise of marks. The challenge brief does not define numeric scoring weights.
