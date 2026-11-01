import { describe, it, expect } from 'vitest';
import {
  EventInputSchema,
  RefinePlanSchema,
  BudgetCategorySchema,
  TimelineTaskSchema,
  VendorItemSchema,
  ScheduleItemSchema,
  CurrentPlanSchema,
} from '@/lib/validation/schemas';
import { createDefaultDemoEvent } from '@/lib/ai/sampleProvider';

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

  it('rejects impossible calendar dates while accepting leap days', () => {
    const baseData = {
      name: 'Community Celebration',
      eventType: 'community',
      date: '2028-02-29',
      location: 'Town Hall',
      guestCount: 100,
      totalBudget: 50000,
      styleTheme: 'Warm and welcoming',
      priorities: ['Accessibility'],
    };

    expect(EventInputSchema.safeParse(baseData).success).toBe(true);
    expect(EventInputSchema.safeParse({ ...baseData, date: '2027-02-29' }).success).toBe(false);
    expect(EventInputSchema.safeParse({ ...baseData, date: '2028-13-01' }).success).toBe(false);
    expect(EventInputSchema.safeParse({ ...baseData, date: '2028-04-31' }).success).toBe(false);
  });

  it('validates a complete, real demo event plan for refinement', () => {
    const demo = createDefaultDemoEvent();
    const refinementPayload = {
      modificationType: 'budget-friendly',
      customPrompt: 'Cut down on decorative lighting costs',
      eventDetails: {
        name: demo.name,
        eventType: demo.eventType,
        date: demo.date,
        location: demo.location,
        guestCount: demo.guestCount,
        totalBudget: demo.totalBudget,
        currency: demo.currency,
        styleTheme: demo.styleTheme,
        venueType: demo.venueType,
        atmosphere: demo.atmosphere,
        priorities: demo.priorities,
      },
      currentPlan: demo.plan,
    };

    const result = RefinePlanSchema.safeParse(refinementPayload);
    expect(result.success).toBe(true);
  });

  it('rejects a budget category with a negative allocated amount', () => {
    const invalidCategory = {
      name: 'Floral Decor',
      allocatedAmount: -5000,
      isEssential: true,
    };
    const result = BudgetCategorySchema.safeParse(invalidCategory);
    expect(result.success).toBe(false);
  });

  it('rejects a timeline task with an invalid stage enum', () => {
    const invalidTask = {
      title: 'Final walkthrough',
      description: 'Review venue setup',
      stage: 'not-a-real-stage',
      dueDate: '2026-11-20',
      priority: 'high',
    };
    const result = TimelineTaskSchema.safeParse(invalidTask);
    expect(result.success).toBe(false);
  });

  it('rejects a vendor object missing required fields', () => {
    const invalidVendor = {
      category: 'Catering',
      // missing title, needDescription, whyItMatters, bookingDeadline, priority
    };
    const result = VendorItemSchema.safeParse(invalidVendor);
    expect(result.success).toBe(false);
  });

  it('rejects a schedule item with missing activity name', () => {
    const invalidSchedule = {
      startTime: '10:00 AM',
      endTime: '11:00 AM',
      activity: '',
      description: 'Morning tea',
    };
    const result = ScheduleItemSchema.safeParse(invalidSchedule);
    expect(result.success).toBe(false);
  });

  it('rejects currentPlan with arbitrary invalid primitives in place of objects', () => {
    const malformedCurrentPlan = {
      eventSummary: 'A great party',
      themeIdeas: 'NOT_AN_OBJECT', // Should be object
      budgetBreakdown: { categories: [] },
      timelineTasks: [],
      vendorChecklist: [],
      eventDaySchedule: [],
      personalizedIdeas: [],
      risksAndContingencies: [],
    };
    const result = CurrentPlanSchema.safeParse(malformedCurrentPlan);
    expect(result.success).toBe(false);
  });

  it('rejects unreasonably large custom refinement prompts exceeding character limits', () => {
    const demo = createDefaultDemoEvent();
    const oversizedPayload = {
      modificationType: 'custom',
      customPrompt: 'A'.repeat(800), // Max allowed is 600
      eventDetails: {
        name: demo.name,
        eventType: demo.eventType,
        date: demo.date,
        location: demo.location,
        guestCount: demo.guestCount,
        totalBudget: demo.totalBudget,
        currency: demo.currency,
        styleTheme: demo.styleTheme,
        venueType: demo.venueType,
        atmosphere: demo.atmosphere,
      },
      currentPlan: demo.plan,
    };

    const result = RefinePlanSchema.safeParse(oversizedPayload);
    expect(result.success).toBe(false);
  });

  it('rejects unsupported modification types', () => {
    const demo = createDefaultDemoEvent();
    const invalidTypePayload = {
      modificationType: 'fly-to-the-moon',
      eventDetails: {
        name: demo.name,
        eventType: demo.eventType,
        date: demo.date,
        location: demo.location,
        guestCount: demo.guestCount,
        totalBudget: demo.totalBudget,
        currency: demo.currency,
        styleTheme: demo.styleTheme,
        venueType: demo.venueType,
        atmosphere: demo.atmosphere,
      },
      currentPlan: demo.plan,
    };

    const result = RefinePlanSchema.safeParse(invalidTypePayload);
    expect(result.success).toBe(false);
  });

  it('rejects refinement requests with invalid eventType, date format, or sub-100 budget in eventDetails', () => {
    const demo = createDefaultDemoEvent();
    const basePayload = {
      modificationType: 'budget-friendly',
      eventDetails: {
        name: demo.name,
        eventType: 'invalid-event-type', // Invalid enum
        date: demo.date,
        location: demo.location,
        guestCount: demo.guestCount,
        totalBudget: demo.totalBudget,
        currency: demo.currency,
        styleTheme: demo.styleTheme,
        venueType: demo.venueType,
        atmosphere: demo.atmosphere,
      },
      currentPlan: demo.plan,
    };

    expect(RefinePlanSchema.safeParse(basePayload).success).toBe(false);

    // Invalid date format
    const badDatePayload = {
      ...basePayload,
      eventDetails: {
        ...basePayload.eventDetails,
        eventType: 'wedding',
        date: '25-12-2026', // Not YYYY-MM-DD
      },
    };
    expect(RefinePlanSchema.safeParse(badDatePayload).success).toBe(false);

    // Sub-100 budget
    const lowBudgetPayload = {
      ...basePayload,
      eventDetails: {
        ...basePayload.eventDetails,
        eventType: 'wedding',
        date: '2026-12-25',
        totalBudget: 50, // Min is 100
      },
    };
    expect(RefinePlanSchema.safeParse(lowBudgetPayload).success).toBe(false);
  });
});
