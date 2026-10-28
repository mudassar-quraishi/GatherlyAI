'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
} from 'lucide-react';
import { EventDetails, EventType, VenueType } from '@/types/event';
import { eventStorage } from '@/lib/storage/eventStorage';
import { formatDateSafe } from '@/lib/timeline/calculator';

const EVENT_TYPES: { type: EventType; label: string; desc: string }[] = [
  { type: 'wedding', label: 'Wedding / Engagement', desc: 'Ceremonies, banquets, and matrimonial receptions' },
  { type: 'birthday', label: 'Milestone Birthday', desc: 'Joyful celebrations, themed parties, family milestones' },
  { type: 'anniversary', label: 'Anniversary', desc: 'Milestone years, vow renewals, family reunions' },
  { type: 'community', label: 'Community Gathering', desc: 'Neighborhood socials, cultural festivals, block parties' },
  { type: 'fundraiser', label: 'Charity Fundraiser', desc: 'Galas, auctions, and community benefit drives' },
  { type: 'other', label: 'Special Occasion', desc: 'Retirements, graduations, and intimate celebrations' },
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (A$)' },
];

const PRESET_STYLES = [
  'Elegant Traditional',
  'Modern Botanical',
  'Royal Heritage',
  'Rustic Chic',
  'Warm Minimalist',
  'Vibrant & Colorful',
  'Cozy Candlelit',
];

const PRIORITY_OPTIONS = [
  'Exquisite Food & Hospitality',
  'Candid Photography & Film',
  'Atmospheric Decor & Lighting',
  'Music, DJ & Entertainment',
  'Guest Accessibility & Comfort',
  'Eco-Friendly & Zero-Waste',
  'Affordability & Cost Discipline',
  'Children & Family Activities',
];

