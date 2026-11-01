import { describe, expect, it } from 'vitest';
import {
  MAX_SELECTED_PRIORITIES,
  togglePrioritySelection,
  validateEventWizardStep,
  type EventFormData,
} from '@/lib/events/wizard';

const validEventForm: EventFormData = {
  name: 'Garden birthday',
  eventType: 'birthday',
  date: '2027-06-15',
  duration: 'Evening (4 hours)',
  location: 'Pune',
  guestCount: 60,
  totalBudget: 150000,
  currency: 'INR',
  styleTheme: 'Modern botanical',
  venueType: 'outdoor',
  atmosphere: 'Relaxed and welcoming',
  priorities: ['Food quality'],
  dietaryRequirements: '',
  accessibilityRequirements: '',
  specialActivities: '',
  additionalNotes: '',
};

describe('event wizard rules', () => {
  it('accepts valid event basics and rejects trimmed or out-of-range values', () => {
    expect(validateEventWizardStep(validEventForm, 1)).toEqual({});
    expect(validateEventWizardStep({
      ...validEventForm,
      name: ' A ',
      location: ' ',
      date: '2027-02-30',
      guestCount: 50001,
    }, 1)).toMatchObject({
      name: expect.any(String),
      location: expect.any(String),
      date: expect.any(String),
      guestCount: expect.any(String),
    });
  });

  it('enforces the same budget and theme bounds as the server schema', () => {
    expect(validateEventWizardStep(validEventForm, 2)).toEqual({});
    expect(validateEventWizardStep({
      ...validEventForm,
      totalBudget: 99,
      styleTheme: ' '.repeat(121),
    }, 2)).toMatchObject({
      totalBudget: expect.any(String),
      styleTheme: expect.any(String),
    });
  });

  it('keeps priority selections between one and four', () => {
    const fourPriorities = ['Food', 'Access', 'Music', 'Photos'];
    const capped = togglePrioritySelection(fourPriorities, 'Decor');
    expect(capped).toBe(fourPriorities);
    expect(capped).toHaveLength(MAX_SELECTED_PRIORITIES);
    expect(togglePrioritySelection(['Food'], 'Food')).toEqual(['Food']);
    expect(togglePrioritySelection(['Food', 'Access'], 'Access')).toEqual(['Food']);
  });

  it('rejects a manually constructed priority list outside the UI limit', () => {
    expect(validateEventWizardStep({
      ...validEventForm,
      priorities: ['Food', 'Access', 'Music', 'Photos', 'Decor'],
    }, 3).priorities).toBe('Select between 1 and 4 priorities');
  });
});
