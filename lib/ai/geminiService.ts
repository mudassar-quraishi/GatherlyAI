import { GoogleGenAI } from '@google/genai';
import { EventDetails, EventPlan } from '@/types/event';
import { AIPlanOutputSchema } from '@/lib/validation/schemas';
import { normalizeBudgetBreakdown } from '@/lib/budget/calculator';
import { normalizeTimelineTasks } from '@/lib/timeline/calculator';
import { generateSamplePlan } from '@/lib/ai/sampleProvider';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Checks if the Gemini API key is configured on the server.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
}

/**
 * Builds the comprehensive prompt for generating a complete, actionable event plan.
 */
function buildPlanGenerationPrompt(event: EventDetails): string {
  return `You are an expert personal celebration and event coordinator for Gatherly AI.
Your goal is to build a highly actionable, thoughtful, and realistic event plan for the following event:

EVENT DETAILS:
- Name: ${event.name}
- Type: ${event.eventType}
- Date: ${event.date}
- Duration: ${event.duration}
- Location: ${event.location}
- Guest Count: ${event.guestCount} guests
- Total Budget: ${event.currency} ${event.totalBudget}
- Theme & Style: ${event.styleTheme}
- Venue Type: ${event.venueType}
- Atmosphere: ${event.atmosphere}
- Priorities: ${event.priorities.join(', ')}
${event.dietaryRequirements ? `- Dietary Requirements: ${event.dietaryRequirements}` : ''}
${event.accessibilityRequirements ? `- Accessibility Requirements: ${event.accessibilityRequirements}` : ''}
${event.specialActivities ? `- Special Activities / Cultural Preferences: ${event.specialActivities}` : ''}
${event.additionalNotes ? `- Additional Notes: ${event.additionalNotes}` : ''}

INSTRUCTIONS:
1. Provide practical, high-value recommendations specific to this event type, location, and guest count.
2. Budget allocations must be realistic and sum up close to the total budget of ${event.currency} ${event.totalBudget}. Always include a Contingency category (5–10% of total budget).
3. Timeline tasks must have due dates on or before the event date (${event.date}) using YYYY-MM-DD format. Assign realistic stages (initial-planning, early-preparations, month-before, final-week, day-before, event-day, post-event).
4. Vendor checklist must guide the user on what to look for, why it matters, realistic booking deadlines, and sensible priorities.
5. Event-day schedule must be chronologically ordered with realistic start and end times, specific activities, and notes.
6. Return ONLY a valid JSON object matching the requested schema. Do not include markdown code block formatting or backticks.

SCHEMA REQUIREMENTS:
{
  "eventSummary": string,
  "themeIdeas": {
    "name": string,
    "description": string,
    "colorPalette": string[],
    "vibeKeywords": string[]
  },
  "budgetBreakdown": {
    "categories": [
      {
        "name": string,
        "allocatedAmount": number,
        "isEssential": boolean,
        "notes": string
      }
    ],
    "notes": string
  },
  "timelineTasks": [
    {
      "title": string,
      "description": string,
      "stage": "initial-planning" | "early-preparations" | "month-before" | "final-week" | "day-before" | "event-day" | "post-event",
      "dueDate": "YYYY-MM-DD",
      "priority": "high" | "medium" | "low",
      "category": string,
      "owner": string
    }
  ],
  "vendorChecklist": [
    {
      "category": string,
      "title": string,
      "needDescription": string,
      "whyItMatters": string,
      "bookingDeadline": "YYYY-MM-DD",
      "priority": "high" | "medium" | "low",
      "status": "needed",
      "estimatedCost": number,
      "notes": string
    }
  ],
  "eventDaySchedule": [
    {
      "startTime": string,
      "endTime": string,
      "activity": string,
      "description": string,
      "responsiblePerson": string,
      "notes": string
    }
  ],
  "personalizedIdeas": [
    {
      "category": string,
      "title": string,
      "description": string,
      "whyItFits": string,
      "tags": string[]
    }
  ],
  "risksAndContingencies": [
    {
      "risk": string,
      "plan": string,
      "severity": "low" | "medium" | "high"
    }
  ]
}`;
}

/**
 * Builds the prompt for plan refinement.
 */
