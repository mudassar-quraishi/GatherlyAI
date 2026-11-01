import { NextRequest, NextResponse } from 'next/server';
import { CurrentPlanSchema, RefinePlanSchema } from '@/lib/validation/schemas';
import { refineEventPlanWithAI } from '@/lib/ai/geminiService';
import type { EventDetails, EventPlan } from '@/types/event';
import { checkRateLimit, RATE_LIMIT_POLICIES, getClientIdentifier } from '@/lib/security/rateLimiter';
import { normalizeBudgetBreakdown } from '@/lib/budget/calculator';
import { z } from 'zod';

function toEventPlan(data: z.infer<typeof CurrentPlanSchema>, totalBudget: number): EventPlan {
  const budgetBreakdown = normalizeBudgetBreakdown(
    totalBudget,
    data.budgetBreakdown.categories.map((category, index) => ({
      id: category.id ?? `refine-input-budget-${index + 1}`,
      name: category.name,
      allocatedAmount: category.allocatedAmount,
      actualSpent: category.actualSpent,
      isEssential: category.isEssential,
      notes: category.notes,
    }))
  );

  return {
    eventSummary: data.eventSummary,
    themeIdeas: data.themeIdeas,
    budgetBreakdown,
    timelineTasks: data.timelineTasks.map((task, index) => ({
      ...task,
      id: task.id ?? `refine-input-task-${index + 1}`,
    })),
    vendorChecklist: data.vendorChecklist.map((vendor, index) => ({
      ...vendor,
      id: vendor.id ?? `refine-input-vendor-${index + 1}`,
    })),
    eventDaySchedule: data.eventDaySchedule.map((item, index) => ({
      ...item,
      id: item.id ?? `refine-input-schedule-${index + 1}`,
    })),
    personalizedIdeas: data.personalizedIdeas.map((idea, index) => ({
      ...idea,
      id: idea.id ?? `refine-input-idea-${index + 1}`,
    })),
    risksAndContingencies: data.risksAndContingencies,
    generatedAt: data.generatedAt ?? new Date().toISOString(),
    generationSource: data.generationSource ?? 'demo',
    modelUsed: data.modelUsed,
    lastRefinedAt: data.lastRefinedAt,
  };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce server-side rate limiting
    const clientId = getClientIdentifier(req.headers);
    const rateLimit = await checkRateLimit(clientId, RATE_LIMIT_POLICIES.REFINE_PLAN);

    if (!rateLimit.success) {
      const status = rateLimit.limiterFailure ? 503 : 429;
      return NextResponse.json(
        {
          error: rateLimit.limiterFailure ? 'Service Temporarily Unavailable' : 'Too Many Requests',
          message: rateLimit.limiterFailure
            ? 'Rate limit protection is currently unavailable. Live AI operations are protected. Please retry shortly.'
            : `Rate limit exceeded. Please wait ${rateLimit.retryAfterSeconds}s before refining your plan again.`,
          retryAfter: rateLimit.retryAfterSeconds,
        },
        {
          status,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetSeconds),
          },
        }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const parsed = RefinePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { modificationType, customPrompt, eventDetails, currentPlan } = parsed.data;

    const fullEvent: EventDetails = {
      name: eventDetails.name,
      eventType: eventDetails.eventType,
      date: eventDetails.date,
      duration: eventDetails.duration,
      location: eventDetails.location,
      guestCount: eventDetails.guestCount,
      totalBudget: eventDetails.totalBudget,
      currency: eventDetails.currency,
      styleTheme: eventDetails.styleTheme,
      venueType: eventDetails.venueType,
      atmosphere: eventDetails.atmosphere,
      priorities: eventDetails.priorities,
      dietaryRequirements: eventDetails.dietaryRequirements,
      accessibilityRequirements: eventDetails.accessibilityRequirements,
      specialActivities: eventDetails.specialActivities,
      additionalNotes: eventDetails.additionalNotes,
      id: 'event-current',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await refineEventPlanWithAI(
      fullEvent,
      toEventPlan(currentPlan, eventDetails.totalBudget),
      modificationType,
      customPrompt
    );

    return NextResponse.json({
      success: true,
      plan: result.plan,
      source: result.source,
      notice: result.notice,
    });
  } catch (error: unknown) {
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    console.error(`[API /api/refine-plan Error] ${errorType}`);
    return NextResponse.json(
      {
        error: 'Failed to refine plan',
        message: 'Please try again. If the problem continues, contact support.',
      },
      { status: 500 }
    );
  }
}
