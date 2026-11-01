import type { EventType, VenueType } from '@/types/event';

export const EVENT_TYPES: { type: EventType; label: string; description: string }[] = [
  { type: 'wedding', label: 'Wedding / Engagement', description: 'Ceremonies, banquets, and matrimonial receptions' },
  { type: 'birthday', label: 'Milestone Birthday', description: 'Joyful celebrations, themed parties, family milestones' },
  { type: 'anniversary', label: 'Anniversary', description: 'Milestone years, vow renewals, family reunions' },
  { type: 'community', label: 'Community Gathering', description: 'Neighborhood socials, cultural festivals, block parties' },
  { type: 'fundraiser', label: 'Charity Fundraiser', description: 'Galas, auctions, and community benefit drives' },
  { type: 'other', label: 'Special Occasion', description: 'Retirements, graduations, and intimate celebrations' },
];

export const CURRENCIES = [
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'CAD', label: 'Canadian Dollar (CA$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
];

export const PRESET_STYLES = [
  'Elegant Traditional',
  'Modern Botanical',
  'Royal Heritage',
  'Rustic Chic',
  'Warm Minimalist',
  'Vibrant & Colorful',
  'Cozy Candlelit',
];

export const PRIORITY_OPTIONS = [
  'Exquisite Food & Hospitality',
  'Candid Photography & Film',
  'Atmospheric Decor & Lighting',
  'Music, DJ & Entertainment',
  'Guest Accessibility & Comfort',
  'Eco-Friendly & Zero-Waste',
  'Affordability & Cost Discipline',
  'Children & Family Activities',
];

export const VENUE_TYPES: { id: VenueType; label: string; description: string }[] = [
  { id: 'indoor', label: 'Indoor Hall', description: 'Banquet, ballroom, or gallery' },
  { id: 'outdoor', label: 'Outdoor Lawn', description: 'Garden, beach, or rooftop' },
  { id: 'mixed', label: 'Mixed / Hybrid', description: 'Indoor banquet + outdoor terrace' },
];

export const EVENT_DURATIONS = [
  'Evening (4 hours)',
  'Afternoon (3 hours)',
  'Full Day (8 hours)',
  'Late Night Celebration (6 hours)',
  'Multi-day (2 days)',
  'Weekend Celebration (3 days)',
];

export const FORM_FIELD_CLASS = 'w-full px-4 py-2.5 rounded-xl border bg-[#FAF8F5] text-[#1E2922] text-sm focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all';
export const FORM_SELECT_CLASS = 'w-full px-4 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-[#1E2922] text-sm focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none transition-all';
export const FIELD_LABEL_CLASS = 'block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-1.5';
