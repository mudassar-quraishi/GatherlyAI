import { afterEach, describe, it, expect, vi } from 'vitest';
import { generateSamplePlan, createDefaultDemoEvent } from '@/lib/ai/sampleProvider';
import { generateEventPlanWithAI, refineEventPlanWithAI } from '@/lib/ai/geminiService';

const { generateContentMock } = vi.hoisted(() => ({ generateContentMock: vi.fn() }));

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: generateContentMock },
  })),
}));

describe('AI & Sample Provider Integration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    generateContentMock.mockReset();
  });

  it('generates a complete, internally consistent sample plan for weddings', () => {
    const plan = generateSamplePlan({
      eventType: 'wedding',
      totalBudget: 600000,
      currency: 'INR',
      guestCount: 150,
      location: 'Jaipur',
      styleTheme: 'Royal Heritage',
    });

    expect(plan.eventSummary).toContain('wedding');
    expect(plan.generationSource).toBe('demo');
    expect(plan.budgetBreakdown.categories.length).toBeGreaterThan(0);
    expect(plan.budgetBreakdown.totalAllocated + plan.budgetBreakdown.unallocated).toBe(600000);
    expect(plan.timelineTasks.length).toBeGreaterThanOrEqual(8);
    expect(plan.vendorChecklist.length).toBeGreaterThanOrEqual(4);
    expect(plan.eventDaySchedule.length).toBeGreaterThanOrEqual(5);
    expect(plan.personalizedIdeas.length).toBeGreaterThanOrEqual(3);
    expect(plan.risksAndContingencies.length).toBeGreaterThanOrEqual(2);
  });

  it('generates tailored categories for community events', () => {
    const plan = generateSamplePlan({
      eventType: 'community',
      totalBudget: 200000,
      currency: 'INR',
      guestCount: 300,
      location: 'Community Center',
    });

    const categoryNames = plan.budgetBreakdown.categories.map((c) => c.name.toLowerCase());
    expect(categoryNames.some((n) => n.includes('sound') || n.includes('av') || n.includes('refreshment'))).toBe(true);
  });

  it('refines plan in demo mode without crashing and preserves current structure', async () => {
    const baseEvent = createDefaultDemoEvent();
    const currentPlan = baseEvent.plan!;

    const result = await refineEventPlanWithAI(baseEvent, currentPlan, 'eco-friendly');
    expect(result.plan).toBeDefined();
    expect(result.plan.generationSource).toBe('demo');
    expect(result.plan.lastRefinedAt).toBeDefined();
  });

  it('keeps provider failure details out of user-facing generation and refinement notices', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    generateContentMock.mockRejectedValue(new Error('internal-provider-detail secret=private'));

    const event = createDefaultDemoEvent();
    const generated = await generateEventPlanWithAI(event);
    const refined = await refineEventPlanWithAI(event, event.plan!, 'budget-friendly');

    expect(generated.source).toBe('demo');
    expect(generated.notice).toContain('temporarily unavailable');
    expect(generated.notice).not.toContain('internal-provider-detail');
    expect(generated.notice).not.toContain('private');
    expect(refined.source).toBe('demo');
    expect(refined.notice).toContain('current plan was kept');
    expect(refined.notice).not.toContain('internal-provider-detail');
    expect(refined.notice).not.toContain('private');
  });
});
