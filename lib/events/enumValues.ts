import type { TaskPriority, TaskStage, TaskStatus, VendorStatus } from '@/types/event';

export const TASK_STAGES = [
  'initial-planning',
  'early-preparations',
  'month-before',
  'final-week',
  'day-before',
  'event-day',
  'post-event',
] satisfies readonly TaskStage[];

export const TASK_PRIORITIES = ['high', 'medium', 'low'] satisfies readonly TaskPriority[];
export const TASK_STATUSES = ['todo', 'in-progress', 'done'] satisfies readonly TaskStatus[];
export const VENDOR_STATUSES = ['needed', 'contacted', 'confirmed', 'not-required'] satisfies readonly VendorStatus[];

export function isTaskStage(value: string): value is TaskStage {
  return TASK_STAGES.some((stage) => stage === value);
}

export function isTaskPriority(value: string): value is TaskPriority {
  return TASK_PRIORITIES.some((priority) => priority === value);
}

export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.some((status) => status === value);
}

export function isVendorStatus(value: string): value is VendorStatus {
  return VENDOR_STATUSES.some((status) => status === value);
}
