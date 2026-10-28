import { describe, it, expect } from 'vitest';
import { generateSamplePlan, createDefaultDemoEvent } from '@/lib/ai/sampleProvider';
import { refineEventPlanWithAI } from '@/lib/ai/geminiService';

describe('AI & Sample Provider Integration', () => {
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
});
