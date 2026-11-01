import type {
  BudgetCategory,
  EventDetails,
  EventPlan,
  EventType,
  TimelineTask,
} from '@/types/event';
import { addDaysSafe, formatDateSafe, normalizeTimelineTasks } from '@/lib/timeline/calculator';
import { normalizeBudgetBreakdown } from '@/lib/budget/calculator';
import { getDemoPlanProfile } from '@/lib/ai/demoPlanProfiles';

const DEFAULT_BUDGET = 450000;
const DEFAULT_GUEST_COUNT = 150;

function interpolate(value: string, values: Record<string, string>): string {
  return value.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? '');
}

function addContextTasks(event: Partial<EventDetails>, dueDate: string): TimelineTask[] {
  const tasks: TimelineTask[] = [];
  const addTask = (title: string, description: string, category: string, owner: string) => {
    tasks.push({
      id: `demo-context-${tasks.length + 1}`,
      title,
      description,
      stage: 'early-preparations',
      dueDate,
      priority: 'high',
      status: 'todo',
      category,
      owner,
    });
  };

  if (event.dietaryRequirements?.trim()) {
    addTask(
      'Confirm dietary and allergen arrangements',
      `Review these requirements with the food provider and agree on labeling and service: ${event.dietaryRequirements.trim()}`,
      'Food and hospitality',
      'Food coordinator'
    );
  }

  if (event.accessibilityRequirements?.trim()) {
    addTask(
      'Confirm requested accessibility arrangements',
      `Walk through the guest route with the venue and confirm this request can be met: ${event.accessibilityRequirements.trim()}`,
      'Guest access',
      'Guest coordinator'
    );
  }

  if (event.specialActivities?.trim()) {
    addTask(
      'Coordinate the requested event activities',
      `Confirm timing, equipment, and a responsible lead for: ${event.specialActivities.trim()}`,
      'Program',
      'Program lead'
    );
  }

  if (event.additionalNotes?.trim()) {
    addTask(
      'Review host notes in the final run-through',
      `Check that the run of show accounts for: ${event.additionalNotes.trim()}`,
      'Host requirements',
      'Lead host'
    );
  }

  for (const priority of event.priorities ?? []) {
    if (!priority.trim()) continue;
    addTask(
      `Plan for priority: ${priority.trim()}`,
      `Confirm the event plan gives appropriate time, budget, and ownership to “${priority.trim()}”.`,
      'Host priorities',
      'Lead host'
    );
  }

  return tasks;
}

/**
 * Builds a local planning starter tailored to an event vertical and its stated needs.
 * It contains no live supplier data, bookings, quotes, or completed task claims.
 */