function buildPlanRefinementPrompt(
  event: EventDetails,
  currentPlan: EventPlan,
  modificationType: string,
  customPrompt?: string
): string {
  return `You are Gatherly AI's senior event planner.
Refine the existing event plan according to the user's specific goal.

EVENT CONTEXT:
- Name: ${event.name} (${event.eventType})
- Total Budget: ${event.currency} ${event.totalBudget}
- Guest Count: ${event.guestCount}
- Date: ${event.date}
- Location: ${event.location}

MODIFICATION REQUEST:
- Goal: ${modificationType}
${customPrompt ? `- Specific Instructions: ${customPrompt}` : ''}

CURRENT PLAN SUMMARY:
${currentPlan.eventSummary}

CURRENT BUDGET CATEGORIES:
${JSON.stringify(currentPlan.budgetBreakdown.categories.map((c) => ({ name: c.name, amount: c.allocatedAmount })))}

INSTRUCTIONS:
- Update the plan thoughtfully to achieve the goal (e.g. if 'budget-friendly', reallocate costs to save money without sacrificing hospitality; if 'eco-friendly', introduce zero-waste ideas and sustainable vendors; if 'rain-contingency', strengthen weather backups and indoor run sheets).
- Preserve user-relevant details while updating the budget allocations, personalized ideas, timeline tasks, vendor recommendations, or schedule.
- Return ONLY a valid JSON object matching the full event plan schema.`;
}

/**
 * Core plan generation function calling Gemini API or falling back gracefully.
 */
export async function generateEventPlanWithAI(event: EventDetails): Promise<{
  plan: EventPlan;
  source: 'live-ai' | 'demo';
  notice?: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    // Graceful fallback to deterministic demo provider
    const sample = generateSamplePlan(event);
    return {
      plan: sample,
      source: 'demo',
      notice: 'Gemini API key is not configured on the server. Loaded realistic sample plan in Demo Mode.',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPlanGenerationPrompt(event);

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    const rawText = response.text || '';
    if (!rawText) {
      throw new Error('Empty response received from Gemini model');
    }

    // Parse and validate output
    const parsedJson = JSON.parse(rawText);
    const validated = AIPlanOutputSchema.parse(parsedJson);

    // Apply normalization & business rules
    const normalizedBudget = normalizeBudgetBreakdown(
      event.totalBudget,
      validated.budgetBreakdown.categories.map((c, i) => ({
        id: `cat-ai-${i}-${Date.now()}`,
        name: c.name,
        allocatedAmount: c.allocatedAmount,
        actualSpent: 0,
        isEssential: c.isEssential ?? true,
        notes: c.notes,
      }))
    );

    const normalizedTimeline = normalizeTimelineTasks(
      validated.timelineTasks.map((t, i) => ({
        id: `task-ai-${i}-${Date.now()}`,
        title: t.title,
        description: t.description,
        stage: t.stage,
        dueDate: t.dueDate,
        priority: t.priority,
        status: 'todo' as const,
        category: t.category,
        owner: t.owner,
      })),
      event.date
    );

    const finalPlan: EventPlan = {
      eventSummary: validated.eventSummary,
      themeIdeas: validated.themeIdeas,
      budgetBreakdown: normalizedBudget,
      timelineTasks: normalizedTimeline,
      vendorChecklist: validated.vendorChecklist.map((v, i) => ({
        id: `vendor-ai-${i}-${Date.now()}`,
        category: v.category,
        title: v.title,
        needDescription: v.needDescription,
        whyItMatters: v.whyItMatters,
        bookingDeadline: v.bookingDeadline,
        priority: v.priority,
        status: v.status || 'needed',
        estimatedCost: v.estimatedCost,
        notes: v.notes,
      })),
      eventDaySchedule: validated.eventDaySchedule.map((s, i) => ({
        id: `sched-ai-${i}-${Date.now()}`,
        startTime: s.startTime,
        endTime: s.endTime,
        activity: s.activity,
        description: s.description,
        responsiblePerson: s.responsiblePerson,
        notes: s.notes,
      })),
      personalizedIdeas: validated.personalizedIdeas.map((idea, i) => ({
        id: `idea-ai-${i}-${Date.now()}`,
        category: idea.category,
        title: idea.title,
        description: idea.description,
        whyItFits: idea.whyItFits,
        tags: idea.tags,
      })),
      risksAndContingencies: validated.risksAndContingencies,
      generatedAt: new Date().toISOString(),
      generationSource: 'live-ai',
      modelUsed: DEFAULT_MODEL,
    };

    return {
      plan: finalPlan,
      source: 'live-ai',
    };
  } catch (err: unknown) {
    console.error('[GatherlyAI Gemini Service Error]:', err);
    // Graceful fallback to demo provider if live AI fails or rate limits
    const sample = generateSamplePlan(event);
    const errorMessage = err instanceof Error ? err.message : 'Unknown AI error';
    return {
      plan: sample,
      source: 'demo',
      notice: `Live AI service encountered an issue (${errorMessage}). Loaded realistic sample plan in Demo Mode.`,
    };
  }
}

