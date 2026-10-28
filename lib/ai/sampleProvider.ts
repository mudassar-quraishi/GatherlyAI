import { EventDetails, EventPlan, BudgetCategory, TimelineTask, VendorItem, ScheduleItem, PersonalizedIdea, ContingencyPlan } from '@/types/event';
import { addDaysSafe, formatDateSafe } from '@/lib/timeline/calculator';
import { normalizeBudgetBreakdown } from '@/lib/budget/calculator';

/**
 * Generates a realistic, deterministic sample event plan tailored to the event basics and style.
 * This runs locally with zero external network or API key dependencies.
 */
export function generateSamplePlan(event: Partial<EventDetails>): EventPlan {
  const eventDate = event.date || formatDateSafe(new Date(Date.now() + 45 * 24 * 60 * 60 * 1000));
  const totalBudget = event.totalBudget || 450000;
  const eventType = event.eventType || 'wedding';
  const location = event.location || 'Mumbai';
  const guestCount = event.guestCount || 150;
  const theme = event.styleTheme || 'Elegant Traditional';
  const currency = event.currency || 'INR';

  // Budget category allocation weights tailored by event type
  let budgetTemplates: { name: string; pct: number; essential: boolean; notes: string }[] = [];

  if (eventType === 'wedding') {
    budgetTemplates = [
      { name: 'Venue & Banquet Hall', pct: 0.32, essential: true, notes: 'Main celebration hall, bridal suite, lighting setup' },
      { name: 'Catering & Beverages', pct: 0.28, essential: true, notes: `${guestCount} guests, welcome drinks, 3-course buffet, dessert counters` },
      { name: 'Decorations, Stage & Florals', pct: 0.12, essential: true, notes: 'Floral mandap/stage, table centerpieces, ambient lighting' },
      { name: 'Photography & Videography', pct: 0.10, essential: true, notes: 'Full event coverage, drone shots, cinematic teaser & album' },
      { name: 'Clothing & Bridal Styling', pct: 0.06, essential: false, notes: 'Ceremonial outfits, hair, makeup, and draping' },
      { name: 'Music, Sound & DJ', pct: 0.04, essential: false, notes: 'Live acoustic accompaniment, DJ setup, evening sound system' },
      { name: 'Invitations & Stationery', pct: 0.02, essential: false, notes: 'Digital video invites, printed luxury cards, place cards' },
      { name: 'Contingency & Incidentals', pct: 0.06, essential: true, notes: 'Reserved safety buffer for overtime, guest count changes' },
    ];
  } else if (eventType === 'birthday' || eventType === 'anniversary') {
    budgetTemplates = [
      { name: 'Venue Rental / Private Room', pct: 0.25, essential: true, notes: 'Private dining space or garden lounge rental' },
      { name: 'Food, Specialty Cake & Drinks', pct: 0.40, essential: true, notes: 'Custom themed cake, cocktail appetizers, dinner spread' },
      { name: 'Theme Decor & Photo Backdrop', pct: 0.15, essential: true, notes: 'Balloon garland, custom neon signage, floral accent wall' },
      { name: 'Photography & Video Memories', pct: 0.08, essential: false, notes: 'Candid event photographer for 4 hours' },
      { name: 'Live Entertainment / Games', pct: 0.05, essential: false, notes: 'Party host/MC, interactive games, playlist curation' },
      { name: 'Party Favors & Keepsakes', pct: 0.03, essential: false, notes: 'Personalized gift hampers for guests' },
      { name: 'Contingency Fund', pct: 0.04, essential: true, notes: 'Extra food portions and last-minute setup supplies' },
    ];
  } else {
    // Community event or Fundraiser
    budgetTemplates = [
      { name: 'Community Venue / Ground Booking', pct: 0.22, essential: true, notes: 'Permits, venue hire, park reservation' },
      { name: 'Community Refreshments & Water', pct: 0.30, essential: true, notes: 'Food stalls, water stations, volunteer meals' },
      { name: 'Sound, Stage & AV Setup', pct: 0.18, essential: true, notes: 'Microphones, PA speakers, projector screen, generator backup' },
      { name: 'Branding, Banners & Signage', pct: 0.10, essential: false, notes: 'Wayfinding signs, entry banners, volunteer badges' },
      { name: 'First Aid, Safety & Waste Management', pct: 0.08, essential: true, notes: 'Sanitation stations, recycling bins, security coordinator' },
      { name: 'Activities & Volunteer Logistics', pct: 0.06, essential: false, notes: 'Workshops, raffle prizes, certificates' },
      { name: 'Contingency Reserve', pct: 0.06, essential: true, notes: 'Weather protection covers and unexpected supply runs' },
    ];
  }

  const rawCategories: BudgetCategory[] = budgetTemplates.map((t, idx) => ({
    id: `cat-sample-${idx}`,
    name: t.name,
    allocatedAmount: Math.round(totalBudget * t.pct),
    actualSpent: 0,
    isEssential: t.essential,
    notes: t.notes,
  }));

  const budgetBreakdown = normalizeBudgetBreakdown(totalBudget, rawCategories);

  // Timeline tasks anchored to actual event date
  const timelineTasks: TimelineTask[] = [
    {
      id: 'task-s-1',
      title: 'Finalize Guest List & Target Headcount',
      description: `Confirm primary guest list of ~${guestCount} attendees and establish communication channel.`,
      stage: 'initial-planning',
      dueDate: addDaysSafe(eventDate, -35),
      priority: 'high',
      status: 'done',
      category: 'Coordination',
      owner: 'Lead Host',
    },
    {
      id: 'task-s-2',
      title: 'Sign Venue Contract & Deposit',
      description: `Secure venue booking in ${location} with indoor/outdoor contingency clauses.`,
      stage: 'initial-planning',
      dueDate: addDaysSafe(eventDate, -28),
      priority: 'high',
      status: 'in-progress',
      category: 'Venue',
      owner: 'Lead Host',
    },
    {
      id: 'task-s-3',
      title: 'Approve Catering Menu & Tasting Session',
      description: 'Schedule tasting, finalize dietary accommodations (vegetarian, gluten-free, allergy-safe).',
      stage: 'early-preparations',
      dueDate: addDaysSafe(eventDate, -21),
      priority: 'high',
      status: 'todo',
      category: 'Catering',
      owner: 'Food Coordinator',
    },
    {
      id: 'task-s-4',
      title: 'Finalize Decor Moodboard & Floral Palette',
      description: `Align decorator on ${theme} theme, stage backdrops, and table settings.`,
      stage: 'early-preparations',
      dueDate: addDaysSafe(eventDate, -18),
      priority: 'medium',
      status: 'todo',
      category: 'Decor',
    },
    {
      id: 'task-s-5',
      title: 'Send Official Invitations & RSVP Deadline',
      description: 'Dispatch invitations with dress code, venue location pin, and schedule overview.',
      stage: 'month-before',
      dueDate: addDaysSafe(eventDate, -14),
      priority: 'high',
      status: 'todo',
      category: 'Invitations',
    },
    {
      id: 'task-s-6',
      title: 'Compile Playlist & AV Equipment Checklist',
      description: 'Coordinate entrance song, speeches mic checks, and background music list.',
      stage: 'final-week',
      dueDate: addDaysSafe(eventDate, -5),
      priority: 'medium',
      status: 'todo',
      category: 'Entertainment',
    },
    {
      id: 'task-s-7',
      title: 'Lock Final Headcount with Caterer & Venue',
      description: 'Provide firm guest count and place card seating arrangements to the catering manager.',
      stage: 'final-week',
      dueDate: addDaysSafe(eventDate, -3),
      priority: 'high',
      status: 'todo',
      category: 'Catering',
    },
    {
      id: 'task-s-8',
      title: 'Pack Emergency Kit & Print Day Schedule Run Sheets',
      description: 'Include pins, stain remover, chargers, vendor contact sheets, printed timeline copies.',
      stage: 'day-before',
      dueDate: addDaysSafe(eventDate, -1),
      priority: 'high',
      status: 'todo',
      category: 'Logistics',
    },
    {
      id: 'task-s-9',
      title: 'Coordinate Vendor Load-In & Morning Walkthrough',
      description: 'Meet decorator and audio team on-site for staging inspection.',
      stage: 'event-day',
      dueDate: eventDate,
      priority: 'high',
      status: 'todo',
      category: 'Execution',
    },
    {
      id: 'task-s-10',
      title: 'Vendor Balance Settlement & Photo Gallery Archive',
      description: 'Clear remaining payments and send thank you notes with digital gallery link.',
      stage: 'post-event',
      dueDate: addDaysSafe(eventDate, 2),
      priority: 'low',
      status: 'todo',
      category: 'Wrap-Up',
    },
  ];

  // Vendor checklist items
  const vendorChecklist: VendorItem[] = [
    {
      id: 'vendor-s-1',
      category: 'Venue',
      title: 'Celebration Space / Banquet Hall',
      needDescription: `Spacious venue accommodating ${guestCount} guests with parking and prep rooms.`,
      whyItMatters: 'Anchors the entire event date, aesthetic, and weather security.',
      bookingDeadline: addDaysSafe(eventDate, -30),
      priority: 'high',
      status: 'confirmed',
      estimatedCost: Math.round(totalBudget * 0.32),
      notes: 'Initial deposit paid, sound curfew at 10:30 PM.',
    },
    {
      id: 'vendor-s-2',
      category: 'Catering',
      title: 'Food & Beverage Service Partner',
      needDescription: 'Full-course hospitality team with buffet stations and dietary management.',
      whyItMatters: 'Guest satisfaction is overwhelmingly driven by delicious, timely meal service.',
      bookingDeadline: addDaysSafe(eventDate, -25),
      priority: 'high',
      status: 'contacted',
      estimatedCost: Math.round(totalBudget * 0.28),
      notes: 'Tasting scheduled for next weekend.',
    },
    {
      id: 'vendor-s-3',
      category: 'Decor & Florals',
      title: 'Stage & Ambient Designer',
      needDescription: `Execution of ${theme} themed backdrop, centerpieces, and warm spotlighting.`,
      whyItMatters: 'Transforms venue atmosphere and defines the photography backdrop.',
      bookingDeadline: addDaysSafe(eventDate, -20),
      priority: 'high',
      status: 'needed',
      estimatedCost: Math.round(totalBudget * 0.12),
      notes: 'Requested quotes from two top-rated local florists.',
    },
    {
      id: 'vendor-s-4',
      category: 'Photography',
      title: 'Lead Photographer & Filmmaker',
      needDescription: '6-8 hours of coverage capturing candid moments, portraits, and key highlights.',
      whyItMatters: 'Permanent visual legacy of the milestone celebration.',
      bookingDeadline: addDaysSafe(eventDate, -22),
      priority: 'medium',
      status: 'contacted',
      estimatedCost: Math.round(totalBudget * 0.10),
      notes: 'Reviewing portfolio sample albums.',
    },
    {
      id: 'vendor-s-5',
      category: 'Music & Audio',
      title: 'Sound Engineer & DJ / Live Act',
      needDescription: 'PA system, wireless microphones for toasts, curated dinner and dancing tracks.',
      whyItMatters: 'Maintains celebration energy and ensures announcements are crystal clear.',
      bookingDeadline: addDaysSafe(eventDate, -15),
      priority: 'medium',
      status: 'needed',
      estimatedCost: Math.round(totalBudget * 0.04),
    },
  ];

  // Event-day run sheet
  const eventDaySchedule: ScheduleItem[] = [
    {
      id: 'sched-s-1',
      startTime: '01:00 PM',
      endTime: '03:30 PM',
      activity: 'Venue Access & Decorator Load-in',
      description: 'Decor team sets up stage backdrop, table linens, floral arrangements, and lighting test.',
      responsiblePerson: 'Lead Coordinator & Florist',
      notes: 'Ensure service elevator is unlocked.',
    },
    {
      id: 'sched-s-2',
      startTime: '03:30 PM',
      endTime: '04:30 PM',
      activity: 'Sound Check & Host Walkthrough',
      description: 'Audio engineer tests wireless microphones, entrance audio cues, and ambient playlist.',
      responsiblePerson: 'Sound Engineer & Emcee',
    },
    {
      id: 'sched-s-3',
      startTime: '04:30 PM',
      endTime: '05:30 PM',
      activity: 'Pre-Event Family Portraits & Prep',
      description: 'Photographer captures candid portraits while outfits and styling are fresh.',
      responsiblePerson: 'Photographer & Hosts',
      notes: 'Bridal/VIP suite ready with refreshments.',
    },
    {
      id: 'sched-s-4',
      startTime: '05:30 PM',
      endTime: '06:30 PM',
      activity: 'Guest Arrival & Welcome Mocktails',
      description: 'Guests arrive, check in at welcome table, sign guestbook, and enjoy appetizers.',
      responsiblePerson: 'Welcome Greeters',
      notes: 'Background acoustic music playing.',
    },
    {
      id: 'sched-s-5',
      startTime: '06:30 PM',
      endTime: '07:30 PM',
      activity: 'Main Ceremony / Formal Celebration',
      description: 'Grand entrance, ceremonial rituals, key toasts, and milestone presentations.',
      responsiblePerson: 'Emcee & Key Family Members',
      notes: 'Photographer positioned for stage moments.',
    },
    {
      id: 'sched-s-6',
      startTime: '07:30 PM',
      endTime: '08:30 PM',
      activity: 'Dinner Buffet Opens & Open Socializing',
      description: 'Catering staff serves dinner stations. Hosts circulate and greet seated tables.',
      responsiblePerson: 'Catering Captain',
      notes: 'Dietary-labeled options highlighted.',
    },
    {
      id: 'sched-s-7',
      startTime: '08:30 PM',
      endTime: '10:00 PM',
      activity: 'Cake Cutting, Dancing & Celebration',
      description: 'Sweet celebration moment followed by high-energy dance floor and music.',
      responsiblePerson: 'DJ & Lead Host',
    },
    {
      id: 'sched-s-8',
      startTime: '10:00 PM',
      endTime: '10:30 PM',
      activity: 'Farewells, Keepsake Favors & Wrap-up',
      description: 'Guests depart with personalized favors. Final vendor load-out begins.',
      responsiblePerson: 'Logistics Lead',
    },
  ];

  // Personalized ideas
  const personalizedIdeas: PersonalizedIdea[] = [
    {
      id: 'idea-s-1',
      category: 'Guest Engagement',
      title: 'Interactive Memory Audio Guestbook',
      description: 'Set up a vintage rotary phone where guests pick up the receiver to record heartfelt audio voice notes.',
      whyItFits: `Adds a nostalgic, personal touch for ${guestCount} guests without requiring queue bottlenecks.`,
      tags: ['Interactive', 'Memories', 'Low-Stress'],
    },
    {
      id: 'idea-s-2',
      category: 'Decor & Ambience',
      title: 'Warm Micro-Fairy Light Canopy & Terracotta Accents',
      description: 'String warm LED fairy lights overhead paired with rustic terracotta planters and olive branch runners.',
      whyItFits: `Complements the ${theme} style while keeping floral costs optimized within budget.`,
      tags: ['Atmosphere', 'Cost-Effective', 'Design'],
    },
    {
      id: 'idea-s-3',
      category: 'Hospitality',
      title: 'Personalized "Taste of Our Story" Signature Drinks',
      description: 'Offer two signature mocktails/cocktails named after meaningful milestones or favorite travel spots.',
      whyItFits: 'Memorable conversation starter that simplifies bar service speed.',
      tags: ['Beverages', 'Storytelling'],
    },
    {
      id: 'idea-s-4',
      category: 'Sustainability',
      title: 'Zero Single-Use Plastic & Seed Paper Favors',
      description: 'Use compostable tableware and provide plantable wildflower seed paper cards as thank-you favors.',
      whyItFits: 'Demonstrates environmental consciousness and leaves guests with a blooming reminder.',
      tags: ['Eco-Friendly', 'Green'],
    },
  ];

  // Contingencies
  const risksAndContingencies: ContingencyPlan[] = [
    {
      risk: 'Inclement Weather / Sudden Rain or Heat',
      plan: 'Pre-book venue terrace with retractable waterproof awning and reserve portable high-velocity misting fans.',
      severity: 'medium',
    },
    {
      risk: 'Catering Headcount Surge (+10–15% unplanned attendees)',
      plan: 'Contract 10% buffer portions with caterer and prepare pre-plated appetizers for immediate service.',
      severity: 'high',
    },
    {
      risk: 'Audio / Power Generator Failure during ceremony',
      plan: 'Dual-battery wireless backup amp on standby with pre-downloaded offline playlist on phone.',
      severity: 'medium',
    },
  ];

  return {
    eventSummary: `A thoughtfully orchestrated ${theme.toLowerCase()} ${eventType} in ${location} for ${guestCount} guests, planned around a ${currency} ${totalBudget.toLocaleString()} budget with prioritized focus on hospitality, candid photography, and seamless coordination.`,
    themeIdeas: {
      name: theme,
      description: `A harmonious blend of warm earth tones, soft ambient lighting, and natural textures designed to foster warmth and celebration.`,
      colorPalette: ['#1C3F30', '#C85A32', '#FAF8F5', '#E5DFD5', '#B46B08'],
      vibeKeywords: ['Warm', 'Intimate', 'Joyful', 'Organized', 'Memorable'],
    },
    budgetBreakdown,
    timelineTasks,
    vendorChecklist,
    eventDaySchedule,
    personalizedIdeas,
    risksAndContingencies,
    generatedAt: new Date().toISOString(),
    generationSource: 'demo',
    modelUsed: 'Deterministic Demo Engine (Gatherly Curated)',
  };
}

