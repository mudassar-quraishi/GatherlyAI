import type { EventDetails } from '@/types/event';
import { StoredEventBaseSchema, StoredEventPlanSchema } from '@/lib/validation/storedEvents';
import { createDefaultDemoEvent } from '@/lib/ai/sampleProvider';
import { formatCurrency } from '@/lib/budget/calculator';

const STORAGE_KEY = 'gatherly_ai_events_v1';

function parseStoredEvent(candidate: unknown): EventDetails | null {
  const eventResult = StoredEventBaseSchema.safeParse(candidate);
  if (!eventResult.success) return null;

  if (typeof candidate !== 'object' || candidate === null || !('plan' in candidate)) {
    return eventResult.data;
  }

  const planResult = StoredEventPlanSchema.safeParse(candidate.plan);
  return planResult.success
    ? { ...eventResult.data, plan: planResult.data }
    : eventResult.data;
}

/**
 * Safe local storage service handling JSON parsing, versioning,
 * refresh survival, multi-event isolation, and export capabilities.
 */
export const eventStorage = {
  /**
   * Retrieves all saved events from browser localStorage.
   */
  getAllEvents(): EventDetails[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const events = parsed.flatMap((candidate) => {
          const event = parseStoredEvent(candidate);
          return event ? [event] : [];
        });
        return events.sort((left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
        );
      }
      return [];
    } catch (err) {
      console.error('[GatherlyAI Storage] Failed to load events from localStorage:', err);
      return [];
    }
  },

  /**
   * Retrieves a single event by ID.
   */
  getEventById(id: string): EventDetails | null {
    const events = this.getAllEvents();
    const found = events.find((e) => e.id === id);
    if (found) return found;

    // Auto-seed demo event on direct navigation if requested
    if (id === 'demo-event-wedding-2026') {
      return this.loadDemoEvent();
    }
    return null;
  },

  /**
   * Saves or inserts an event into localStorage.
   */
  saveEvent(event: EventDetails): void {
    if (typeof window === 'undefined') return;
    try {
      const events = this.getAllEvents();
      const existingIdx = events.findIndex((e) => e.id === event.id);
      
      const updatedEvent: EventDetails = {
        ...event,
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        events[existingIdx] = updatedEvent;
      } else {
        events.unshift(updatedEvent);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (err) {
      console.error('[GatherlyAI Storage] Failed to save event:', err);
    }
  },

  /**
   * Updates an existing event partially without affecting other fields or events.
   */
  updateEvent(id: string, updates: Partial<EventDetails>): EventDetails | null {
    if (typeof window === 'undefined') return null;
    try {
      const events = this.getAllEvents();
      const idx = events.findIndex((e) => e.id === id);
      if (idx === -1) return null;

      const updated: EventDetails = {
        ...events[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      events[idx] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      return updated;
    } catch (err) {
      console.error('[GatherlyAI Storage] Failed to update event:', err);
      return null;
    }
  },

  /**
   * Deletes an event by ID.
   */
  deleteEvent(id: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const events = this.getAllEvents();
      const filtered = events.filter((e) => e.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (err) {
      console.error('[GatherlyAI Storage] Failed to delete event:', err);
      return false;
    }
  },

  /**
   * Seeds demo event into storage if not already present, and returns it.
   */
  loadDemoEvent(): EventDetails {
    const demoEvent = createDefaultDemoEvent();
    this.saveEvent(demoEvent);
    return demoEvent;
  },

  /**
   * Clears all saved events.
   */
  resetAllEvents(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('[GatherlyAI Storage] Failed to reset events:', err);
    }
  },

  /**
   * Exports an event as a clean JSON backup file string.
   */
  exportEventAsJSON(id: string): string {
    const event = this.getEventById(id);
    if (!event) throw new Error('Event not found');
    return JSON.stringify(event, null, 2);
  },

  /**
   * Generates a readable plain-text event summary for copying to clipboard or messaging.
   */
  generatePlainTextSummary(event: EventDetails): string {
    const lines: string[] = [];
    lines.push(`=======================================================`);
    lines.push(`GATHERLY AI EVENT PLAN: ${event.name.toUpperCase()}`);
    lines.push(`Every celebration, thoughtfully planned.`);
    lines.push(`=======================================================`);
    lines.push(`Type: ${event.eventType.toUpperCase()}`);
    lines.push(`Date: ${event.date} | Duration: ${event.duration}`);
    lines.push(`Location: ${event.location}`);
    lines.push(`Guest Count: ${event.guestCount} guests`);
    lines.push(`Budget: ${formatCurrency(event.totalBudget, event.currency)}`);
    lines.push(`Style/Theme: ${event.styleTheme}`);
    lines.push(`Atmosphere: ${event.atmosphere}`);
    lines.push(``);

    if (event.plan) {
      lines.push(`--- SUMMARY ---`);
      lines.push(event.plan.eventSummary);
      lines.push(``);

      lines.push(`--- BUDGET ALLOCATION ---`);
      event.plan.budgetBreakdown.categories.forEach((cat) => {
        lines.push(
          `- ${cat.name}: ${formatCurrency(cat.allocatedAmount, event.currency)} (Spent: ${formatCurrency(cat.actualSpent, event.currency)})`
        );
      });
      lines.push(
        `Total Allocated: ${formatCurrency(event.plan.budgetBreakdown.totalAllocated, event.currency)} | Contingency: ${formatCurrency(event.plan.budgetBreakdown.contingencyAmount, event.currency)}`
      );
      lines.push(``);

      lines.push(`--- UPCOMING TIMELINE TASKS ---`);
      event.plan.timelineTasks.slice(0, 8).forEach((task) => {
        lines.push(`[${task.status === 'done' ? 'X' : ' '}] (${task.dueDate}) ${task.title} [${task.priority.toUpperCase()}]`);
      });
      lines.push(``);

      lines.push(`--- ESSENTIAL VENDORS ---`);
      event.plan.vendorChecklist.forEach((v) => {
        lines.push(`• [${v.status.toUpperCase()}] ${v.category}: ${v.title} (Deadline: ${v.bookingDeadline})`);
      });
      lines.push(``);

      lines.push(`--- EVENT-DAY SCHEDULE ---`);
      event.plan.eventDaySchedule.forEach((s) => {
        lines.push(`${s.startTime} - ${s.endTime}: ${s.activity} (${s.responsiblePerson || 'Host'})`);
      });
    }

    lines.push(``);
    lines.push(`Generated by Gatherly AI — https://gatherlyai.local`);
    return lines.join('\n');
  },
};
