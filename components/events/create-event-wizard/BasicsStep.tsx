import { Check } from 'lucide-react';
import { EVENT_DURATIONS, EVENT_TYPES, FIELD_LABEL_CLASS, FORM_FIELD_CLASS, FORM_SELECT_CLASS } from './constants';
import { FieldError, StepIntroduction } from './shared';
import type { EventFormData, EventFormErrors } from '@/lib/events/wizard';

interface BasicsStepProps {
  formData: EventFormData;
  errors: EventFormErrors;
  onChange: (updates: Partial<EventFormData>) => void;
}

export default function BasicsStep({ formData, errors, onChange }: BasicsStepProps) {
  return (
    <div className="space-y-6">
      <StepIntroduction
        title="Tell us about your celebration"
        description="Enter the core fundamentals so we can anchor your timeline and venue planning."
      />

      <div>
        <label htmlFor="name" className={FIELD_LABEL_CLASS}>Event Name *</label>
        <input
          id="name"
          type="text"
          maxLength={100}
          value={formData.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="e.g. Maya & Kabir's Reception or Grandma's 80th Birthday"
          className={`${FORM_FIELD_CLASS} ${errors.name ? 'border-[#C0392B]' : 'border-[#E5DFD5]'}`}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        <FieldError id="name-error" message={errors.name} />
      </div>

      <div>
        <p id="event-type-label" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-2">
          Celebration Type *
        </p>
        <div role="group" aria-labelledby="event-type-label" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EVENT_TYPES.map((item) => (
            <button
              key={item.type}
              type="button"
              aria-pressed={formData.eventType === item.type}
              onClick={() => onChange({ eventType: item.type })}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                formData.eventType === item.type
                  ? 'border-[#1C3F30] bg-[#E8F0EB]/60 ring-1 ring-[#1C3F30]'
                  : 'border-[#E5DFD5] bg-[#FFFFFF] hover:border-[#CDC5B7]'
              }`}
            >
              <div className="font-semibold text-sm text-[#1E2922] flex items-center justify-between">
                <span>{item.label}</span>
                {formData.eventType === item.type && <Check className="w-4 h-4 text-[#1C3F30]" />}
              </div>
              <p className="text-[11px] text-[#64746D] mt-1">{item.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className={FIELD_LABEL_CLASS}>Celebration Date *</label>
          <input
            id="date"
            type="date"
            value={formData.date}
            onChange={(event) => onChange({ date: event.target.value })}
            className={`${FORM_FIELD_CLASS} ${errors.date ? 'border-[#C0392B]' : 'border-[#E5DFD5]'}`}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? 'date-error' : undefined}
          />
          <FieldError id="date-error" message={errors.date} />
        </div>

        <div>
          <label htmlFor="duration" className={FIELD_LABEL_CLASS}>Duration *</label>
          <select
            id="duration"
            value={formData.duration}
            onChange={(event) => onChange({ duration: event.target.value })}
            className={FORM_SELECT_CLASS}
          >
            {EVENT_DURATIONS.map((duration) => <option key={duration} value={duration}>{duration}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="location" className={FIELD_LABEL_CLASS}>City or Venue Location *</label>
          <input
            id="location"
            type="text"
            maxLength={150}
            value={formData.location}
            onChange={(event) => onChange({ location: event.target.value })}
            placeholder="e.g. South Mumbai, Jaipur, Bengaluru, or Delhi NCR"
            className={`${FORM_FIELD_CLASS} ${errors.location ? 'border-[#C0392B]' : 'border-[#E5DFD5]'}`}
            aria-invalid={Boolean(errors.location)}
            aria-describedby={errors.location ? 'location-error' : undefined}
          />
          <FieldError id="location-error" message={errors.location} />
        </div>

        <div>
          <label htmlFor="guestCount" className={FIELD_LABEL_CLASS}>Estimated Guest Count *</label>
          <input
            id="guestCount"
            type="number"
            min="1"
            max="50000"
            step="1"
            value={formData.guestCount}
            onChange={(event) => onChange({ guestCount: Number.parseInt(event.target.value, 10) || 0 })}
            className={`${FORM_FIELD_CLASS} ${errors.guestCount ? 'border-[#C0392B]' : 'border-[#E5DFD5]'}`}
            aria-invalid={Boolean(errors.guestCount)}
            aria-describedby={errors.guestCount ? 'guestCount-error' : undefined}
          />
          <FieldError id="guestCount-error" message={errors.guestCount} />
        </div>
      </div>
    </div>
  );
}
