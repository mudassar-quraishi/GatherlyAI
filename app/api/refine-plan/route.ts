import { NextRequest, NextResponse } from 'next/server';
import { RefinePlanSchema } from '@/lib/validation/schemas';
import { refineEventPlanWithAI } from '@/lib/ai/geminiService';
import { EventDetails, EventPlan, EventType, VenueType } from '@/types/event';
import { checkRateLimit, RATE_LIMIT_POLICIES, getClientIdentifier } from '@/lib/security/rateLimiter';

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
      eventType: (eventDetails.eventType || 'other') as EventType,
      date: eventDetails.date,
      location: eventDetails.location,
      guestCount: eventDetails.guestCount,
      totalBudget: eventDetails.totalBudget,
      currency: eventDetails.currency,
      styleTheme: eventDetails.styleTheme,
      venueType: (eventDetails.venueType || 'mixed') as VenueType,
      atmosphere: eventDetails.atmosphere,
      priorities: eventDetails.priorities || ['Quality Food'],
      id: 'event-current',
      duration: 'Full Day',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await refineEventPlanWithAI(
      fullEvent,
      currentPlan as EventPlan,
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
