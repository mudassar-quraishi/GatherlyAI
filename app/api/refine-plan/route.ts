import { NextRequest, NextResponse } from 'next/server';
import { RefinePlanSchema } from '@/lib/validation/schemas';
import { refineEventPlanWithAI } from '@/lib/ai/geminiService';
import { EventDetails, EventPlan, EventType, VenueType } from '@/types/event';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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
    console.error('[API /api/refine-plan Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      {
        error: 'Failed to refine plan',
        message,
      },
      { status: 500 }
    );
  }
}
