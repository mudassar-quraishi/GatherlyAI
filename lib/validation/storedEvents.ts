import { z } from 'zod';
import {
  BudgetBreakdownSchema,
  BudgetCategorySchema,
  CurrentPlanSchema,
  EventInputSchema,
  PersonalizedIdeaSchema,
  ScheduleItemSchema,
  TimelineTaskSchema,
  VendorItemSchema,
} from '@/lib/validation/schemas';

const StoredBudgetBreakdownSchema = BudgetBreakdownSchema.extend({
  categories: z.array(BudgetCategorySchema.extend({ id: z.string().min(1) })),
  totalAllocated: z.number().min(0),
  unallocated: z.number().min(0),
  contingencyAmount: z.number().min(0),
});

export const StoredEventPlanSchema = CurrentPlanSchema.extend({
  budgetBreakdown: StoredBudgetBreakdownSchema,
  timelineTasks: z.array(TimelineTaskSchema.extend({ id: z.string().min(1) })),
  vendorChecklist: z.array(VendorItemSchema.extend({ id: z.string().min(1) })),
  eventDaySchedule: z.array(ScheduleItemSchema.extend({ id: z.string().min(1) })),
  personalizedIdeas: z.array(PersonalizedIdeaSchema.extend({ id: z.string().min(1) })),
  generatedAt: z.string().min(1),
  generationSource: z.enum(['live-ai', 'demo']),
});

export const StoredEventBaseSchema = EventInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  isSample: z.boolean().optional(),
});
