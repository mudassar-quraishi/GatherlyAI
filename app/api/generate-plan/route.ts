import { NextRequest, NextResponse } from 'next/server';
import { EventInputSchema } from '@/lib/validation/schemas';
import { generateEventPlanWithAI } from '@/lib/ai/geminiService';
import { EventDetails } from '@/types/event';
import { checkRateLimit, RATE_LIMIT_POLICIES, getClientIdentifier } from '@/lib/security/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce server-side rate limiting
    const clientId = getClientIdentifier(req.headers);
    const rateLimit = await checkRateLimit(clientId, RATE_LIMIT_POLICIES.GENERATE_PLAN);

    if (!rateLimit.success) {
      const status = rateLimit.limiterFailure ? 503 : 429;
      return NextResponse.json(
        {
          error: rateLimit.limiterFailure ? 'Service Temporarily Unavailable' : 'Too Many Requests',
          message: rateLimit.limiterFailure
            ? 'Rate limit protection is currently unavailable. Live AI operations are protected. Please retry shortly.'
            : `Rate limit exceeded. Please wait ${rateLimit.retryAfterSeconds}s before generating another plan.`,
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

    // Validate request payload
    const parsed = EventInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const eventDetails: EventDetails = {
      ...parsed.data,
      id: `event-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    const result = await generateEventPlanWithAI(eventDetails);

    return NextResponse.json({
      success: true,
      plan: result.plan,
      source: result.source,
      notice: result.notice,
    });
  } catch (error: unknown) {
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    console.error(`[API /api/generate-plan Error] ${errorType}`);
    return NextResponse.json(
      {
        error: 'Failed to generate plan',
        message: 'Please try again. If the problem continues, contact support.',
      },
      { status: 500 }
    );
  }
}
