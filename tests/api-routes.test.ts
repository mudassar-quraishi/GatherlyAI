import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET as getAIStatus } from '@/app/api/ai-status/route';
import { POST as generatePlan } from '@/app/api/generate-plan/route';
import { POST as refinePlan } from '@/app/api/refine-plan/route';
import { createDefaultDemoEvent } from '@/lib/ai/sampleProvider';

function postJson(url: string, body: string): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

describe('AI API route handlers', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('reports demo mode when no Gemini key is configured', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const response = await getAIStatus();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      liveAiConfigured: false,
      modelName: 'Deterministic Demo Provider',
      demoModeAvailable: true,
    });
  });

  it('returns 400 for malformed generation JSON', async () => {
    const response = await generatePlan(postJson('http://localhost/api/generate-plan', '{'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON request body' });
  });

  it('returns 400 for malformed refinement JSON', async () => {
    const response = await refinePlan(postJson('http://localhost/api/refine-plan', '{'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON request body' });
  });

  it('generates a validated deterministic plan through the API without credentials', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const response = await generatePlan(
      postJson(
        'http://localhost/api/generate-plan',
        JSON.stringify({
          name: 'Community Celebration',
          eventType: 'community',
          date: '2026-12-25',
          duration: 'Full Day',
          location: 'Town Hall',
          guestCount: 100,
          totalBudget: 50000,
          currency: 'INR',
          styleTheme: 'Warm and welcoming',
          venueType: 'indoor',
          atmosphere: 'Family friendly',
          priorities: ['Accessibility', 'Food'],
        })
      )
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.source).toBe('demo');
    expect(result.plan.budgetBreakdown.totalAllocated + result.plan.budgetBreakdown.unallocated).toBe(50000);
  });

  it('refines a demo plan through the API without credentials', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const event = createDefaultDemoEvent();
    const response = await refinePlan(
      postJson(
        'http://localhost/api/refine-plan',
        JSON.stringify({
          modificationType: 'budget-friendly',
          eventDetails: {
            name: event.name,
            eventType: event.eventType,
            date: event.date,
            location: event.location,
            guestCount: event.guestCount,
            totalBudget: event.totalBudget,
            currency: event.currency,
            styleTheme: event.styleTheme,
            venueType: event.venueType,
            atmosphere: event.atmosphere,
            priorities: event.priorities,
          },
          currentPlan: event.plan,
        })
      )
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.source).toBe('demo');
    expect(result.plan.lastRefinedAt).toBeDefined();
  });
});