/**
 * Creates a pre-populated sample event for one-click demo exploration.
 */
export function createDefaultDemoEvent(): EventDetails {
  const futureDate = formatDateSafe(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
  
  const baseEvent: EventDetails = {
    id: 'demo-event-wedding-2026',
    name: 'Aarav & Meera’s Lakeside Wedding',
    eventType: 'wedding',
    date: futureDate,
    duration: 'Full Day (8 hours)',
    location: 'Udaipur / Lakeside Pavilion',
    guestCount: 180,
    totalBudget: 850000,
    currency: 'INR',
    styleTheme: 'Royal Heritage with Contemporary Botanical Accents',
    venueType: 'mixed',
    atmosphere: 'Regal yet intimate, filled with soft candlelight and soulful acoustic music',
    priorities: ['Catering & Food Quality', 'Candid Photography', 'Warm Guest Hospitality', 'Stage Decor'],
    dietaryRequirements: '60% Vegetarian, Jain options required, dedicated Nut-free dessert station',
    accessibilityRequirements: 'Wheelchair ramp access for senior family members to main pavilion',
    specialActivities: 'Sunset vows by the water, evening acoustic folk performance, audio guestbook station',
    additionalNotes: 'Need a seamless transition from day ceremony to evening dinner under the stars.',
    isSample: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  baseEvent.plan = generateSamplePlan(baseEvent);
  return baseEvent;
}
