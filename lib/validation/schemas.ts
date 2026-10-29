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

// ============================================================================
// Concrete Sub-Schemas for Plan Elements (Zero z.any())
// ============================================================================

export const ThemeIdeaSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(1000),
  colorPalette: z.array(z.string().max(50)),
  vibeKeywords: z.array(z.string().max(50)),
});

export const BudgetCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(120),
  allocatedAmount: z.number().min(0, 'Allocation must not be negative'),
  actualSpent: z.number().min(0).optional().default(0),
  isEssential: z.boolean().default(true),
  notes: z.string().max(500).optional(),
});

export const BudgetBreakdownSchema = z.object({
  categories: z.array(BudgetCategorySchema),
  totalAllocated: z.number().optional(),
  unallocated: z.number().optional(),
  contingencyAmount: z.number().optional(),
  notes: z.string().max(500).optional(),
});

export const TimelineTaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  stage: z.enum([
    'initial-planning',
    'early-preparations',
    'month-before',
    'final-week',
    'day-before',
    'event-day',
    'post-event',
  ]),
  dueDate: z.string().min(1),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  category: z.string().max(100).optional(),
  owner: z.string().max(100).optional(),
});

export const VendorItemSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  needDescription: z.string().max(1000),
  whyItMatters: z.string().max(1000),
  bookingDeadline: z.string().min(1),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['needed', 'contacted', 'confirmed', 'not-required']).default('needed'),
  estimatedCost: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const ScheduleItemSchema = z.object({
  id: z.string().optional(),
  startTime: z.string().min(1).max(30),
  endTime: z.string().min(1).max(30),
  activity: z.string().min(1).max(200),
  description: z.string().max(1000),
  responsiblePerson: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const PersonalizedIdeaSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().max(1500),
  whyItFits: z.string().max(1000),
  tags: z.array(z.string().max(50)).optional(),
});

export const RiskContingencySchema = z.object({
  risk: z.string().min(1).max(300),
  plan: z.string().min(1).max(1000),
  severity: z.enum(['low', 'medium', 'high']),
});

// ============================================================================
// Authoritative Current Plan Schema for Plan Refinement
// ============================================================================

export const CurrentPlanSchema = z.object({
  eventSummary: z.string().min(5),
  themeIdeas: ThemeIdeaSchema,
  budgetBreakdown: BudgetBreakdownSchema,
  timelineTasks: z.array(TimelineTaskSchema),
  vendorChecklist: z.array(VendorItemSchema),
  eventDaySchedule: z.array(ScheduleItemSchema),
  personalizedIdeas: z.array(PersonalizedIdeaSchema),
  risksAndContingencies: z.array(RiskContingencySchema),
  generatedAt: z.string().optional(),
  generationSource: z.enum(['live-ai', 'demo']).optional(),
  modelUsed: z.string().optional(),
  lastRefinedAt: z.string().optional(),
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
    name: z.string().min(1).max(100),
    eventType: z.string(),
    date: z.string(),
    location: z.string(),
    guestCount: z.number().int().min(1),
    totalBudget: z.number().min(0),
    currency: z.string().min(1).max(10),
    styleTheme: z.string(),
    venueType: z.string(),
    atmosphere: z.string(),
    priorities: z.array(z.string()).optional(),
  }),
  currentPlan: CurrentPlanSchema,
});

// ============================================================================
// Authoritative AI Generation Output Schema (from Model)
// ============================================================================

export const AIPlanOutputSchema = z.object({
  eventSummary: z.string().min(10),
  themeIdeas: ThemeIdeaSchema,
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
