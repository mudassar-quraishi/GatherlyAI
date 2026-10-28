import { z } from 'zod';

export const EventInputSchema = z.object({
  name: z.string().min(2, 'Event name must be at least 2 characters').max(100, 'Event name must not exceed 100 characters'),
  eventType: z.enum(['wedding', 'birthday', 'anniversary', 'community', 'fundraiser', 'other']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  duration: z.string().min(2).max(100).default('Full Day (8 hours)'),
  location: z.string().min(2, 'Location is required').max(150),
  guestCount: z.number().int().min(1, 'Guest count must be at least 1').max(50000, 'Guest count must be under 50,000'),
  totalBudget: z.number().min(100, 'Budget must be at least 100').max(1000000000, 'Budget exceeds maximum limit'),
  currency: z.string().min(2).max(6).default('INR'),
  styleTheme: z.string().min(2, 'Style or theme is required').max(120),
  venueType: z.enum(['indoor', 'outdoor', 'mixed']).default('mixed'),
  atmosphere: z.string().max(300).default('Joyful and well-organized'),
  priorities: z.array(z.string()).min(1, 'Select at least one priority').max(8),
  dietaryRequirements: z.string().max(500).optional().default(''),
  accessibilityRequirements: z.string().max(500).optional().default(''),
  specialActivities: z.string().max(500).optional().default(''),
  additionalNotes: z.string().max(1000).optional().default(''),
});

export const RefinePlanSchema = z.object({
  modificationType: z.enum([
    'budget-friendly',
    'more-elegant',
    'eco-friendly',
    'child-friendly',
    'smaller-guest-list',
    'rain-contingency',
    'custom',
  ]),
  customPrompt: z.string().max(600).optional(),
  eventDetails: z.object({
    name: z.string(),
    eventType: z.string(),
    date: z.string(),
    location: z.string(),
    guestCount: z.number(),
    totalBudget: z.number(),
    currency: z.string(),
    styleTheme: z.string(),
    venueType: z.string(),
    atmosphere: z.string(),
    priorities: z.array(z.string()).optional(),
  }),
  currentPlan: z.object({
    eventSummary: z.string(),
    themeIdeas: z.any(),
    budgetBreakdown: z.any(),
    timelineTasks: z.array(z.any()),
    vendorChecklist: z.array(z.any()),
    eventDaySchedule: z.array(z.any()),
    personalizedIdeas: z.array(z.any()),
    risksAndContingencies: z.array(z.any()),
  }),
});

export const AIPlanOutputSchema = z.object({
  eventSummary: z.string().min(10),
  themeIdeas: z.object({
    name: z.string(),
    description: z.string(),
    colorPalette: z.array(z.string()),
    vibeKeywords: z.array(z.string()),
  }),
  budgetBreakdown: z.object({
    categories: z.array(
      z.object({
        name: z.string(),
        allocatedAmount: z.number(),
        isEssential: z.boolean().default(true),
        notes: z.string().optional(),
      })
    ),
    notes: z.string().optional(),
  }),
  timelineTasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      stage: z.enum([
        'initial-planning',
        'early-preparations',
        'month-before',
        'final-week',
        'day-before',
        'event-day',
        'post-event',
      ]),
      dueDate: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      category: z.string().optional(),
      owner: z.string().optional(),
    })
  ),
  vendorChecklist: z.array(
    z.object({
      category: z.string(),
      title: z.string(),
      needDescription: z.string(),
      whyItMatters: z.string(),
      bookingDeadline: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      status: z.enum(['needed', 'contacted', 'confirmed', 'not-required']).default('needed'),
      estimatedCost: z.number().optional(),
      notes: z.string().optional(),
    })
  ),
  eventDaySchedule: z.array(
    z.object({
      startTime: z.string(),
      endTime: z.string(),
      activity: z.string(),
      description: z.string(),
      responsiblePerson: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
  personalizedIdeas: z.array(
    z.object({
      category: z.string(),
      title: z.string(),
      description: z.string(),
      whyItFits: z.string(),
      tags: z.array(z.string()).optional(),
    })
  ),
  risksAndContingencies: z.array(
    z.object({
      risk: z.string(),
      plan: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
    })
  ),
});
