import type { EventType, VenueType } from '@/types/event';
import { isValidDateOnly } from '@/lib/dates/dateOnly';

export type EventWizardStep = 1 | 2 | 3;

export interface EventFormData {
  name: string;
  eventType: EventType;
  date: string;
  duration: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  styleTheme: string;
  venueType: VenueType;
  atmosphere: string;
  priorities: string[];
  dietaryRequirements: string;
  accessibilityRequirements: string;
  specialActivities: string;
  additionalNotes: string;
}

export type EventFormErrors = Partial<Record<keyof EventFormData, string>>;

export const MAX_SELECTED_PRIORITIES = 4;

export function togglePrioritySelection(selected: string[], priority: string): string[] {
  if (selected.includes(priority)) {
    return selected.length > 1 ? selected.filter((item) => item !== priority) : selected;
  }

  if (selected.length >= MAX_SELECTED_PRIORITIES) return selected;
  return [...selected, priority];
}

export function validateEventWizardStep(
  formData: EventFormData,
  step: EventWizardStep
): EventFormErrors {
  const errors: EventFormErrors = {};

  if (step === 1) {
    const eventName = formData.name.trim();
    const location = formData.location.trim();

    if (eventName.length < 2 || eventName.length > 100) {
      errors.name = 'Please provide an event name (2 to 100 characters)';
    }
    if (location.length < 2 || location.length > 150) {
      errors.location = 'Please provide a city or venue location (2 to 150 characters)';
    }
    if (!isValidDateOnly(formData.date)) errors.date = 'Please pick a valid date for your celebration';
    if (!Number.isInteger(formData.guestCount) || formData.guestCount < 1 || formData.guestCount > 50000) {
      errors.guestCount = 'Guest count must be between 1 and 50,000';
    }
  }

  if (step === 2) {
    if (!Number.isFinite(formData.totalBudget) || formData.totalBudget < 100 || formData.totalBudget > 1000000000) {
      errors.totalBudget = 'Total budget must be between 100 and 1,000,000,000';
    }
    if (formData.styleTheme.trim().length < 2 || formData.styleTheme.trim().length > 120) {
      errors.styleTheme = 'Please provide an event style or theme (2 to 120 characters)';
    }
  }

  if (step === 3) {
    if (formData.priorities.length < 1 || formData.priorities.length > MAX_SELECTED_PRIORITIES) {
      errors.priorities = `Select between 1 and ${MAX_SELECTED_PRIORITIES} priorities`;
    }
  }

  return errors;
}