export default function CreateEventWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    eventType: 'wedding' as EventType,
    date: '',
    duration: 'Full Day (8 hours)',
    location: '',
    guestCount: 120,
    totalBudget: 500000,
    currency: 'INR',
    styleTheme: 'Elegant Traditional',
    venueType: 'mixed' as VenueType,
    atmosphere: 'Warm, joyful, and filled with soulful hospitality',
    priorities: ['Exquisite Food & Hospitality', 'Candid Photography & Film'],
    dietaryRequirements: '',
    accessibilityRequirements: '',
    specialActivities: '',
    additionalNotes: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const target = new Date();
      target.setDate(target.getDate() + 45);
      const defaultDate = formatDateSafe(target);
      setFormData((prev) => ({
        ...prev,
        date: prev.date || defaultDate,
      }));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const togglePriority = (priority: string) => {
    setFormData((prev) => {
      const exists = prev.priorities.includes(priority);
      if (exists) {
        if (prev.priorities.length === 1) return prev; // keep at least 1
        return { ...prev, priorities: prev.priorities.filter((p) => p !== priority) };
      } else {
        if (prev.priorities.length >= 5) return prev; // max 5
        return { ...prev, priorities: [...prev.priorities, priority] };
      }
    });
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim() || formData.name.length < 2) {
        newErrors.name = 'Please provide an event name (at least 2 characters)';
      }
      if (!formData.location.trim()) {
        newErrors.location = 'Please specify a city or venue location';
      }
      if (!formData.date) {
        newErrors.date = 'Please pick a date for your celebration';
      }
      if (formData.guestCount < 1) {
        newErrors.guestCount = 'Guest count must be at least 1';
      }
    }

    if (step === 2) {
      if (formData.totalBudget <= 0) {
        newErrors.totalBudget = 'Total budget must be greater than zero';
      }
      if (!formData.styleTheme.trim()) {
        newErrors.styleTheme = 'Please select or enter an event style or theme';
      }
    }

    if (step === 3) {
      if (formData.priorities.length === 0) {
        newErrors.priorities = 'Please select at least one priority';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    const newEvent: EventDetails = {
      id: `event-${Date.now()}`,
      name: formData.name.trim(),
      eventType: formData.eventType,
      date: formData.date,
      duration: formData.duration,
      location: formData.location.trim(),
      guestCount: Number(formData.guestCount),
      totalBudget: Number(formData.totalBudget),
      currency: formData.currency,
      styleTheme: formData.styleTheme.trim(),
      venueType: formData.venueType,
      atmosphere: formData.atmosphere.trim(),
      priorities: formData.priorities,
      dietaryRequirements: formData.dietaryRequirements.trim(),
      accessibilityRequirements: formData.accessibilityRequirements.trim(),
      specialActivities: formData.specialActivities.trim(),
      additionalNotes: formData.additionalNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save event in localStorage
    eventStorage.saveEvent(newEvent);

    // Redirect to the event's dedicated workspace
    router.push(`/events/${newEvent.id}`);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl shadow-sm overflow-hidden">
      {/* Wizard Progress Header */}
      <div className="bg-[#F4EFEB] px-6 py-5 border-b border-[#E5DFD5]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#1C3F30] uppercase tracking-wider">
            Step {currentStep} of 3
          </span>
          <span className="text-xs text-[#64746D]">
            {currentStep === 1
              ? 'Event Basics'
              : currentStep === 2
              ? 'Budget & Atmosphere'
              : 'Personalization & Priorities'}
          </span>
        </div>
        <div className="w-full bg-[#E5DFD5] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#1C3F30] h-full rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        {/* STEP 1: BASICS */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1E2922]">
                Tell us about your celebration
              </h2>
              <p className="text-xs sm:text-sm text-[#64746D] mt-1">
                Enter the core fundamentals so we can anchor your timeline and venue planning.
              </p>
            </div>

            {/* Event Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-1.5">
                Event Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Maya & Kabir's Reception or Grandma's 80th Birthday"
                className={`w-full px-4 py-2.5 rounded-xl border bg-[#FAF8F5] text-[#1E2922] text-sm focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all ${
                  errors.name ? 'border-[#C0392B]' : 'border-[#E5DFD5]'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-[#C0392B] mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Event Type Grid */}
            <div>
              <label className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-2">
                Celebration Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {EVENT_TYPES.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setFormData({ ...formData, eventType: item.type })}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      formData.eventType === item.type
                        ? 'border-[#1C3F30] bg-[#E8F0EB]/60 ring-1 ring-[#1C3F30]'
                        : 'border-[#E5DFD5] bg-[#FFFFFF] hover:border-[#CDC5B7]'
                    }`}
                  >
                    <div className="font-semibold text-sm text-[#1E2922] flex items-center justify-between">
                      <span>{item.label}</span>
                      {formData.eventType === item.type && (
                        <Check className="w-4 h-4 text-[#1C3F30]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#64746D] mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date and Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-1.5">
                  Celebration Date *
                </label>
                <div className="relative">
                  <input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-[#FAF8F5] text-[#1E2922] text-sm focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all ${
                      errors.date ? 'border-[#C0392B]' : 'border-[#E5DFD5]'
                    }`}
                  />
                </div>
                {errors.date && (
                  <p className="text-xs text-[#C0392B] mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.date}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="duration" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-1.5">
                  Duration *
                </label>
                <select
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-[#1E2922] text-sm focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all"
                >
                  <option value="Evening (4 hours)">Evening (4 hours)</option>
                  <option value="Afternoon (3 hours)">Afternoon (3 hours)</option>
                  <option value="Full Day (8 hours)">Full Day (8 hours)</option>
                  <option value="Late Night Celebration (6 hours)">Late Night Celebration (6 hours)</option>
                  <option value="Multi-day (2 days)">Multi-day (2 days)</option>
                  <option value="Weekend Celebration (3 days)">Weekend Celebration (3 days)</option>
                </select>
              </div>
            </div>

            {/* Location and Guest Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-1.5">
                  City or Venue Location *
                </label>
                <div className="relative">
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. South Mumbai, Jaipur, Bengaluru, or Delhi NCR"
                    className={`w-full px-4 py-2.5 rounded-xl border bg-[#FAF8F5] text-[#1E2922] text-sm focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all ${
                      errors.location ? 'border-[#C0392B]' : 'border-[#E5DFD5]'
                    }`}
                  />
                </div>
                {errors.location && (
                  <p className="text-xs text-[#C0392B] mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.location}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="guestCount" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-1.5">
                  Estimated Guest Count *
                </label>
                <input
                  id="guestCount"
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) || 0 })}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-[#FAF8F5] text-[#1E2922] text-sm focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all ${
                    errors.guestCount ? 'border-[#C0392B]' : 'border-[#E5DFD5]'
                  }`}
                />
                {errors.guestCount && (
                  <p className="text-xs text-[#C0392B] mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.guestCount}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BUDGET & STYLE */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1E2922]">
                Budget & Aesthetic Vision
              </h2>
              <p className="text-xs sm:text-sm text-[#64746D] mt-1">
                We will reconcile category allocations against your target budget and style preferences.
              </p>
            </div>

            {/* Currency & Total Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label htmlFor="currency" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-1.5">
                  Currency *
                </label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-[#1E2922] text-sm focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="totalBudget" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-1.5">
                  Total Planned Budget *
                </label>
                <div className="relative">
                  <input
                    id="totalBudget"
                    type="number"
                    min="100"
                    step="5000"
                    value={formData.totalBudget}
                    onChange={(e) => setFormData({ ...formData, totalBudget: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-[#FAF8F5] text-[#1E2922] text-sm font-semibold focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all ${
                      errors.totalBudget ? 'border-[#C0392B]' : 'border-[#E5DFD5]'
                    }`}
                  />
                </div>
                {errors.totalBudget && (
                  <p className="text-xs text-[#C0392B] mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.totalBudget}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Theme & Style */}
            <div>
              <label htmlFor="styleTheme" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-1.5">
                Event Style & Theme *
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PRESET_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setFormData({ ...formData, styleTheme: style })}
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
                value={formData.styleTheme}
                onChange={(e) => setFormData({ ...formData, styleTheme: e.target.value })}
                placeholder="Or specify custom theme (e.g. Minimalist Boho with Terracotta Accents)"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-[#1E2922] text-sm focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all"
              />
            </div>

            {/* Venue Type */}
            <div>
              <label className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-2">
                Venue Environment *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'indoor', label: 'Indoor Hall', desc: 'Banquet, ballroom, or gallery' },
                  { id: 'outdoor', label: 'Outdoor Lawn', desc: 'Garden, beach, or rooftop' },
                  { id: 'mixed', label: 'Mixed / Hybrid', desc: 'Indoor banquet + outdoor terrace' },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, venueType: v.id as VenueType })}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      formData.venueType === v.id
                        ? 'border-[#1C3F30] bg-[#E8F0EB]/60 ring-1 ring-[#1C3F30]'
                        : 'border-[#E5DFD5] bg-[#FFFFFF] hover:border-[#CDC5B7]'
                    }`}
                  >
                    <div className="font-semibold text-xs text-[#1E2922] flex items-center justify-between">
                      <span>{v.label}</span>
                      {formData.venueType === v.id && (
                        <Check className="w-3.5 h-3.5 text-[#1C3F30]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#64746D] mt-0.5">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Atmosphere / Mood */}
            <div>
              <label htmlFor="atmosphere" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-1.5">
                Desired Atmosphere & Mood
              </label>
              <input
                id="atmosphere"
                type="text"
                value={formData.atmosphere}
                onChange={(e) => setFormData({ ...formData, atmosphere: e.target.value })}
                placeholder="e.g. Warm, intimate, joyful, candlelit, upbeat, elegant"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-[#1E2922] text-sm focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* STEP 3: PERSONALIZATION */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1E2922]">
                Personalization & Special Requirements
              </h2>
              <p className="text-xs sm:text-sm text-[#64746D] mt-1">
                Tell us what matters most so the AI allocates resources where they count.
              </p>
            </div>

            {/* Priorities */}
            <div>
              <label className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-2">
                Top Priorities (Pick 1 to 4) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRIORITY_OPTIONS.map((priority) => {
                  const selected = formData.priorities.includes(priority);
                  return (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => togglePriority(priority)}
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
              {errors.priorities && (
                <p className="text-xs text-[#C0392B] mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.priorities}</span>
                </p>
              )}
            </div>

            {/* Dietary & Accessibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dietary" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-1.5">
                  Dietary Preferences
                </label>
                <input
                  id="dietary"
                  type="text"
                  value={formData.dietaryRequirements}
                  onChange={(e) => setFormData({ ...formData, dietaryRequirements: e.target.value })}
                  placeholder="e.g. Vegetarian, Jain counters, Nut allergy caution"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-[#1E2922] text-sm focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="accessibility" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-1.5">
                  Accessibility Needs
                </label>
                <input
                  id="accessibility"
                  type="text"
                  value={formData.accessibilityRequirements}
                  onChange={(e) => setFormData({ ...formData, accessibilityRequirements: e.target.value })}
                  placeholder="e.g. Wheelchair ramp, elderly seating, quiet rest corner"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-[#1E2922] text-sm focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Cultural Preferences & Special Activities */}
            <div>
              <label htmlFor="activities" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-1.5">
                Special Traditions or Planned Activities
              </label>
              <input
                id="activities"
                type="text"
                value={formData.specialActivities}
                onChange={(e) => setFormData({ ...formData, specialActivities: e.target.value })}
                placeholder="e.g. Sunset exchange of vows, sangeet dancing, audio guestbook station"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-[#1E2922] text-sm focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label htmlFor="notes" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-1.5">
                Additional Notes or Specific Instructions
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.additionalNotes}
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                placeholder="Any special details, organizer contact requirements, or vendor constraints..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-[#1E2922] text-sm focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Wizard Controls */}
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
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#1C3F30] hover:bg-[#153226] text-white text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1C3F30] focus:ring-offset-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 text-[#FDF1EB]" />
            </button>
          ) : (
            <button
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
