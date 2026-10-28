import { NextRequest, NextResponse } from 'next/server';
import { EventInputSchema } from '@/lib/validation/schemas';
import { generateEventPlanWithAI } from '@/lib/ai/geminiService';
import { EventDetails } from '@/types/event';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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

    const eventDetails: EventDetails = {
      ...parsed.data,
      id: body.id || `event-${Date.now()}`,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await generateEventPlanWithAI(eventDetails);

    return NextResponse.json({
      success: true,
      plan: result.plan,
      source: result.source,
      notice: result.notice,
    });
  } catch (error: unknown) {
    console.error('[API /api/generate-plan Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      {
        error: 'Failed to generate plan',
        message,
      },
      { status: 500 }
    );
  }
}