export function generateSamplePlan(event: Partial<EventDetails>): EventPlan {
  const eventType: EventType = event.eventType ?? 'other';
  const profile = getDemoPlanProfile(eventType);
  const eventName = event.name?.trim() || `${eventType[0].toUpperCase()}${eventType.slice(1)} event`;
  const eventDate = event.date || formatDateSafe(new Date(Date.now() + 45 * 24 * 60 * 60 * 1000));
  const totalBudget = event.totalBudget || DEFAULT_BUDGET;
  const guestCount = event.guestCount || DEFAULT_GUEST_COUNT;
  const location = event.location?.trim() || 'your selected location';
  const currency = event.currency || 'INR';
  const theme = event.styleTheme?.trim() || 'Personalized gathering';
  const venueType = event.venueType || 'mixed';
  const atmosphere = event.atmosphere?.trim() || 'welcoming and well-organized';
  const values = { location, guestCount: guestCount.toLocaleString() };

  const rawCategories: BudgetCategory[] = profile.budget.map((category, index) => ({
    id: `demo-${eventType}-budget-${index + 1}`,
    name: category.name,
    allocatedAmount: Math.round(totalBudget * category.percentage),
    actualSpent: 0,
    isEssential: category.essential,
    notes: category.notes,
  }));
  const budgetBreakdown = normalizeBudgetBreakdown(totalBudget, rawCategories);
  budgetBreakdown.notes = 'Planning allowances only, not supplier quotes. Confirm local pricing and availability before committing funds.';

  const profileTasks: TimelineTask[] = profile.tasks.map((task, index) => ({
    id: `demo-${eventType}-task-${index + 1}`,
    title: task.title,
    description: interpolate(task.description, values),
    stage: task.stage,
    dueDate: addDaysSafe(eventDate, task.offsetDays),
    priority: task.priority,
    status: 'todo',
    category: task.category,
    owner: task.owner,
  }));
  const contextTasks = addContextTasks(event, addDaysSafe(eventDate, -14));
  const timelineTasks = normalizeTimelineTasks([...profileTasks, ...contextTasks], eventDate)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));

  const vendorChecklist = profile.vendors.map((vendor, index) => ({
    id: `demo-${eventType}-vendor-${index + 1}`,
    category: vendor.category,
    title: vendor.title,
    needDescription: interpolate(vendor.needDescription, values),
    whyItMatters: vendor.whyItMatters,
    bookingDeadline: addDaysSafe(eventDate, -vendor.daysBeforeEvent),
    priority: vendor.priority,
    status: 'needed' as const,
  }));

  const personalizedIdeas = profile.ideas.map((idea, index) => ({
    id: `demo-${eventType}-idea-${index + 1}`,
    category: idea.category,
    title: idea.title,
    description: idea.description,
    whyItFits: idea.whyItFits,
    tags: idea.tags,
  }));

  const risks = profile.risks.map((risk) => ({ ...risk }));
  if (venueType === 'outdoor' && !risks.some((risk) => /weather|rain|heat/i.test(risk.risk))) {
    risks.push({
      risk: 'Weather may affect the outdoor event',
      plan: 'Confirm a sheltered alternative, a decision deadline, and who will notify guests if the plan changes.',
      severity: 'high',
    });
  }

  const priorities = (event.priorities ?? []).filter(Boolean);
  const personalContext = [
    `Venue setup: ${venueType}; planned duration: ${event.duration || 'not specified'}.`,
    priorities.length ? `Priority focus: ${priorities.join(', ')}.` : '',
    event.dietaryRequirements ? `Food requirements: ${event.dietaryRequirements}.` : '',
    event.accessibilityRequirements ? `Accessibility request: ${event.accessibilityRequirements}.` : '',
    event.specialActivities ? `Planned activities: ${event.specialActivities}.` : '',
    event.additionalNotes ? `Host notes: ${event.additionalNotes}.` : '',
  ].filter(Boolean).join(' ');

  return {
    eventSummary: `${eventName} is a ${eventType} planned for ${eventDate} in ${location} for ${guestCount.toLocaleString()} guests. The ${currency} ${totalBudget.toLocaleString()} planning outline focuses on ${profile.summaryFocus}.${personalContext ? ` ${personalContext}` : ''}`,
    themeIdeas: {
      name: theme,
      description: `${profile.themeDescription} The proposed mood is ${atmosphere}.`,
      colorPalette: profile.colorPalette,
      vibeKeywords: profile.vibeKeywords,
    },
    budgetBreakdown,
    timelineTasks,
    vendorChecklist,
    eventDaySchedule: profile.schedule.map((item, index) => ({
      id: `demo-${eventType}-schedule-${index + 1}`,
      ...item,
    })),
    personalizedIdeas,
    risksAndContingencies: risks,
    generatedAt: new Date().toISOString(),
    generationSource: 'demo',
    modelUsed: 'Gatherly curated demo planner',
  };
}

/** Creates a pre-populated sample event for one-click demo exploration. */
export function createDefaultDemoEvent(): EventDetails {
  const now = new Date().toISOString();
  const baseEvent: EventDetails = {
    id: 'demo-event-wedding-2026',
    name: 'Aarav & Meera’s Lakeside Wedding',
    eventType: 'wedding',
    date: formatDateSafe(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)),
    duration: 'Full Day (8 hours)',
    location: 'Udaipur / Lakeside Pavilion',
    guestCount: 180,
    totalBudget: 850000,
    currency: 'INR',
    styleTheme: 'Royal Heritage with Contemporary Botanical Accents',
    venueType: 'mixed',
    atmosphere: 'Regal yet intimate, filled with soft candlelight and soulful acoustic music',
    priorities: ['Catering & Food Quality', 'Candid Photography', 'Warm Guest Hospitality', 'Stage Decor'],
    dietaryRequirements: '60% Vegetarian, Jain options required, dedicated Nut-free dessert station',
    accessibilityRequirements: 'Wheelchair ramp access for senior family members to main pavilion',
    specialActivities: 'Sunset vows by the water, evening acoustic folk performance, audio guestbook station',
    additionalNotes: 'Need a seamless transition from day ceremony to evening dinner under the stars.',
    isSample: true,
    createdAt: now,
    updatedAt: now,
  };

  baseEvent.plan = generateSamplePlan(baseEvent);
  return baseEvent;
}