/**
 * Refines an existing plan with specific modification instructions.
 */
export async function refineEventPlanWithAI(
  event: EventDetails,
  currentPlan: EventPlan,
  modificationType: string,
  customPrompt?: string
): Promise<{
  plan: EventPlan;
  source: 'live-ai' | 'demo';
  notice?: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    // In demo mode, apply an intelligent deterministic refinement
    const refinedSample = generateSamplePlan({
      ...event,
      styleTheme: `${event.styleTheme} (${modificationType})`,
    });

    return {
      plan: {
        ...refinedSample,
        eventSummary: `[Refined for ${modificationType}] ${refinedSample.eventSummary}`,
        generationSource: 'demo',
        lastRefinedAt: new Date().toISOString(),
      },
      source: 'demo',
      notice: 'Gemini API key is not configured. Applied deterministic refinement in Demo Mode.',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPlanRefinementPrompt(event, currentPlan, modificationType, customPrompt);

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    const rawText = response.text || '';
    const parsedJson = JSON.parse(rawText);
    const validated = AIPlanOutputSchema.parse(parsedJson);

    // Merge categories preserving any existing user actual spent amounts
    const spentMap = new Map<string, number>();
    currentPlan.budgetBreakdown.categories.forEach((cat) => {
      spentMap.set(cat.name.toLowerCase(), cat.actualSpent);
    });

    const normalizedBudget = normalizeBudgetBreakdown(
      event.totalBudget,
      validated.budgetBreakdown.categories.map((c, i) => ({
        id: `cat-ref-${i}-${Date.now()}`,
        name: c.name,
        allocatedAmount: c.allocatedAmount,
        actualSpent: spentMap.get(c.name.toLowerCase()) || 0,
        isEssential: c.isEssential ?? true,
        notes: c.notes,
      }))
    );

    const normalizedTimeline = normalizeTimelineTasks(
      validated.timelineTasks.map((t, i) => ({
        id: `task-ref-${i}-${Date.now()}`,
        title: t.title,
        description: t.description,
        stage: t.stage,
        dueDate: t.dueDate,
        priority: t.priority,
        status: 'todo' as const,
        category: t.category,
        owner: t.owner,
      })),
      event.date
    );

    const refinedPlan: EventPlan = {
      eventSummary: validated.eventSummary,
      themeIdeas: validated.themeIdeas,
      budgetBreakdown: normalizedBudget,
      timelineTasks: normalizedTimeline,
      vendorChecklist: validated.vendorChecklist.map((v, i) => ({
        id: `vendor-ref-${i}-${Date.now()}`,
        category: v.category,
        title: v.title,
        needDescription: v.needDescription,
        whyItMatters: v.whyItMatters,
        bookingDeadline: v.bookingDeadline,
        priority: v.priority,
        status: v.status || 'needed',
        estimatedCost: v.estimatedCost,
        notes: v.notes,
      })),
      eventDaySchedule: validated.eventDaySchedule.map((s, i) => ({
        id: `sched-ref-${i}-${Date.now()}`,
        startTime: s.startTime,
        endTime: s.endTime,
        activity: s.activity,
        description: s.description,
        responsiblePerson: s.responsiblePerson,
        notes: s.notes,
      })),
      personalizedIdeas: validated.personalizedIdeas.map((idea, i) => ({
        id: `idea-ref-${i}-${Date.now()}`,
        category: idea.category,
        title: idea.title,
        description: idea.description,
        whyItFits: idea.whyItFits,
        tags: idea.tags,
      })),
      risksAndContingencies: validated.risksAndContingencies,
      generatedAt: currentPlan.generatedAt,
      generationSource: 'live-ai',
      modelUsed: DEFAULT_MODEL,
      lastRefinedAt: new Date().toISOString(),
    };

    return {
      plan: refinedPlan,
      source: 'live-ai',
    };
  } catch (err: unknown) {
    console.error('[GatherlyAI Refinement Error]:', err);
    const errorMessage = err instanceof Error ? err.message : 'Refinement error';
    return {
      plan: {
        ...currentPlan,
        lastRefinedAt: new Date().toISOString(),
      },
      source: 'demo',
      notice: `Refinement encountered an issue (${errorMessage}). Preserved your current plan.`,
    };
  }
}
