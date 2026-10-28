# Gatherly AI — Walkthrough Demo Video Script

**Target Duration:** 3 minutes 40 seconds (under 4:00 limit)  
**Product:** Gatherly AI  
**Tagline:** *Every celebration, thoughtfully planned.*  
**Host Persona:** Senior Full-Stack Engineer / Product Architect  

---

## Video Timeline & Script

### 0:00 – 0:20 | Introduction & Problem Statement
- **Visual:** Open browser to `http://localhost:3000` showing Gatherly AI's clean planning studio dashboard.
- **Narrator (Spoken):**
  > "Organizing a celebration—whether a royal wedding, milestone birthday, or community gala—often turns into a chaotic scramble across disconnected spreadsheets, budget notes, and chat threads.
  > Welcome to Gatherly AI. Gatherly is an intelligent personal event coordinator that transforms your celebration ideas into an actionable, numerically consistent event plan with real-time budget tracking, date-anchored timelines, and tailored supplier guidance."

---

### 0:20 – 0:55 | Create an Event (3-Step Creation Wizard)
- **Visual:** Click **"Create an Event"** in the top navbar.
- **Narrator (Spoken):**
  > "Let's plan a milestone celebration: a lakeside wedding reception.
  > In **Step 1 (Event Basics)**, we enter the event name: *'Aarav & Meera’s Lakeside Reception'*, select the *Wedding* category, choose our date, set our duration to a full day, location to *'Udaipur Lakeside'*, and head count to *180 guests*.
  > In **Step 2 (Budget & Style)**, we specify our budget in Indian Rupees: *₹8,50,000*, select *'Elegant Traditional with Botanical Accents'*, a hybrid indoor-outdoor venue, and a warm, celebratory atmosphere.
  > In **Step 3 (Personalization)**, we select our top priorities: *Exquisite Food*, *Candid Photography*, and *Decor*. We can also note dietary needs—60% vegetarian with Jain counters—and wheelchair ramp accessibility.
  > Clicking **'Create Event Workspace'** initializes our dedicated celebration workspace."

---

### 0:55 – 1:35 | Generate a Structured Plan (GenAI & Demo Engine)
- **Visual:** In the event workspace, click **"Generate Plan with AI"** (or point out the 1-click **"Load Demo Event"** for offline evaluators).
- **Narrator (Spoken):**
  > "Gatherly AI sends our validated parameters to Google's official `@google/genai` SDK using Gemini 2.5 Flash on the server. If no API key is provided, Gatherly seamlessly falls back to our deterministic demo provider with zero dead screens.
  > Notice the generated plan: an executive strategic summary, a tailored color harmony palette with hex swatches, and our initial Preparation Readiness Score calculated from genuine event data."

---

### 1:35 – 2:20 | Smart Budget Guardian & Reconciled Allocations
- **Visual:** Switch to the **"Budget Planner"** tab. Highlight the category distribution stack bar. Click "Edit" on a category and update the allocated and actual spent amounts.
- **Narrator (Spoken):**
  > "Under the hood, event budgets must be numerically reliable. Gatherly calculates money using integer minor currency units—paise and cents—to eliminate floating-point rounding errors.
  > Notice our category breakdown: Venue, Catering, Decor, Photography, and a dedicated 6% Contingency Reserve.
  > If we adjust our Catering allocation or record an actual invoice payment, the remaining budget, variance, and stack distribution reconcile instantly. If spending ever exceeds target budget, the Smart Budget Guardian surfaces a clear overspending alert."

---

### 2:20 – 2:55 | Organize Execution: Timeline, Vendors & Day Run Sheet
- **Visual:** 
  1. Switch to **"Timeline & Tasks"** tab: toggle a checkbox on a task, showing the progress bar advance.
  2. Switch to **"Vendor Checklist"** tab: change a vendor status from *Needed* to *Contacted* or *Confirmed*.
  3. Switch to **"Day Schedule"** tab: showcase the ordered run sheet with start and end times and responsible coordinators.
- **Narrator (Spoken):**
  > "Next, our timeline automatically anchors to the celebration date, dynamically adapting to accelerated stages if your event is on short notice. Marking tasks done immediately increases our Preparation Readiness Score.
  > In the Vendor Checklist, we get practical booking deadlines and guidance—not fabricated supplier directories, but real requirements for what to look for and why it matters.
  > The Day Schedule provides a minute-by-minute run sheet for emcees and family coordinators, from morning load-in to evening cake-cutting and send-off."

---

### 2:55 – 3:25 | Personalized Refinements with Real AI
- **Visual:** Switch to **"Ideas & Refinement"** tab. Click **"More Budget-Friendly"** or **"Eco-Friendly & Zero-Waste"**, showing the refinement request update the plan.
- **Narrator (Spoken):**
  > "Under Personalized Ideas, Gatherly suggests unique concepts like an audio guestbook station and seed paper favors.
  > Even better, the Refinement Studio allows one-click modifications—like making the celebration more budget-friendly or adding a rain contingency plan. This dispatches real input to the AI endpoint to re-balance allocations and update advice without clobbering user edits."

---

### 3:25 – 3:40 | Export, Print & Closing
- **Visual:** Click **"Copy Summary"**, click **"Backup JSON"**, and trigger the **"Print Run Sheet"** dialog showing the clean print layout.
- **Narrator (Spoken):**
  > "Finally, organizers can export a full JSON backup, copy a plain-text briefing for WhatsApp or email, or print a distraction-free run sheet.
  > Gatherly AI: turning celebration dreams into organized, stress-free reality. Thank you!"

---

## Recording Checklist for Presenters
- [ ] Ensure browser is at 1080p (1920x1080) resolution.
- [ ] Preload sample event or test live Gemini generation.
- [ ] Test audio input levels for crisp voice narration.
- [ ] Keep video runtime under 3 minutes 50 seconds.
