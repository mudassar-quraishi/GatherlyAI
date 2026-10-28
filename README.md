# Gatherly AI

**Tagline:** Every celebration, thoughtfully planned.

Gatherly AI is a GenAI-powered celebration and event planning assistant built for the hackathon challenge. It empowers organizers, couples, families, and community leaders to turn celebration concepts into actionable, stress-free plans with numerically reconciled budgets, date-anchored timelines, supplier guidance, chronological run sheets, and personalized inspiration.

---

## Table of Contents
1. [Problem Statement & Vision](#1-problem-statement--vision)
2. [Target Users](#2-target-users)
3. [Key Features & What Makes Gatherly AI Unique](#3-key-features--what-makes-gatherly-ai-unique)
4. [Technology Stack](#4-technology-stack)
5. [Architecture & Data Flow](#5-architecture--data-flow)
6. [Quick Start & Local Installation](#6-quick-start--local-installation)
7. [Configuring Google Gemini GenAI](#7-configuring-google-gemini-genai)
8. [Deterministic Demo Mode](#8-deterministic-demo-mode)
9. [Running Tests, Linting & Production Build](#9-running-tests-linting--production-build)
10. [Deployment Guide (Vercel)](#10-deployment-guide-vercel)
11. [Security, Reliability & Privacy](#11-security-reliability--privacy)
12. [Known Limitations](#12-known-limitations)
13. [Hackathon Submission Checklist](#13-hackathon-submission-checklist)

---

## 1. Problem Statement & Vision

**Official Brief:**
> "Celebration & Event Planner: Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas."

**Our Solution:**
Planning significant personal and community celebrations usually collapses into fragmented spreadsheets, unverified estimates, and panic. Generic LLMs merely generate walls of text that lack numerical consistency and calendar awareness.

Gatherly AI pairs **Google Gemini GenAI** with **deterministic application logic**:
- **Generative AI** generates tailored concepts, structured categories, vendor criteria, and personalized ideas.
- **Deterministic Math Engines** compute integer minor currency units (paise/cents) to ensure zero rounding error, enforce contingency buffers, and flag overspending.
- **Calendar Logic** anchors tasks to real event dates with timezone-safe UTC math and accelerated short-notice scheduling.

---

## 2. Target Users

1. **Couples & Wedding Hosts:** Planning multi-ceremony weddings, engagement dinners, and receptions with multi-vendor coordination and dietary accommodations.
2. **Families Celebrating Milestones:** Organizing milestone birthdays (1st, 18th, 30th, 50th, 80th), golden anniversaries, and family reunions.
3. **Community & Non-profit Organizers:** Organizing neighborhood socials, charity fundraisers, festival banquets, and cultural celebrations.

---

## 3. Key Features & What Makes Gatherly AI Unique

### A. Central Dashboard & Multi-Event Isolation
- Overview of all active celebrations with aggregated budget metrics and overall task progress.
- Clean event cards with data-driven readiness score badges and category tags.
- Safe browser-local storage with support for creating, updating, and deleting multiple independent events.

### B. 3-Step Create Event Wizard
- **Step 1 (Basics):** Event name, type (Wedding, Birthday, Anniversary, Community, Fundraiser, Other), date, duration, location, guest count.
- **Step 2 (Budget & Style):** Target budget defaulting to Indian Rupees (₹) with multi-currency support, theme/aesthetic, venue environment (indoor, outdoor, mixed), and desired atmosphere.
- **Step 3 (Personalization):** Priority selection (Food, Photography, Decor, Music, Accessibility, Sustainability, Cost discipline), dietary accommodations, accessibility needs, and traditions.

### C. Smart Budget Guardian
- Reconciles category allocations with target budget using integer minor currency units (`totalAllocated + unallocated === totalBudget`).
- Editable category planned allocations and actual invoice spending.
- Visual proportional distribution stack bar.
- Automatic alerts for overspending, over-allocation, or contingency reserves falling below the recommended 5–10% safety cushion.

### D. Date-Aware Timeline & Task Manager
- Milestones anchored to celebration dates with realistic planning stages (Initial Planning, Early Preparations, 2–4 Weeks Before, Final Week, Day Before, Event Day, Post-Event).
- Adaptive schedule acceleration for short-notice events (prevents setting past due dates).
- Interactive completion checkboxes that instantly update overall progress.
- Status and priority filtering with custom task creation and editing.

### E. Vendor Checklist Guidance
- Event-specific requirements outlining what you need, why it matters, target booking deadlines, and priorities.
- Status management: *Needed*, *Contacted*, *Confirmed*, or *Not Required*.
- Supplier notes for recording personal phone numbers, quotes, or deposit records.
- Explicitly avoids fabricating fake directory listings or fake vendor quotes.

### F. Chronological Event-Day Run Sheet
- Ordered timetable from morning load-in through to evening wrap-up.
- Activity start and end times, descriptions, responsible leads, and staging cues.
- Printer-friendly layout suitable for sharing with emcees, caterers, and family coordinators.

### G. AI Refinement Studio
- Real-time plan modifications dispatching structured prompts to the AI backend.
- Presets: *More Budget-Friendly*, *Elevate Elegance*, *Eco-Friendly & Zero-Waste*, *Strengthen Rain Contingency*, *Child-Friendly*, and *Custom Prompts*.
- Updates the relevant plan section without wiping out user changes.

### H. Data-Driven Preparation Readiness Score
- Transparent 0–100% calculation based on:
  - 35% Task Completion (overall + high-priority tasks)
  - 25% Vendor Confirmations
  - 20% Schedule Run Sheet Completeness
  - 20% Budget Integrity & Contingency Buffer

### I. Export & Sharing
- **1-Click Print Run Sheet:** Clean `@media print` layout that automatically hides navbars and buttons.
- **Download JSON Backup:** Export complete event plan data for offline backup or migration.
- **Copy Plain-Text Summary:** Formatted plain-text digest ready to paste into WhatsApp, email, or notes.

---

## 4. Technology Stack

- **Framework:** Next.js 16.4 (App Router with partial prerendering & cacheComponents)
- **Language:** TypeScript 5 (Strict type checking, zero `any` in critical logic)
- **Styling:** Tailwind CSS v4 with custom warm planning studio theme tokens
- **Icons:** Lucide React
- **GenAI SDK:** Google's official `@google/genai` SDK (`gemini-2.5-flash`)
- **Validation:** Zod 4 for strict server-side request/response schema validation
- **Persistence:** Browser `localStorage` with resilient error handling and zero server-side PII storage
- **Test Runner:** Vitest 5 with `@testing-library/react` and `jsdom`

---

## 5. Architecture & Data Flow

```mermaid
flowchart TD
    User([User / Event Host]) -->|1. Inputs Event Details| Wizard[Create Event Wizard]
    Wizard -->|2. Saves Event| Storage[(Browser localStorage)]
    
    Wizard -->|3. Navigates| Workspace[Event Workspace]
    
    Workspace -->|4. Request Plan| API["Next.js Route /api/generate-plan"]
    
    API -->|5. Check GEMINI_API_KEY| Decision{API Key Available?}
    
    Decision -->|Yes| Gemini["Google Gemini 2.5 Flash (@google/genai)"]
    Decision -->|No / Rate Limited| DemoEngine[Deterministic Sample Provider]
    
    Gemini -->|Validates JSON Output| ZodSchema[Zod Schema Validation]
    ZodSchema --> EngineNormalization[Budget & Timeline Normalizers]
    DemoEngine --> EngineNormalization
    
    EngineNormalization -->|Integer Minor Units & Safe Dates| Storage
    Storage -->|Renders State| UIComponents["Workspace Tabs (Budget, Timeline, Vendors, Schedule, Ideas)"]
    
    User -->|6. Interactive Edits| UIComponents
    UIComponents -->|7. Auto-save & Reconcile| Storage
    
    User -->|8. AI Refinement| RefineAPI["/api/refine-plan"]
    RefineAPI --> Gemini
```

---

## 6. Quick Start & Local Installation

### Prerequisites
- Node.js `v20.x` or later (tested on Node v26)
- npm `v10.x` or later

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/gatherly-ai.git
   cd gatherly-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional for Live AI):**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run Production Build:**
   ```bash
   npm run build
   npm run start
   ```

---

## 7. Configuring Google Gemini GenAI

Gatherly AI uses the official Google GenAI SDK (`@google/genai`).

1. Visit [Google AI Studio](https://aistudio.google.com/) and sign in with your Google account.
2. Click **Get API key** and generate a new key.
3. Paste the key into `.env.local`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   GEMINI_MODEL=gemini-2.5-flash
   ```
4. Restart your development or production server.
5. In Gatherly AI, the top navigation bar will show a green **Gemini 2.5 Active** pill.
6. The key is accessed exclusively server-side in API routes and is **never** leaked to client-side bundles or network payloads.

---

## 8. Deterministic Demo Mode

Gatherly AI provides a first-class **Deterministic Demo Mode**:
- **Zero Configuration Required:** If no `GEMINI_API_KEY` is configured, the application functions seamlessly without error dialogs or dead buttons.
- **1-Click Preloaded Demo Event:** On the dashboard, clicking **"Explore Sample Event (1-Click Demo)"** or **"Load Demo Event"** instantly loads *"Aarav & Meera's Lakeside Wedding"*, complete with an 8-category reconciled budget, 10-step date-anchored timeline, 5 essential suppliers, an 8-stage run sheet, and personalized ideas.
- **Clear Labeling:** Plans generated or refined in demo mode are visibly badged as `Demo Mode (Deterministic)` or `Curated Sample Plan` so evaluators are never misled.

---

## 9. Running Tests, Linting & Production Build

### Unit & Integration Tests (Vitest)
```bash
npm run test
```
Runs 24 tests across 6 suites validating budget math, calendar timezone safety, Zod schemas, localStorage persistence, and sample generators.

### TypeScript Type Checking
```bash
npm run typecheck
```
Executes `tsc --noEmit` across all App Router routes and modules with zero type errors.

### ESLint Linting
```bash
npm run lint
```
Runs Next.js ESLint with 0 errors and 0 warnings.

### Production Build
```bash
npm run build
```
Generates Turbopack-optimized production output with static and partial prerendering.

---

## 10. Deployment Guide (Vercel)

Gatherly AI is optimized for 1-click deployment on [Vercel](https://vercel.com):

1. Push your repository to GitHub.
2. Import the project in Vercel.
3. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google AI Studio API key)*
   - `GEMINI_MODEL`: `gemini-2.5-flash`
4. Click **Deploy**.
5. Vercel automatically builds the Next.js App Router application and provides a fast global edge deployment.

---

## 11. Security, Reliability & Privacy

- **No Public API Key Exposure:** The Gemini API key is read solely server-side via `process.env.GEMINI_API_KEY`. It is never exposed in client bundles or network responses.
- **Server-Side Input Validation:** All API requests pass through Zod schemas with bounded numerical limits, guest count checks (1–50,000), date regex, and string length caps.
- **Zero Third-Party Database PII:** User celebration data remains strictly inside the user's browser `localStorage`. No personal guest names or contact information are stored on external databases.
- **Graceful Error Handling:** If Gemini API experiences rate limits or timeouts, the server returns an informative message and falls back to our curated demo provider rather than crashing.

---

## 12. Known Limitations

- **Browser-Local Scope:** Because data is persisted in browser `localStorage`, event plans are isolated to the specific browser and device. Cross-device cloud sync is intentionally omitted in this hackathon MVP.
- **Planning Guidance vs. Live Marketplace:** Gatherly AI generates strategic vendor criteria and requirements; it does not book live vendors, process credit card payments, or scrape live supplier inventories.

---

## 13. Hackathon Submission Checklist

- [x] **Functional Web Application:** Fully runnable locally and Vercel-ready.
- [x] **Repository Size:** Under 10 MB (Verified source size: **0.724 MB**).
- [x] **Walkthrough Demo Video Script:** Complete 3:40 script in [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).
- [x] **No Login Required:** Accessible to evaluators immediately with 1-click demo preloading.
- [x] **Genuine Functionality:** Editable budgets, task toggles, vendor statuses, schedule editor, AI plan generation & refinement.
- [x] **Code Quality & Testing:** 24/24 Vitest tests passing, 0 TypeScript errors, 0 ESLint warnings.
- [x] **Problem Statement Alignment:** Weddings, birthdays, and community events with budgets, timelines, vendors, and ideas.
