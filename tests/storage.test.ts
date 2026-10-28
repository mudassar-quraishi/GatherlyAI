import { describe, it, expect, beforeEach } from 'vitest';
import { eventStorage } from '@/lib/storage/eventStorage';
import { EventDetails } from '@/types/event';

describe('Event Storage Service (localStorage abstraction)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and retrieves an event correctly', () => {
    const testEvent: EventDetails = {
      id: 'test-event-1',
      name: 'Rohan Birthday Bash',
      eventType: 'birthday',
      date: '2026-11-20',
      duration: 'Evening (4 hours)',
      location: 'Mumbai',
      guestCount: 50,
      totalBudget: 150000,
      currency: 'INR',
      styleTheme: 'Modern Neon',
      venueType: 'indoor',
      atmosphere: 'Upbeat and fun',
      priorities: ['Food', 'DJ'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    eventStorage.saveEvent(testEvent);
    const retrieved = eventStorage.getEventById('test-event-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('Rohan Birthday Bash');
  });

  it('updates an existing event without corrupting other fields', () => {
    const testEvent: EventDetails = {
      id: 'test-event-2',
      name: 'Anniversary Dinner',
      eventType: 'anniversary',
      date: '2026-12-10',
      duration: 'Evening',
      location: 'Delhi',
      guestCount: 20,
      totalBudget: 80000,
      currency: 'INR',
      styleTheme: 'Cozy Candlelight',
      venueType: 'indoor',
      atmosphere: 'Intimate',
      priorities: ['Hospitality'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    eventStorage.saveEvent(testEvent);
    const updated = eventStorage.updateEvent('test-event-2', { guestCount: 25 });
    expect(updated?.guestCount).toBe(25);
    expect(updated?.location).toBe('Delhi');

    const loaded = eventStorage.getEventById('test-event-2');
    expect(loaded?.guestCount).toBe(25);
  });

  it('deletes an event successfully', () => {
    const testEvent: EventDetails = {
      id: 'delete-me',
      name: 'Temporary Event',
      eventType: 'other',
      date: '2026-11-05',
      duration: '2 hours',
      location: 'Park',
      guestCount: 10,
      totalBudget: 10000,
      currency: 'INR',
      styleTheme: 'Simple',
      venueType: 'outdoor',
      atmosphere: 'Casual',
      priorities: ['Affordability'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    eventStorage.saveEvent(testEvent);
    expect(eventStorage.getEventById('delete-me')).not.toBeNull();

    const success = eventStorage.deleteEvent('delete-me');
    expect(success).toBe(true);
    expect(eventStorage.getEventById('delete-me')).toBeNull();
  });

  it('loads the default demo event with full plan structure', () => {
    const demo = eventStorage.loadDemoEvent();
    expect(demo).toBeDefined();
    expect(demo.name).toContain('Wedding');
    expect(demo.plan).toBeDefined();
    expect(demo.plan?.budgetBreakdown.categories.length).toBeGreaterThan(3);
    expect(demo.plan?.timelineTasks.length).toBeGreaterThan(3);
    expect(demo.plan?.eventDaySchedule.length).toBeGreaterThan(3);
  });

  it('exports JSON and generates plain text summary', () => {
    const demo = eventStorage.loadDemoEvent();
    const jsonStr = eventStorage.exportEventAsJSON(demo.id);
    expect(jsonStr).toContain('Aarav & Meera');

    const summary = eventStorage.generatePlainTextSummary(demo);
    expect(summary).toContain('GATHERLY AI EVENT PLAN');
    expect(summary).toContain('BUDGET ALLOCATION');
  });
});
