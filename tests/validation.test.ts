import { describe, it, expect } from 'vitest';
import { EventInputSchema, RefinePlanSchema } from '@/lib/validation/schemas';

describe('Validation Schemas (Zod)', () => {
  it('validates a complete, valid event input', () => {
    const validData = {
      name: 'Rohan & Ananya Reception',
      eventType: 'wedding',
      date: '2026-12-15',
      duration: 'Evening (5 hours)',
      location: 'Bengaluru',
      guestCount: 200,
      totalBudget: 600000,
      currency: 'INR',
      styleTheme: 'Modern Botanical Garden',
      venueType: 'outdoor',
      atmosphere: 'Warm and celebratory',
      priorities: ['Food', 'Photography', 'Decor'],
    };

    const result = EventInputSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects invalid inputs such as negative budget or empty event name', () => {
    const invalidData = {
      name: '',
      eventType: 'wedding',
      date: 'not-a-date',
      location: 'Goa',
      guestCount: -5,
      totalBudget: -100,
      priorities: [],
    };

    const result = EventInputSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.name).toBeDefined();
      expect(errors.date).toBeDefined();
      expect(errors.guestCount).toBeDefined();
      expect(errors.totalBudget).toBeDefined();
      expect(errors.priorities).toBeDefined();
    }
  });

  it('validates a plan refinement request', () => {
    const validRefinement = {
      modificationType: 'budget-friendly',
      customPrompt: 'Focus on reducing floral expenses',
      eventDetails: {
        name: 'Community Carnival',
        eventType: 'community',
        date: '2026-11-20',
        location: 'Community Park',
        guestCount: 300,
        totalBudget: 150000,
        currency: 'INR',
        styleTheme: 'Festive',
        venueType: 'outdoor',
        atmosphere: 'Lively',
      },
      currentPlan: {
        eventSummary: 'Summary of the event',
        themeIdeas: { name: 'Festive', description: '', colorPalette: [], vibeKeywords: [] },
        budgetBreakdown: { categories: [], totalAllocated: 0, unallocated: 0, contingencyAmount: 0 },
        timelineTasks: [],
        vendorChecklist: [],
        eventDaySchedule: [],
        personalizedIdeas: [],
        risksAndContingencies: [],
      },
    };

    const result = RefinePlanSchema.safeParse(validRefinement);
    expect(result.success).toBe(true);
  });
});
