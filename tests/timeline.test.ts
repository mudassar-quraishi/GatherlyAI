import { describe, it, expect } from 'vitest';
import {
  parseDateSafe,
  formatDateSafe,
  addDaysSafe,
  getDaysUntilEvent,
  normalizeTimelineTasks,
} from '@/lib/timeline/calculator';
import { TimelineTask } from '@/types/event';

describe('Timeline & Date Handling', () => {
  it('parses and formats dates without timezone shifting', () => {
    const dateStr = '2026-11-20';
    const parsed = parseDateSafe(dateStr);
    expect(formatDateSafe(parsed)).toBe(dateStr);
  });

  it('rejects invalid or non-existent calendar dates', () => {
    expect(() => parseDateSafe('2026-02-31')).toThrow();
    expect(() => parseDateSafe('invalid-date')).toThrow();
    expect(() => parseDateSafe('')).toThrow();
  });

  it('calculates date addition accurately', () => {
    expect(addDaysSafe('2026-11-20', 10)).toBe('2026-11-30');
    expect(addDaysSafe('2026-11-20', -5)).toBe('2026-11-15');
    expect(addDaysSafe('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('calculates days until event accurately', () => {
    expect(getDaysUntilEvent('2026-12-15', '2026-12-10')).toBe(5);
    expect(getDaysUntilEvent('2026-12-05', '2026-12-10')).toBe(-5);
  });

  it('adapts tasks for short-notice events (e.g. 3 days away) without past dates', () => {
    const eventDate = '2026-11-03';
    const referenceDate = '2026-10-31'; // 3 days away

    const rawTasks: TimelineTask[] = [
      {
        id: '1',
        title: 'Book Venue',
        description: 'Book 3 months in advance',
        stage: 'initial-planning',
        dueDate: '2026-09-01', // in the past relative to referenceDate
        priority: 'high',
        status: 'todo',
      },
      {
        id: '2',
        title: 'Day before packing',
        description: 'Pack kit',
        stage: 'day-before',
        dueDate: '2026-11-02',
        priority: 'high',
        status: 'todo',
      },
    ];

    const normalized = normalizeTimelineTasks(rawTasks, eventDate, referenceDate);
    // Task 1's past due date should be clamped to referenceDate
    expect(normalized[0].dueDate).toBe(referenceDate);
    // Initial-planning stage should be accelerated to final-week for ultra-short events
    expect(normalized[0].stage).toBe('final-week');
  });
});
