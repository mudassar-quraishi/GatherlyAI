import { Check } from 'lucide-react';
import { CURRENCIES, FIELD_LABEL_CLASS, FORM_FIELD_CLASS, FORM_SELECT_CLASS, PRESET_STYLES, VENUE_TYPES } from './constants';
import { FieldError, StepIntroduction } from './shared';
import type { EventFormData, EventFormErrors } from '@/lib/events/wizard';

interface BudgetStyleStepProps {
  formData: EventFormData;
  errors: EventFormErrors;
  onChange: (updates: Partial<EventFormData>) => void;
}

export default function BudgetStyleStep({ formData, errors, onChange }: BudgetStyleStepProps) {
  return (
    <div className="space-y-6">
      <StepIntroduction
        title="Budget & Aesthetic Vision"
        description="We will reconcile category allocations against your target budget and style preferences."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1">
          <label htmlFor="currency" className={FIELD_LABEL_CLASS}>Currency *</label>
          <select
            id="currency"
            value={formData.currency}
            onChange={(event) => onChange({ currency: event.target.value })}
            className={FORM_SELECT_CLASS}
          >
            {CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.label}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="totalBudget" className={FIELD_LABEL_CLASS}>Total Planned Budget *</label>
          <input
            id="totalBudget"
            type="number"
            min="100"
            max="1000000000"
            step="5000"
            value={formData.totalBudget}
            onChange={(event) => onChange({ totalBudget: Number.parseFloat(event.target.value) || 0 })}
            className={`${FORM_FIELD_CLASS} font-semibold ${errors.totalBudget ? 'border-[#C0392B]' : 'border-[#E5DFD5]'}`}
            aria-invalid={Boolean(errors.totalBudget)}
            aria-describedby={errors.totalBudget ? 'totalBudget-error' : undefined}
          />
          <FieldError id="totalBudget-error" message={errors.totalBudget} />
        </div>
      </div>

      <div>
        <label htmlFor="styleTheme" className={FIELD_LABEL_CLASS}>Event Style & Theme *</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              aria-pressed={formData.styleTheme === style}
              onClick={() => onChange({ styleTheme: style })}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                formData.styleTheme === style
                  ? 'bg-[#1C3F30] text-white shadow-xs'
                  : 'bg-[#F4EFEB] text-[#64746D] hover:bg-[#E5DFD5]'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
        <input
          id="styleTheme"
          type="text"
          maxLength={120}
          value={formData.styleTheme}
          onChange={(event) => onChange({ styleTheme: event.target.value })}
          placeholder="Or specify custom theme (e.g. Minimalist Boho with Terracotta Accents)"
          className={`${FORM_FIELD_CLASS} ${errors.styleTheme ? 'border-[#C0392B]' : 'border-[#E5DFD5]'}`}
          aria-invalid={Boolean(errors.styleTheme)}
          aria-describedby={errors.styleTheme ? 'styleTheme-error' : undefined}
        />
        <FieldError id="styleTheme-error" message={errors.styleTheme} />
      </div>

      <div>
        <p id="venue-type-label" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-2">
          Venue Environment *
        </p>
        <div role="group" aria-labelledby="venue-type-label" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {VENUE_TYPES.map((venue) => (
            <button
              key={venue.id}
              type="button"
              aria-pressed={formData.venueType === venue.id}
              onClick={() => onChange({ venueType: venue.id })}
              className={`p-3 rounded-xl text-left border transition-all ${
                formData.venueType === venue.id
                  ? 'border-[#1C3F30] bg-[#E8F0EB]/60 ring-1 ring-[#1C3F30]'
                  : 'border-[#E5DFD5] bg-[#FFFFFF] hover:border-[#CDC5B7]'
              }`}
            >
              <div className="font-semibold text-xs text-[#1E2922] flex items-center justify-between">
                <span>{venue.label}</span>
                {formData.venueType === venue.id && <Check className="w-3.5 h-3.5 text-[#1C3F30]" />}
              </div>
              <p className="text-[11px] text-[#64746D] mt-0.5">{venue.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="atmosphere" className={FIELD_LABEL_CLASS}>Desired Atmosphere & Mood</label>
        <input
          id="atmosphere"
          type="text"
          maxLength={300}
          value={formData.atmosphere}
          onChange={(event) => onChange({ atmosphere: event.target.value })}
          placeholder="e.g. Warm, intimate, joyful, candlelit, upbeat, elegant"
          className={`${FORM_FIELD_CLASS} border-[#E5DFD5]`}
        />
      </div>
    </div>
  );
}
