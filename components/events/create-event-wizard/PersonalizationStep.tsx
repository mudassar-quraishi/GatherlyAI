import { Check } from 'lucide-react';
import { FIELD_LABEL_CLASS, FORM_FIELD_CLASS, PRIORITY_OPTIONS } from './constants';
import { FieldError, StepIntroduction } from './shared';
import type { EventFormData, EventFormErrors } from '@/lib/events/wizard';

interface PersonalizationStepProps {
  formData: EventFormData;
  errors: EventFormErrors;
  onChange: (updates: Partial<EventFormData>) => void;
  onTogglePriority: (priority: string) => void;
}

export default function PersonalizationStep({ formData, errors, onChange, onTogglePriority }: PersonalizationStepProps) {
  return (
    <div className="space-y-6">
      <StepIntroduction
        title="Personalization & Special Requirements"
        description="Tell us what matters most so the AI allocates resources where they count."
      />

      <div>
        <p id="priorities-label" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-2">
          Top Priorities (Pick 1 to 4) *
        </p>
        <div
          role="group"
          aria-labelledby="priorities-label"
          aria-describedby={errors.priorities ? 'priorities-error' : undefined}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
        >
          {PRIORITY_OPTIONS.map((priority) => {
            const selected = formData.priorities.includes(priority);
            return (
              <button
                key={priority}
                type="button"
                aria-pressed={selected}
                onClick={() => onTogglePriority(priority)}
                className={`p-3 rounded-xl text-left border flex items-center justify-between transition-all ${
                  selected
                    ? 'border-[#1C3F30] bg-[#E8F0EB] text-[#1C3F30] font-semibold'
                    : 'border-[#E5DFD5] bg-[#FFFFFF] text-[#64746D] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="text-xs sm:text-sm">{priority}</span>
                {selected && <Check className="w-4 h-4 text-[#1C3F30]" />}
              </button>
            );
          })}
        </div>
        <FieldError id="priorities-error" message={errors.priorities} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dietary" className={FIELD_LABEL_CLASS}>Dietary Preferences</label>
          <input
            id="dietary"
            type="text"
            maxLength={500}
            value={formData.dietaryRequirements}
            onChange={(event) => onChange({ dietaryRequirements: event.target.value })}
            placeholder="e.g. Vegetarian, Jain counters, Nut allergy caution"
            className={`${FORM_FIELD_CLASS} border-[#E5DFD5]`}
          />
        </div>

        <div>
          <label htmlFor="accessibility" className={FIELD_LABEL_CLASS}>Accessibility Needs</label>
          <input
            id="accessibility"
            type="text"
            maxLength={500}
            value={formData.accessibilityRequirements}
            onChange={(event) => onChange({ accessibilityRequirements: event.target.value })}
            placeholder="e.g. Wheelchair ramp, elderly seating, quiet rest corner"
            className={`${FORM_FIELD_CLASS} border-[#E5DFD5]`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="activities" className={FIELD_LABEL_CLASS}>Special Traditions or Planned Activities</label>
        <input
          id="activities"
          type="text"
          maxLength={500}
          value={formData.specialActivities}
          onChange={(event) => onChange({ specialActivities: event.target.value })}
          placeholder="e.g. Sunset exchange of vows, sangeet dancing, audio guestbook station"
          className={`${FORM_FIELD_CLASS} border-[#E5DFD5]`}
        />
      </div>

      <div>
        <label htmlFor="notes" className={FIELD_LABEL_CLASS}>Additional Notes or Specific Instructions</label>
        <textarea
          id="notes"
          rows={3}
          maxLength={1000}
          value={formData.additionalNotes}
          onChange={(event) => onChange({ additionalNotes: event.target.value })}
          placeholder="Any special details, organizer contact requirements, or vendor constraints..."
          className={`${FORM_FIELD_CLASS} border-[#E5DFD5]`}
        />
      </div>
    </div>
  );
}
