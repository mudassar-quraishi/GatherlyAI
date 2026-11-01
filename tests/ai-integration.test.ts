import { afterEach, describe, it, expect, vi } from 'vitest';
import { generateSamplePlan, createDefaultDemoEvent } from '@/lib/ai/sampleProvider';
import { generateEventPlanWithAI, refineEventPlanWithAI } from '@/lib/ai/geminiService';

const { generateContentMock, googleGenAIMock } = vi.hoisted(() => {
  const generateContentMock = vi.fn();
  const googleGenAIMock = vi.fn(function () {
    return { models: { generateContent: generateContentMock } };
  });
  return { generateContentMock, googleGenAIMock };
});

vi.mock('@google/genai', () => ({
  GoogleGenAI: googleGenAIMock,
}));

describe('AI & Sample Provider Integration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    generateContentMock.mockReset();
    googleGenAIMock.mockImplementation(function () {
      return { models: { generateContent: generateContentMock } };
    });
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
    expect(plan.timelineTasks.length).toBeGreaterThanOrEqual(7);
    expect(plan.vendorChecklist.length).toBeGreaterThanOrEqual(4);
    expect(plan.eventDaySchedule.length).toBeGreaterThanOrEqual(5);
    expect(plan.personalizedIdeas.length).toBeGreaterThanOrEqual(2);
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

  it('uses distinct planning profiles for all supported event types', () => {
    const eventTypes = ['wedding', 'birthday', 'anniversary', 'community', 'fundraiser', 'other'] as const;
    const plans = eventTypes.map((eventType) => generateSamplePlan({
      name: `Test ${eventType}`,
      eventType,
      date: '2027-05-10',
      location: 'Jaipur',
      guestCount: 80,
      totalBudget: 200000,
      currency: 'INR',
      styleTheme: 'Garden evening',
    }));

    const categorySignatures = new Set(plans.map((plan) => plan.budgetBreakdown.categories.map((category) => category.name).join('|')));
    expect(categorySignatures.size).toBe(eventTypes.length);
    expect(plans.map((plan) => plan.eventSummary.toLowerCase())).toEqual(expect.arrayContaining([
      expect.stringContaining('ceremony'),
      expect.stringContaining('guest of honor'),
      expect.stringContaining('milestone'),
      expect.stringContaining('volunteer'),
      expect.stringContaining('fundraising'),
      expect.stringContaining('host’s purpose'),
    ]));

    for (const plan of plans) {
      expect(plan.budgetBreakdown.totalAllocated + plan.budgetBreakdown.unallocated).toBe(200000);
      expect(plan.timelineTasks.every((task) => task.status === 'todo')).toBe(true);
      expect(plan.vendorChecklist.every((vendor) => vendor.status === 'needed')).toBe(true);
      expect(plan.vendorChecklist.every((vendor) => vendor.estimatedCost === undefined)).toBe(true);
    }
  });

  it('carries event needs and selected priorities into a demo plan without inventing progress', () => {
    const event = createDefaultDemoEvent();
    const plan = generateSamplePlan(event);
    const taskText = plan.timelineTasks.map((task) => `${task.title} ${task.description}`).join(' ').toLowerCase();

    expect(taskText).toContain('nut-free dessert station');
    expect(taskText).toContain('wheelchair ramp access');
    expect(taskText).toContain('sunset vows');
    expect(taskText).toContain('candid photography');
    expect(plan.eventSummary).toContain('seamless transition');
    expect(plan.timelineTasks.some((task) => task.status !== 'todo')).toBe(false);
    expect(plan.vendorChecklist.some((vendor) => vendor.status !== 'needed')).toBe(false);
  });

  it('does not mutate shared event profiles when adding an outdoor risk', () => {
    const outdoor = generateSamplePlan({ eventType: 'other', venueType: 'outdoor' });
    const indoor = generateSamplePlan({ eventType: 'other', venueType: 'indoor' });

    expect(outdoor.risksAndContingencies.some((risk) => risk.risk.includes('Weather may affect the outdoor event'))).toBe(true);
    expect(indoor.risksAndContingencies.some((risk) => risk.risk.includes('Weather may affect the outdoor event'))).toBe(false);
  });

  it('refines plan in demo mode without crashing and preserves current structure', async () => {
    const baseEvent = createDefaultDemoEvent();
    const currentPlan = baseEvent.plan!;

    const result = await refineEventPlanWithAI(baseEvent, currentPlan, 'eco-friendly');
    expect(result.plan).toBeDefined();
    expect(result.plan.generationSource).toBe('demo');
    expect(result.plan.lastRefinedAt).toBeDefined();
  });

  it('preserves existing task progress, vendor status, and actual spending during demo refinement', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const event = createDefaultDemoEvent();
    const currentPlan = structuredClone(event.plan!);
    currentPlan.timelineTasks[0].status = 'done';
    currentPlan.vendorChecklist[0].status = 'contacted';
    currentPlan.vendorChecklist[0].notes = 'Host entered this note';
    currentPlan.budgetBreakdown.categories[0].actualSpent = 12500;

    const result = await refineEventPlanWithAI(event, currentPlan, 'eco-friendly');

    expect(result.plan.timelineTasks[0]).toMatchObject({ status: 'done', title: currentPlan.timelineTasks[0].title });
    expect(result.plan.vendorChecklist[0]).toMatchObject({ status: 'contacted', notes: 'Host entered this note' });
    expect(result.plan.budgetBreakdown.categories[0].actualSpent).toBe(12500);
    expect(result.plan.timelineTasks.some((task) => task.title === 'Confirm reusable and lower-waste service options')).toBe(true);
    expect(result.plan.personalizedIdeas.some((idea) => idea.title === 'Set up clearly marked reuse and recycling points')).toBe(true);
  });

  it('moves only available discretionary funds into a reserve for the demo budget rule', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const event = createDefaultDemoEvent();
    const currentPlan = structuredClone(event.plan!);
    const initialTotal = currentPlan.budgetBreakdown.categories.reduce((sum, category) => sum + category.allocatedAmount, 0);
    const initialReserve = currentPlan.budgetBreakdown.categories.find((category) => /contingency|reserve/i.test(category.name))!.allocatedAmount;
    const initialContingency = currentPlan.budgetBreakdown.contingencyAmount;
    const discretionary = currentPlan.budgetBreakdown.categories.find((category) => !category.isEssential)!;
    discretionary.actualSpent = discretionary.allocatedAmount - 100;

    const result = await refineEventPlanWithAI(event, currentPlan, 'budget-friendly');
    const updatedTotal = result.plan.budgetBreakdown.categories.reduce((sum, category) => sum + category.allocatedAmount, 0);
    const updatedReserve = result.plan.budgetBreakdown.categories.find((category) => /contingency|reserve/i.test(category.name))!.allocatedAmount;

    expect(result.plan.budgetBreakdown.categories.find((category) => category.id === discretionary.id)?.allocatedAmount).toBe(discretionary.actualSpent);
    expect(result.plan.budgetBreakdown.categories.find((category) => category.id === discretionary.id)?.actualSpent).toBe(discretionary.actualSpent);
    expect(updatedReserve).toBeGreaterThan(initialReserve);
    expect(result.plan.budgetBreakdown.contingencyAmount).toBe(initialContingency + updatedReserve - initialReserve);
    expect(updatedTotal).toBe(initialTotal);
  });

  it('retains matching user progress and notes when live Gemini returns a refreshed plan', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    const event = createDefaultDemoEvent();
    const currentPlan = structuredClone(event.plan!);
    currentPlan.timelineTasks[0].status = 'done';
    currentPlan.vendorChecklist[0].status = 'contacted';
    currentPlan.vendorChecklist[0].notes = 'Organizer phone call scheduled';
    currentPlan.budgetBreakdown.categories[0].actualSpent = 12500;
    currentPlan.eventDaySchedule[0].notes = 'Venue access confirmed by host';

    const generatedOutput = structuredClone(currentPlan);
    generatedOutput.timelineTasks[0].status = 'todo';
    generatedOutput.vendorChecklist[0].status = 'needed';
    generatedOutput.vendorChecklist[0].notes = 'Model-generated supplier note';
    generatedOutput.eventDaySchedule[0].notes = 'Model-generated run-sheet note';
    generateContentMock.mockResolvedValue({ text: JSON.stringify(generatedOutput) });

    const result = await refineEventPlanWithAI(event, currentPlan, 'eco-friendly');

    expect(result.source).toBe('live-ai');
    expect(result.plan.timelineTasks[0]).toMatchObject({ id: currentPlan.timelineTasks[0].id, status: 'done' });
    expect(result.plan.vendorChecklist[0]).toMatchObject({ status: 'contacted', notes: 'Organizer phone call scheduled' });
    expect(result.plan.budgetBreakdown.categories[0]).toMatchObject({ id: currentPlan.budgetBreakdown.categories[0].id, actualSpent: 12500 });
    expect(result.plan.eventDaySchedule[0]).toMatchObject({ id: currentPlan.eventDaySchedule[0].id, notes: 'Venue access confirmed by host' });
  });

  it('records unsupported custom demo requests without claiming to interpret them', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const event = createDefaultDemoEvent();
    const result = await refineEventPlanWithAI(event, event.plan!, 'custom', 'Add a jazz quartet and a silent reading lounge');

    expect(result.notice).toContain('cannot interpret open-ended custom requests');
    expect(result.plan.timelineTasks.some((task) => task.title.includes('Add a jazz quartet'))).toBe(true);
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
