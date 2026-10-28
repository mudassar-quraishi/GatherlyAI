import { TaskStage, TimelineTask } from '@/types/event';

/**
 * Parses YYYY-MM-DD string into a safe Date object at UTC midnight
 * to avoid timezone shifts between client and server.
 */
export function parseDateSafe(dateString: string): Date {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  const parts = dateString.trim().split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid date format, expected YYYY-MM-DD: ${dateString}`);
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 0 || month > 11 || day < 1 || day > 31) {
    throw new Error(`Invalid calendar date: ${dateString}`);
  }

  const d = new Date(Date.UTC(year, month, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month || d.getUTCDate() !== day) {
    throw new Error(`Date does not exist on calendar: ${dateString}`);
  }
  return d;
}

/**
 * Formats a Date object to YYYY-MM-DD string safely using UTC.
 */
export function formatDateSafe(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds or subtracts days from a YYYY-MM-DD string in a timezone-safe manner.
 */
export function addDaysSafe(dateString: string, days: number): string {
  const d = parseDateSafe(dateString);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDateSafe(d);
}

/**
 * Calculates days remaining from today (or reference date) until event date.
 */
export function getDaysUntilEvent(eventDateString: string, referenceDateString?: string): number {
  const eventDate = parseDateSafe(eventDateString);
  const refDate = referenceDateString
    ? parseDateSafe(referenceDateString)
    : parseDateSafe(formatDateSafe(new Date()));

  const diffMs = eventDate.getTime() - refDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns stage label human-friendly
 */
export function getStageLabel(stage: TaskStage): string {
  switch (stage) {
    case 'initial-planning':
      return 'Initial Planning & Concept';
    case 'early-preparations':
      return 'Early Preparations & Bookings';
    case 'month-before':
      return '2–4 Weeks Before';
    case 'final-week':
      return 'Final Week Count-Down';
    case 'day-before':
      return 'Day Before';
    case 'event-day':
      return 'Event Day Coordination';
    case 'post-event':
      return 'Post-Event Wrap-Up';
    default:
      return 'Planning Stage';
  }
}

/**
 * Normalizes timeline tasks to ensure:
 * 1. Due dates are valid YYYY-MM-DD strings.
 * 2. Due dates are clamped reasonably between planning start and event date (or +2 days for post-event).
 * 3. Short-notice events (e.g. < 14 days) collapse long-lead stages into accelerated timelines.
 */
export function normalizeTimelineTasks(
  tasks: TimelineTask[],
  eventDateString: string,
  referenceDateString?: string
): TimelineTask[] {
  const daysUntil = getDaysUntilEvent(eventDateString, referenceDateString);
  const todayStr = referenceDateString || formatDateSafe(new Date());

  const isShortNotice = daysUntil < 14;
  const isUltraShortNotice = daysUntil <= 4;

  return tasks.map((task, idx) => {
    let safeDueDate: string;
    try {
      safeDueDate = formatDateSafe(parseDateSafe(task.dueDate));
    } catch {
      safeDueDate = eventDateString;
    }

    // If due date was set in the past relative to today, adjust to today or accelerated timeline
    const daysFromTodayToTask = getDaysUntilEvent(safeDueDate, todayStr);
    if (daysFromTodayToTask < 0 && daysUntil > 0) {
      safeDueDate = todayStr;
    }

    // If event is short notice, adapt the stage
    let adjustedStage = task.stage;
    if (isUltraShortNotice) {
      if (task.stage === 'initial-planning' || task.stage === 'early-preparations') {
        adjustedStage = 'final-week';
      }
    } else if (isShortNotice) {
      if (task.stage === 'initial-planning') {
        adjustedStage = 'early-preparations';
      }
    }

    return {
      ...task,
      id: task.id || `task-${idx}-${Date.now()}`,
      dueDate: safeDueDate,
      stage: adjustedStage,
      status: task.status || 'todo',
      priority: task.priority || 'medium',
    };
  });
}
