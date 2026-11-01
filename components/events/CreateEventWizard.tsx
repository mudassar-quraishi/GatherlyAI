'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import type { EventDetails } from '@/types/event';
import { eventStorage } from '@/lib/storage/eventStorage';
import { formatDateSafe } from '@/lib/timeline/calculator';
import {
  togglePrioritySelection,
  validateEventWizardStep,
  type EventFormData,
  type EventFormErrors,
  type EventWizardStep,
} from '@/lib/events/wizard';
import BasicsStep from './create-event-wizard/BasicsStep';
import BudgetStyleStep from './create-event-wizard/BudgetStyleStep';
import PersonalizationStep from './create-event-wizard/PersonalizationStep';

const STEP_LABELS: Record<EventWizardStep, string> = {
  1: 'Event Basics',
  2: 'Budget & Atmosphere',
  3: 'Personalization & Priorities',
};

const INITIAL_FORM_DATA: EventFormData = {
  name: '',
  eventType: 'wedding',
  date: '',
  duration: 'Full Day (8 hours)',
  location: '',
  guestCount: 120,
  totalBudget: 500000,
  currency: 'INR',
  styleTheme: 'Elegant Traditional',
  venueType: 'mixed',
  atmosphere: 'Warm, joyful, and filled with soulful hospitality',
  priorities: ['Exquisite Food & Hospitality', 'Candid Photography & Film'],
  dietaryRequirements: '',
  accessibilityRequirements: '',
  specialActivities: '',
  additionalNotes: '',
};

export default function CreateEventWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<EventWizardStep>(1);
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [formData, setFormData] = useState<EventFormData>(INITIAL_FORM_DATA);

  useEffect(() => {
    const timer = setTimeout(() => {
      const target = new Date();
      target.setDate(target.getDate() + 45);
      const defaultDate = formatDateSafe(target);
      setFormData((previous) => ({ ...previous, date: previous.date || defaultDate }));
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const updateFormData = (updates: Partial<EventFormData>) => {
    setFormData((previous) => ({ ...previous, ...updates }));
  };

  const validateStep = (step: EventWizardStep): boolean => {
    const nextErrors = validateEventWizardStep(formData, step);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((step) => step === 1 ? 2 : 3);
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((step) => step === 3 ? 2 : 1);
  };

  const handleTogglePriority = (priority: string) => {
    setFormData((previous) => ({
      ...previous,
      priorities: togglePrioritySelection(previous.priorities, priority),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateStep(3)) return;

    const timestamp = new Date().toISOString();
    const newEvent: EventDetails = {
      id: `event-${Date.now()}`,
      name: formData.name.trim(),
      eventType: formData.eventType,
      date: formData.date,
      duration: formData.duration,
      location: formData.location.trim(),
      guestCount: formData.guestCount,
      totalBudget: formData.totalBudget,
      currency: formData.currency,
      styleTheme: formData.styleTheme.trim(),
      venueType: formData.venueType,
      atmosphere: formData.atmosphere.trim(),
      priorities: formData.priorities,
      dietaryRequirements: formData.dietaryRequirements.trim(),
      accessibilityRequirements: formData.accessibilityRequirements.trim(),
      specialActivities: formData.specialActivities.trim(),
      additionalNotes: formData.additionalNotes.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    eventStorage.saveEvent(newEvent);
    router.push(`/events/${newEvent.id}`);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-[#F4EFEB] px-6 py-5 border-b border-[#E5DFD5]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#1C3F30] uppercase tracking-wider">
            Step {currentStep} of 3
          </span>
          <span className="text-xs text-[#64746D]">{STEP_LABELS[currentStep]}</span>
        </div>
        <div className="w-full bg-[#E5DFD5] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#1C3F30] h-full rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        {currentStep === 1 && (
          <BasicsStep formData={formData} errors={errors} onChange={updateFormData} />
        )}
        {currentStep === 2 && (
          <BudgetStyleStep formData={formData} errors={errors} onChange={updateFormData} />
        )}
        {currentStep === 3 && (
          <PersonalizationStep
            formData={formData}
            errors={errors}
            onChange={updateFormData}
            onTogglePriority={handleTogglePriority}
          />
        )}

        <div className="mt-8 pt-6 border-t border-[#E5DFD5] flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#64746D] hover:bg-[#F4EFEB] transition-colors focus:outline-none"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : <div />}

          {currentStep < 3 ? (
            <button
              key="btn-continue"
              type="button"
              onClick={handleNext}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#1C3F30] hover:bg-[#153226] text-white text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1C3F30] focus:ring-offset-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 text-[#FDF1EB]" />
            </button>
          ) : (
            <button
              key="btn-submit"
              type="submit"
              className="inline-flex items-center space-x-2 px-7 py-3 rounded-xl bg-[#1C3F30] hover:bg-[#153226] text-white text-sm font-bold shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#1C3F30] focus:ring-offset-2"
            >
              <Sparkles className="w-4 h-4 text-[#FDF1EB]" />
              <span>Create Event Workspace</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
