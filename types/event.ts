export type EventType =
  | 'wedding'
  | 'birthday'
  | 'anniversary'
  | 'community'
  | 'fundraiser'
  | 'other';

export type VenueType = 'indoor' | 'outdoor' | 'mixed';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStage =
  | 'initial-planning'
  | 'early-preparations'
  | 'month-before'
  | 'final-week'
  | 'day-before'
  | 'event-day'
  | 'post-event';

export type VendorStatus = 'needed' | 'contacted' | 'confirmed' | 'not-required';

export interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: number; // in major currency unit
  actualSpent: number; // in major currency unit (user editable)
  notes?: string;
  isEssential: boolean;
}

export interface BudgetBreakdown {
  categories: BudgetCategory[];
  totalAllocated: number;
  unallocated: number;
  contingencyAmount: number;
  notes?: string;
}

export interface TimelineTask {
  id: string;
  title: string;
  description: string;
  stage: TaskStage;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  category?: string;
  owner?: string;
}

export interface VendorItem {
  id: string;
  category: string;
  title: string;
  needDescription: string;
  whyItMatters: string;
  bookingDeadline: string; // YYYY-MM-DD or relative like "4 weeks before"
  priority: TaskPriority;
  status: VendorStatus;
  estimatedCost?: number;
  notes?: string;
}

export interface ScheduleItem {
  id: string;
  startTime: string; // e.g. "09:00 AM"
  endTime: string;   // e.g. "10:30 AM"
  activity: string;
  description: string;
  responsiblePerson?: string;
  notes?: string;
}

export interface PersonalizedIdea {
  id: string;
  category: string;
  title: string;
  description: string;
  whyItFits: string;
  tags?: string[];
}

export interface ContingencyPlan {
  risk: string;
  plan: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ThemeIdea {
  name: string;
  description: string;
  colorPalette: string[];
  vibeKeywords: string[];
}

export interface EventPlan {
  eventSummary: string;
  themeIdeas: ThemeIdea;
  budgetBreakdown: BudgetBreakdown;
  timelineTasks: TimelineTask[];
  vendorChecklist: VendorItem[];
  eventDaySchedule: ScheduleItem[];
  personalizedIdeas: PersonalizedIdea[];
  risksAndContingencies: ContingencyPlan[];
  generatedAt: string;
  generationSource: 'live-ai' | 'demo';
  modelUsed?: string;
  lastRefinedAt?: string;
}

export interface EventDetails {
  id: string;
  name: string;
  eventType: EventType;
  date: string; // YYYY-MM-DD
  duration: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  styleTheme: string;
  venueType: VenueType;
  atmosphere: string;
  priorities: string[];
  dietaryRequirements?: string;
  accessibilityRequirements?: string;
  specialActivities?: string;
  additionalNotes?: string;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
  plan?: EventPlan;
}

export interface ReadinessScoreResult {
  score: number; // 0-100
  rating: 'early' | 'on-track' | 'well-prepared' | 'ready';
  details: {
    tasksCompletedPercent: number;
    highPriorityTasksDone: number;
    totalHighPriorityTasks: number;
    vendorsConfirmedPercent: number;
    budgetBalanced: boolean;
    scheduleReady: boolean;
  };
  suggestions: string[];
}

export interface BudgetHealthResult {
  totalBudget: number;
  totalAllocated: number;
  totalSpent: number;
  remainingBudget: number;
  isOverBudget: boolean;
  isOverAllocated: boolean;
  contingencyPercent: number;
  hasSufficientContingency: boolean; // >= 5% recommended
  healthStatus: 'healthy' | 'caution' | 'warning' | 'critical';
  notes: string[];
}
