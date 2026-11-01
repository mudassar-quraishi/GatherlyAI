import type { EventType, TaskPriority, TaskStage } from '@/types/event';

export interface DemoBudgetTemplate {
  name: string;
  percentage: number;
  essential: boolean;
  notes: string;
}

export interface DemoTaskTemplate {
  title: string;
  description: string;
  offsetDays: number;
  stage: TaskStage;
  priority: TaskPriority;
  category: string;
  owner?: string;
}

export interface DemoVendorTemplate {
  category: string;
  title: string;
  needDescription: string;
  whyItMatters: string;
  daysBeforeEvent: number;
  priority: TaskPriority;
}

export interface DemoScheduleTemplate {
  startTime: string;
  endTime: string;
  activity: string;
  description: string;
  responsiblePerson: string;
}

export interface DemoIdeaTemplate {
  category: string;
  title: string;
  description: string;
  whyItFits: string;
  tags: string[];
}

export interface DemoRiskTemplate {
  risk: string;
  plan: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DemoPlanProfile {
  summaryFocus: string;
  budget: DemoBudgetTemplate[];
  tasks: DemoTaskTemplate[];
  vendors: DemoVendorTemplate[];
  schedule: DemoScheduleTemplate[];
  ideas: DemoIdeaTemplate[];
  risks: DemoRiskTemplate[];
  themeDescription: string;
  colorPalette: string[];
  vibeKeywords: string[];
}

const profiles: Record<EventType, DemoPlanProfile> = {
  wedding: {
    summaryFocus: 'ceremony coordination, guest hospitality, and a clear reception run of show',
    budget: [
      { name: 'Venue & Ceremony Space', percentage: 0.30, essential: true, notes: 'Compare venue inclusions, access, curfew, and weather terms.' },
      { name: 'Catering & Beverages', percentage: 0.28, essential: true, notes: 'Plan portions and clearly labeled dietary options for the guest count.' },
      { name: 'Decor, Florals & Lighting', percentage: 0.12, essential: true, notes: 'Prioritize ceremony focal points and reusable decor.' },
      { name: 'Photography & Videography', percentage: 0.10, essential: true, notes: 'Agree on coverage hours and a written shot list.' },
      { name: 'Attire & Personal Styling', percentage: 0.06, essential: false, notes: 'Plan fittings and getting-ready time.' },
      { name: 'Music & Sound', percentage: 0.05, essential: false, notes: 'Allow for ceremony audio, speeches, and reception sound checks.' },
      { name: 'Invitations & Guest Materials', percentage: 0.03, essential: false, notes: 'Use digital or printed materials to match the event plan.' },
      { name: 'Contingency Reserve', percentage: 0.06, essential: true, notes: 'Keep a reserve for timing, weather, or supplier changes.' },
    ],
    tasks: [
      { title: 'Confirm ceremony format and venue requirements', description: 'Confirm the ceremony lead, venue rules, access times, and any required documents for {{location}}.', offsetDays: -42, stage: 'initial-planning', priority: 'high', category: 'Ceremony', owner: 'Lead host' },
      { title: 'Finalize guest list and RSVP plan', description: 'Set a target for {{guestCount}} guests and identify who will track responses and access needs.', offsetDays: -35, stage: 'initial-planning', priority: 'high', category: 'Guests', owner: 'Guest coordinator' },
      { title: 'Approve menu and dietary service plan', description: 'Review menu, allergen controls, serving flow, and requested dietary accommodations with the caterer.', offsetDays: -21, stage: 'early-preparations', priority: 'high', category: 'Catering', owner: 'Food coordinator' },
      { title: 'Confirm ceremony rehearsal and key transitions', description: 'Rehearse arrival, ceremony cues, family seating, and the transition to the reception.', offsetDays: -7, stage: 'final-week', priority: 'high', category: 'Ceremony', owner: 'Lead coordinator' },
      { title: 'Prepare a family and wedding-party photo list', description: 'Agree on essential portraits and a realistic photography window with the people involved.', offsetDays: -5, stage: 'final-week', priority: 'medium', category: 'Photography', owner: 'Photo lead' },
      { title: 'Walk through vendor load-in and day-of roles', description: 'Confirm arrival windows, accessible routes, setup responsibilities, and the day-of contact list.', offsetDays: -1, stage: 'day-before', priority: 'high', category: 'Logistics', owner: 'Lead coordinator' },
      { title: 'Close out supplier balances and share the gallery plan', description: 'Review final invoices and agree on when the hosts will receive and share event photos.', offsetDays: 2, stage: 'post-event', priority: 'low', category: 'Wrap-up', owner: 'Lead host' },
    ],
    vendors: [
      { category: 'Venue', title: 'Ceremony and reception venue', needDescription: 'Confirm capacity for {{guestCount}}, setup access, restrooms, transport, and weather arrangements.', whyItMatters: 'The venue determines guest flow, setup time, and the workable run of show.', daysBeforeEvent: 35, priority: 'high' },
      { category: 'Catering', title: 'Catering and beverage service', needDescription: 'Request a menu, portion plan, allergen process, and written service timeline.', whyItMatters: 'A clear service plan supports guest comfort and keeps transitions on time.', daysBeforeEvent: 28, priority: 'high' },
      { category: 'Ceremony', title: 'Ceremony lead or coordinator', needDescription: 'Confirm the role, ceremony sequence, rehearsal availability, and required equipment.', whyItMatters: 'A named lead helps coordinate cues without relying on guests to manage logistics.', daysBeforeEvent: 28, priority: 'high' },
      { category: 'Photography', title: 'Photographer or filmmaker', needDescription: 'Compare coverage hours, deliverables, backup plans, and a written shot list.', whyItMatters: 'Clear scope helps hosts plan important moments and avoid schedule conflicts.', daysBeforeEvent: 24, priority: 'medium' },
      { category: 'Sound and music', title: 'Sound operator or music provider', needDescription: 'Check ceremony microphones, speech audio, sound limits, and setup access.', whyItMatters: 'Audio checks reduce disruption during the ceremony and toasts.', daysBeforeEvent: 18, priority: 'medium' },
    ],
    schedule: [
      { startTime: '01:00 PM', endTime: '03:00 PM', activity: 'Venue access and setup', description: 'Confirm room layout, ceremony seating, signage, and sound checks.', responsiblePerson: 'Lead coordinator' },
      { startTime: '03:00 PM', endTime: '04:00 PM', activity: 'Host and wedding-party preparation', description: 'Allow time for arrival, final checks, and the agreed photo list.', responsiblePerson: 'Host representative' },
      { startTime: '04:00 PM', endTime: '05:00 PM', activity: 'Guest arrival and seating', description: 'Welcome guests, provide wayfinding, and support anyone who requested assistance.', responsiblePerson: 'Guest coordinator' },
      { startTime: '05:00 PM', endTime: '06:00 PM', activity: 'Ceremony', description: 'Follow the agreed ceremony order and cue plan.', responsiblePerson: 'Ceremony lead' },
      { startTime: '06:00 PM', endTime: '07:00 PM', activity: 'Reception transition and refreshments', description: 'Move guests to the reception space and open refreshments.', responsiblePerson: 'Venue coordinator' },
      { startTime: '07:00 PM', endTime: '10:00 PM', activity: 'Meal, toasts, and celebration', description: 'Coordinate meal service, planned speeches, music, and the closing time.', responsiblePerson: 'Emcee and catering lead' },
    ],
    ideas: [
      { category: 'Guest participation', title: 'Shared wishes card table', description: 'Invite guests to leave brief wishes or advice in a keepsake book.', whyItFits: 'Creates a low-pressure shared memory without requiring a long queue.', tags: ['Guest-led', 'Keepsake'] },
      { category: 'Ceremony flow', title: 'Clear transition cue', description: 'Use one agreed announcement and a simple sign to guide guests from ceremony to reception.', whyItFits: 'Keeps guests oriented while the event changes spaces.', tags: ['Wayfinding', 'Low-stress'] },
    ],
    risks: [
      { risk: 'Weather disrupts an outdoor ceremony or reception', plan: 'Confirm an indoor alternative, decision deadline, and who will communicate any change.', severity: 'high' },
      { risk: 'Ceremony or meal transitions run late', plan: 'Assign one coordinator to monitor the run sheet and agree on which optional moments can be shortened.', severity: 'medium' },
    ],
    themeDescription: 'A ceremony and reception plan shaped around the hosts’ chosen style, guest needs, and venue conditions.',
    colorPalette: ['#1C3F30', '#C85A32', '#FAF8F5', '#E5DFD5', '#B46B08'],
    vibeKeywords: ['Personal', 'Welcoming', 'Coordinated', 'Memorable'],
  },
  birthday: {
    summaryFocus: 'the guest of honor, age-appropriate activities, food, and a smooth celebration timeline',
    budget: [
      { name: 'Venue & Setup', percentage: 0.24, essential: true, notes: 'Compare capacity, setup hours, cleanup, and accessibility.' },
      { name: 'Food, Cake & Beverages', percentage: 0.39, essential: true, notes: 'Plan portions, cake timing, and allergy-safe options.' },
      { name: 'Decor & Activity Space', percentage: 0.14, essential: true, notes: 'Focus on a few reusable decorations and a practical activity area.' },
      { name: 'Photography & Memories', percentage: 0.08, essential: false, notes: 'Set a short coverage window or assign a host photo coordinator.' },
      { name: 'Entertainment & Games', percentage: 0.06, essential: false, notes: 'Match activities to the guest of honor and attendee ages.' },
      { name: 'Favors & Keepsakes', percentage: 0.04, essential: false, notes: 'Keep favors optional and simple to distribute.' },
      { name: 'Contingency Reserve', percentage: 0.05, essential: true, notes: 'Reserve for guest-count changes and last-minute supplies.' },
    ],
    tasks: [
      { title: 'Confirm the guest of honor’s preferences', description: 'Agree on the tone, activity level, and any moments the guest of honor wants to include.', offsetDays: -30, stage: 'initial-planning', priority: 'high', category: 'Host preferences', owner: 'Lead host' },
      { title: 'Send invitations and track RSVPs', description: 'Share the location in {{location}}, start time, RSVP date, and any useful arrival details.', offsetDays: -21, stage: 'month-before', priority: 'high', category: 'Guests', owner: 'Guest coordinator' },
      { title: 'Confirm cake, servings, and allergen handling', description: 'Check the cake design, serving count, candles, storage, and allergen information.', offsetDays: -14, stage: 'early-preparations', priority: 'high', category: 'Food', owner: 'Food coordinator' },
      { title: 'Plan activities and age-appropriate transitions', description: 'Set activity timing, supervision responsibilities, and a quieter option if needed.', offsetDays: -10, stage: 'early-preparations', priority: 'medium', category: 'Activities', owner: 'Activity lead' },
      { title: 'Confirm setup, seating, and guest access', description: 'Walk through arrival, seating, restroom access, and the plan for gifts or personal items.', offsetDays: -3, stage: 'final-week', priority: 'high', category: 'Venue', owner: 'Venue contact' },
      { title: 'Coordinate cake and activity cues', description: 'Tell the emcee or host when to gather guests and who will support the guest of honor.', offsetDays: -1, stage: 'day-before', priority: 'medium', category: 'Run of show', owner: 'Lead host' },
      { title: 'Return hired items and share photos', description: 'Check the venue handoff and agree on how photos will be shared with guests.', offsetDays: 1, stage: 'post-event', priority: 'low', category: 'Wrap-up', owner: 'Lead host' },
    ],
    vendors: [
      { category: 'Venue', title: 'Party venue or private room', needDescription: 'Confirm capacity for {{guestCount}}, setup access, cleanup, and activity space.', whyItMatters: 'A practical layout supports guest comfort and makes activities easier to run.', daysBeforeEvent: 21, priority: 'high' },
      { category: 'Food', title: 'Caterer or food provider', needDescription: 'Request menu, serving times, portion guidance, and allergen handling details.', whyItMatters: 'Clear food planning helps the host accommodate guests and schedule the cake.', daysBeforeEvent: 18, priority: 'high' },
      { category: 'Cake', title: 'Cake or dessert provider', needDescription: 'Confirm size, delivery, storage, serving tools, and ingredient information.', whyItMatters: 'The cake moment depends on safe storage and a realistic serving plan.', daysBeforeEvent: 14, priority: 'medium' },
      { category: 'Activities', title: 'Activity host or entertainment provider', needDescription: 'Agree on activity length, audience fit, equipment, and a weather alternative if outdoors.', whyItMatters: 'A clear activity plan helps keep guests engaged without crowding the schedule.', daysBeforeEvent: 14, priority: 'medium' },
      { category: 'Photography', title: 'Photographer or host photo lead', needDescription: 'Choose a short list of key moments and confirm consent for any shared photos.', whyItMatters: 'A small photo plan captures memories without interrupting the celebration.', daysBeforeEvent: 10, priority: 'low' },
    ],
    schedule: [
      { startTime: '03:00 PM', endTime: '04:00 PM', activity: 'Setup and supplier handoff', description: 'Check seating, activity areas, food storage, and the cake location.', responsiblePerson: 'Setup lead' },
      { startTime: '04:00 PM', endTime: '04:45 PM', activity: 'Guest arrival and welcome', description: 'Welcome guests and share the activity or seating plan.', responsiblePerson: 'Guest coordinator' },
      { startTime: '04:45 PM', endTime: '05:45 PM', activity: 'Games or shared activities', description: 'Run the chosen activities and allow guests to opt in or take a break.', responsiblePerson: 'Activity lead' },
      { startTime: '05:45 PM', endTime: '06:30 PM', activity: 'Meal or refreshments', description: 'Serve food and identify any special dietary options.', responsiblePerson: 'Food coordinator' },
      { startTime: '06:30 PM', endTime: '07:00 PM', activity: 'Cake and birthday wishes', description: 'Gather guests, cue the cake, and allow time for photos.', responsiblePerson: 'Emcee or host' },
      { startTime: '07:00 PM', endTime: '07:30 PM', activity: 'Goodbyes and cleanup check', description: 'Thank guests and confirm hired items and personal belongings are collected.', responsiblePerson: 'Lead host' },
    ],
    ideas: [
      { category: 'Guest memories', title: 'Milestone message cards', description: 'Invite guests to write a short memory or wish for the guest of honor.', whyItFits: 'Works for different ages and leaves the guest of honor with a personal keepsake.', tags: ['Keepsake', 'Inclusive'] },
      { category: 'Activities', title: 'Choose-your-own activity corner', description: 'Offer one active game and one calm table activity so guests can participate at their own pace.', whyItFits: 'Gives mixed-age groups options without forcing everyone into one activity.', tags: ['Flexible', 'Family-friendly'] },
    ],
    risks: [
      { risk: 'Cake or food arrives late or has an allergen issue', plan: 'Confirm delivery time, ingredient information, and a backup dessert option.', severity: 'high' },
      { risk: 'Activities do not suit the full age range', plan: 'Offer an optional quiet activity and name an adult activity lead.', severity: 'medium' },
    ],
    themeDescription: 'A birthday plan centered on the guest of honor and activities suited to the invited group.',
    colorPalette: ['#C85A32', '#F3B562', '#FAF8F5', '#8AAE92', '#E5DFD5'],
    vibeKeywords: ['Joyful', 'Personal', 'Flexible', 'Welcoming'],
  },
  anniversary: {
    summaryFocus: 'the milestone, shared memories, guest comfort, and a considered tribute or toast',
    budget: [
      { name: 'Venue & Guest Setup', percentage: 0.22, essential: true, notes: 'Confirm seating, setup windows, transport, and accessibility.' },
      { name: 'Meal & Beverages', percentage: 0.32, essential: true, notes: 'Coordinate menu, service pace, and dietary requirements.' },
      { name: 'Photography & Memory Archive', percentage: 0.12, essential: false, notes: 'Plan a short photo list or a way to preserve shared memories.' },
      { name: 'Tribute & AV', percentage: 0.10, essential: false, notes: 'Check microphone, display, and backup for any tribute or slideshow.' },
      { name: 'Decor & Florals', percentage: 0.10, essential: false, notes: 'Use personal details and reusable pieces where practical.' },
      { name: 'Music & Entertainment', percentage: 0.05, essential: false, notes: 'Choose music and volume that suit the guests and venue.' },
      { name: 'Invitations & Keepsakes', percentage: 0.04, essential: false, notes: 'Keep printed materials and favors optional.' },
      { name: 'Contingency Reserve', percentage: 0.05, essential: true, notes: 'Reserve for timing changes and supplier adjustments.' },
    ],
    tasks: [
      { title: 'Confirm the milestone and honorees’ preferences', description: 'Agree on the tone, guest list, and any moments the honorees do or do not want.', offsetDays: -35, stage: 'initial-planning', priority: 'high', category: 'Host preferences', owner: 'Lead host' },
      { title: 'Collect photos and stories with permission', description: 'Invite contributors to share a few memories and confirm which images may be shown publicly.', offsetDays: -28, stage: 'early-preparations', priority: 'medium', category: 'Tribute', owner: 'Memory coordinator' },
      { title: 'Confirm menu and dietary options', description: 'Review the menu, service timing, and requested dietary accommodations.', offsetDays: -21, stage: 'early-preparations', priority: 'high', category: 'Catering', owner: 'Food coordinator' },
      { title: 'Set the tribute and toast order', description: 'Limit speaking time, identify the emcee, and confirm microphone needs.', offsetDays: -14, stage: 'month-before', priority: 'medium', category: 'Program', owner: 'Emcee' },
      { title: 'Test any slideshow or audio in the venue', description: 'Check display visibility, volume, file format, and an offline backup.', offsetDays: -5, stage: 'final-week', priority: 'high', category: 'AV', owner: 'AV lead' },
      { title: 'Confirm seating, access, and meal transitions', description: 'Walk the guest route and check seating, restroom access, and a quieter place to rest.', offsetDays: -2, stage: 'final-week', priority: 'high', category: 'Guest comfort', owner: 'Venue contact' },
      { title: 'Share approved photos and thank contributors', description: 'Confirm what the honorees want shared and thank the people who contributed memories.', offsetDays: 2, stage: 'post-event', priority: 'low', category: 'Wrap-up', owner: 'Lead host' },
    ],
    vendors: [
      { category: 'Venue', title: 'Accessible celebration venue', needDescription: 'Confirm capacity, seating options, quiet space, restroom access, and setup time.', whyItMatters: 'Venue comfort supports guests across ages and mobility needs.', daysBeforeEvent: 28, priority: 'high' },
      { category: 'Catering', title: 'Meal and beverage provider', needDescription: 'Agree on menu, serving pace, portion plan, and dietary labeling.', whyItMatters: 'A calm service plan leaves space for tributes and conversation.', daysBeforeEvent: 21, priority: 'high' },
      { category: 'Photography', title: 'Photographer or memory archivist', needDescription: 'Set coverage expectations and obtain consent for any guest contributions.', whyItMatters: 'A clear scope preserves memories while respecting guests’ preferences.', daysBeforeEvent: 18, priority: 'medium' },
      { category: 'AV', title: 'Audio or display support', needDescription: 'Test microphones, display visibility, playback format, and a backup copy.', whyItMatters: 'Reliable AV makes tributes easier to hear and view.', daysBeforeEvent: 10, priority: 'medium' },
      { category: 'Music', title: 'Music provider or playlist lead', needDescription: 'Agree on the music style, volume, cues, and venue sound limits.', whyItMatters: 'Music can support the atmosphere without making conversation difficult.', daysBeforeEvent: 10, priority: 'low' },
    ],
    schedule: [
      { startTime: '04:00 PM', endTime: '05:00 PM', activity: 'Venue setup and AV check', description: 'Check tables, display visibility, microphones, and a quiet rest area.', responsiblePerson: 'Setup and AV leads' },
      { startTime: '05:00 PM', endTime: '05:45 PM', activity: 'Guest arrival and welcome', description: 'Welcome guests and provide seating or access assistance as requested.', responsiblePerson: 'Guest coordinator' },
      { startTime: '05:45 PM', endTime: '06:15 PM', activity: 'Memory or photo moment', description: 'Share the planned tribute or memory activity with the honorees’ approval.', responsiblePerson: 'Emcee' },
      { startTime: '06:15 PM', endTime: '07:30 PM', activity: 'Meal and conversation', description: 'Coordinate meal service and allow time for guests to connect.', responsiblePerson: 'Catering lead' },
      { startTime: '07:30 PM', endTime: '08:15 PM', activity: 'Toasts and celebration', description: 'Follow the agreed speaking order and keep the microphone available.', responsiblePerson: 'Emcee' },
      { startTime: '08:15 PM', endTime: '08:45 PM', activity: 'Closing and guest departures', description: 'Thank guests and check transport or departure assistance.', responsiblePerson: 'Lead host' },
    ],
    ideas: [
      { category: 'Shared history', title: 'A small memory gallery', description: 'Display a few approved photos with short captions supplied by family or friends.', whyItFits: 'Creates conversation without requiring a long formal presentation.', tags: ['Personal', 'Consent-aware'] },
      { category: 'Tribute', title: 'Recorded wishes station', description: 'Offer an optional way to leave a short message for the honorees.', whyItFits: 'Lets guests contribute at their own pace and creates a keepsake.', tags: ['Optional', 'Keepsake'] },
    ],
    risks: [
      { risk: 'Slideshow or microphone fails', plan: 'Test equipment in advance and keep a printed or spoken backup for key messages.', severity: 'medium' },
      { risk: 'The program feels too long or tiring for guests', plan: 'Keep tributes brief, provide seating breaks, and allow guests to leave comfortably.', severity: 'medium' },
    ],
    themeDescription: 'A milestone gathering shaped by the honorees’ preferences, shared stories, and comfortable pacing.',
    colorPalette: ['#8A6B52', '#C85A32', '#FAF8F5', '#B9A98A', '#1C3F30'],
    vibeKeywords: ['Warm', 'Reflective', 'Personal', 'Comfortable'],
  },
  community: {
    summaryFocus: 'permits, accessible public flow, volunteer roles, safety, and clear guest information',
    budget: [
      { name: 'Venue, Permits & Site Access', percentage: 0.22, essential: true, notes: 'Verify permitted use, capacity, load-in, and site rules.' },
      { name: 'Food, Water & Refreshments', percentage: 0.28, essential: true, notes: 'Plan water points, dietary labels, and volunteer meals.' },
      { name: 'Sound, Stage & AV', percentage: 0.16, essential: true, notes: 'Match sound coverage to the site and the program.' },
      { name: 'Accessibility, First Aid & Safety', percentage: 0.10, essential: true, notes: 'Provide accessible routes, first-aid coverage, and clear signage.' },
      { name: 'Wayfinding & Public Information', percentage: 0.08, essential: false, notes: 'Make arrival, schedule, and access information easy to find.' },
      { name: 'Activities & Volunteer Logistics', percentage: 0.06, essential: false, notes: 'Confirm lead volunteers and equipment for each activity.' },
      { name: 'Waste, Sanitation & Cleanup', percentage: 0.04, essential: true, notes: 'Plan bins, restrooms, cleanup roles, and waste pickup.' },
      { name: 'Contingency Reserve', percentage: 0.06, essential: true, notes: 'Reserve for weather cover, permits, or supply needs.' },
    ],
    tasks: [
      { title: 'Verify permits, capacity, and site rules', description: 'Confirm permissions, operating hours, emergency exits, and the approved capacity in {{location}}.', offsetDays: -45, stage: 'initial-planning', priority: 'high', category: 'Permits', owner: 'Event lead' },
      { title: 'Assign volunteer leads and shift coverage', description: 'Name a lead for welcome, activities, refreshments, first aid, and cleanup.', offsetDays: -30, stage: 'early-preparations', priority: 'high', category: 'Volunteers', owner: 'Volunteer coordinator' },
      { title: 'Plan accessible routes and public information', description: 'Publish arrival, restroom, schedule, and access information; walk the attendee route.', offsetDays: -21, stage: 'early-preparations', priority: 'high', category: 'Accessibility', owner: 'Access lead' },
      { title: 'Confirm water, food handling, and dietary labels', description: 'Coordinate serving locations, drinking water, allergy information, and volunteer meals.', offsetDays: -14, stage: 'month-before', priority: 'high', category: 'Refreshments', owner: 'Hospitality lead' },
      { title: 'Prepare weather and crowd-flow plan', description: 'Set a weather decision point, safe capacity, queue layout, and escalation contacts.', offsetDays: -7, stage: 'final-week', priority: 'high', category: 'Safety', owner: 'Site lead' },
      { title: 'Brief volunteers and test sound', description: 'Review shift assignments, emergency contacts, site boundaries, and microphone checks.', offsetDays: -1, stage: 'day-before', priority: 'high', category: 'Operations', owner: 'Event lead' },
      { title: 'Complete site handoff and volunteer follow-up', description: 'Check cleanup, return borrowed equipment, record issues, and thank volunteer leads.', offsetDays: 1, stage: 'post-event', priority: 'medium', category: 'Wrap-up', owner: 'Operations lead' },
    ],
    vendors: [
      { category: 'Site', title: 'Permitted community venue or ground', needDescription: 'Confirm permits, capacity, power, restrooms, accessible routes, and load-in rules.', whyItMatters: 'Site conditions determine safety, layout, and the event schedule.', daysBeforeEvent: 35, priority: 'high' },
      { category: 'Refreshments', title: 'Food, water, and serving support', needDescription: 'Plan water access, dietary labels, food handling, and high-volume service.', whyItMatters: 'Reliable hydration and clear food information support public events.', daysBeforeEvent: 21, priority: 'high' },
      { category: 'Safety', title: 'First-aid and safety coverage', needDescription: 'Confirm trained coverage, emergency contacts, and the location of the first-aid point.', whyItMatters: 'A visible response plan helps volunteers act quickly if needed.', daysBeforeEvent: 21, priority: 'high' },
      { category: 'Sound', title: 'Public-address or stage support', needDescription: 'Check microphone coverage, power, noise limits, and a backup plan.', whyItMatters: 'Clear announcements support accessibility and crowd flow.', daysBeforeEvent: 18, priority: 'medium' },
      { category: 'Sanitation', title: 'Restroom, waste, and cleanup service', needDescription: 'Agree on restroom capacity, waste pickup, recycling, and site handoff.', whyItMatters: 'Sanitation and cleanup affect guest comfort and site approval.', daysBeforeEvent: 14, priority: 'medium' },
    ],
    schedule: [
      { startTime: '08:00 AM', endTime: '10:00 AM', activity: 'Site access and safety setup', description: 'Check permitted layout, accessible routes, first aid, signs, and waste points.', responsiblePerson: 'Site lead' },
      { startTime: '10:00 AM', endTime: '10:30 AM', activity: 'Volunteer briefing and sound test', description: 'Review roles, emergency contacts, shift changes, and sound coverage.', responsiblePerson: 'Volunteer coordinator' },
      { startTime: '10:30 AM', endTime: '11:00 AM', activity: 'Welcome and attendee orientation', description: 'Share schedule, site boundaries, accessible routes, and help point.', responsiblePerson: 'Welcome lead' },
      { startTime: '11:00 AM', endTime: '01:00 PM', activity: 'Community activities and program', description: 'Run scheduled activities with visible leads and clear transition times.', responsiblePerson: 'Program lead' },
      { startTime: '01:00 PM', endTime: '02:00 PM', activity: 'Refreshments and open gathering', description: 'Keep water accessible and coordinate service queues.', responsiblePerson: 'Hospitality lead' },
      { startTime: '02:00 PM', endTime: '03:00 PM', activity: 'Closing and site cleanup', description: 'Thank attendees, collect equipment, and complete the venue handoff.', responsiblePerson: 'Cleanup lead' },
    ],
    ideas: [
      { category: 'Community participation', title: 'Local groups and services map', description: 'Offer a simple directory of participating groups, public services, or community resources.', whyItFits: 'Turns the gathering into a useful connection point for attendees.', tags: ['Community-led', 'Useful'] },
      { category: 'Accessibility', title: 'Quiet rest and help point', description: 'Mark a calm seating area and a clearly signed place to ask for assistance.', whyItFits: 'Makes a busy public event easier to navigate for more people.', tags: ['Accessible', 'Low-stress'] },
    ],
    risks: [
      { risk: 'Weather, crowding, or site access changes', plan: 'Assign a site lead, set a decision time, and share a clear attendee update method.', severity: 'high' },
      { risk: 'A volunteer or safety role is unexpectedly unstaffed', plan: 'Identify backup leads and keep the role list and emergency contacts with the event lead.', severity: 'high' },
    ],
    themeDescription: 'A community event plan that makes site access, public information, volunteer roles, and safety visible.',
    colorPalette: ['#1C3F30', '#5B8E7D', '#F3B562', '#FAF8F5', '#E5DFD5'],
    vibeKeywords: ['Welcoming', 'Accessible', 'Community-led', 'Safe'],
  },
  fundraiser: {
    summaryFocus: 'a clear fundraising purpose, attendee flow, accessibility, donor stewardship, and accountable handoff',
    budget: [
      { name: 'Venue & Permits', percentage: 0.18, essential: true, notes: 'Confirm occupancy, permits, setup windows, and access.' },
      { name: 'Program, Stage & AV', percentage: 0.12, essential: true, notes: 'Support speakers, program cues, and any accessibility needs.' },
      { name: 'Food, Water & Hospitality', percentage: 0.15, essential: true, notes: 'Plan service flow, hydration, and dietary information.' },
      { name: 'Registration & Ticketing Tools', percentage: 0.10, essential: false, notes: 'Use an organizer-approved registration or ticketing process.' },
      { name: 'Accessibility & Safety', percentage: 0.08, essential: true, notes: 'Budget for accessible routes, seating, interpretation, or first aid as needed.' },
      { name: 'Outreach & Donor Communications', percentage: 0.10, essential: false, notes: 'Explain the cause, event details, and follow-up plan.' },
      { name: 'Fundraising Materials & Activities', percentage: 0.12, essential: false, notes: 'Plan materials and staff for the chosen fundraising format.' },
      { name: 'Platform and Processing Fees', percentage: 0.05, essential: true, notes: 'Verify fees with the organizer-approved provider.' },
      { name: 'Contingency Reserve', percentage: 0.10, essential: true, notes: 'Reserve for attendance changes and operational needs.' },
    ],
    tasks: [
      { title: 'Define the cause, fundraising goal, and event format', description: 'Agree on the intended outcome, audience, event format, and the organization accountable for funds.', offsetDays: -45, stage: 'initial-planning', priority: 'high', category: 'Fundraising', owner: 'Organizer' },
      { title: 'Confirm venue permissions and accessibility', description: 'Check capacity, permits, accessible seating, arrival details, and event-hour restrictions.', offsetDays: -35, stage: 'initial-planning', priority: 'high', category: 'Venue', owner: 'Operations lead' },
      { title: 'Select the approved registration and donation process', description: 'Confirm the organization-approved platform, fees, reconciliation owner, and privacy notice.', offsetDays: -28, stage: 'early-preparations', priority: 'high', category: 'Registration', owner: 'Finance lead' },
      { title: 'Prepare the program and speaker run of show', description: 'Confirm speaker order, cause information, AV cues, and time for the fundraising activity.', offsetDays: -21, stage: 'early-preparations', priority: 'high', category: 'Program', owner: 'Program lead' },
      { title: 'Confirm dietary, access, and attendee information', description: 'Provide clear arrival, seating, food, accessibility, and contact information to attendees.', offsetDays: -10, stage: 'month-before', priority: 'high', category: 'Attendee care', owner: 'Guest coordinator' },
      { title: 'Rehearse the donation handoff and event close', description: 'Walk through the approved process, identify the accountable staff, and secure a backup plan.', offsetDays: -1, stage: 'day-before', priority: 'high', category: 'Stewardship', owner: 'Finance lead' },
      { title: 'Reconcile results with the organization and thank supporters', description: 'Use the organization’s approved process to reconcile funds and send a follow-up to supporters.', offsetDays: 2, stage: 'post-event', priority: 'high', category: 'Stewardship', owner: 'Organizer' },
    ],
    vendors: [
      { category: 'Venue', title: 'Accessible event venue', needDescription: 'Confirm capacity, registration area, accessible seating, restrooms, and setup access.', whyItMatters: 'A clear layout supports guest flow and participation.', daysBeforeEvent: 35, priority: 'high' },
      { category: 'AV', title: 'Stage and audiovisual support', needDescription: 'Check microphones, display, lighting, playback, and backup power.', whyItMatters: 'The purpose and program need to be easy to follow.', daysBeforeEvent: 21, priority: 'high' },
      { category: 'Registration', title: 'Organizer-approved ticketing or donation provider', needDescription: 'Verify fees, privacy practices, reconciliation, and who can access reports.', whyItMatters: 'Funds and attendee data need an accountable, approved handling process.', daysBeforeEvent: 21, priority: 'high' },
      { category: 'Hospitality', title: 'Catering and water service', needDescription: 'Agree on dietary labels, water points, service times, and portion planning.', whyItMatters: 'Guest care supports participation throughout the program.', daysBeforeEvent: 18, priority: 'medium' },
      { category: 'Accessibility', title: 'Interpretation or access support if needed', needDescription: 'Confirm whether interpretation, captioning, or other access support is required.', whyItMatters: 'Accessible communication allows more guests to participate.', daysBeforeEvent: 14, priority: 'medium' },
    ],
    schedule: [
      { startTime: '04:00 PM', endTime: '05:00 PM', activity: 'Registration setup and AV check', description: 'Test registration flow, microphones, display, signage, and accessible routes.', responsiblePerson: 'Operations and AV leads' },
      { startTime: '05:00 PM', endTime: '05:45 PM', activity: 'Guest arrival and welcome', description: 'Welcome attendees and explain the program, venue access, and help point.', responsiblePerson: 'Guest coordinator' },
      { startTime: '05:45 PM', endTime: '06:15 PM', activity: 'Opening and cause overview', description: 'Introduce the organization and explain the purpose of the gathering.', responsiblePerson: 'Emcee' },
      { startTime: '06:15 PM', endTime: '07:00 PM', activity: 'Program and fundraising activity', description: 'Run the agreed activity using the approved process and staff roles.', responsiblePerson: 'Fundraising lead' },
      { startTime: '07:00 PM', endTime: '08:00 PM', activity: 'Meal and conversation', description: 'Serve food and allow guests to speak with organizers and participants.', responsiblePerson: 'Hospitality lead' },
      { startTime: '08:00 PM', endTime: '08:30 PM', activity: 'Acknowledgments and close', description: 'Thank speakers, guests, and supporters and explain follow-up timing.', responsiblePerson: 'Organizer' },
    ],
    ideas: [
      { category: 'Fundraising', title: 'One clear impact story', description: 'Share a short, consent-approved story that explains the cause and the planned use of funds.', whyItFits: 'A specific purpose helps attendees understand what the event supports.', tags: ['Purpose-led', 'Consent-aware'] },
      { category: 'Stewardship', title: 'Visible supporter acknowledgment plan', description: 'Offer opt-in acknowledgment options and a clear post-event thank-you timeline.', whyItFits: 'Supports trust while respecting donor privacy preferences.', tags: ['Trust', 'Privacy-aware'] },
    ],
    risks: [
      { risk: 'Registration or donation provider becomes unavailable', plan: 'Confirm provider support, reconciliation steps, and an organization-approved fallback before the event.', severity: 'high' },
      { risk: 'Attendee or donor information is shared too broadly', plan: 'Limit access to authorized organizers and follow the organization’s privacy and retention process.', severity: 'high' },
    ],
    themeDescription: 'A fundraiser plan that connects the cause, program, attendee experience, and accountable follow-up.',
    colorPalette: ['#1C3F30', '#C85A32', '#FAF8F5', '#5B8E7D', '#F3B562'],
    vibeKeywords: ['Purpose-led', 'Clear', 'Welcoming', 'Accountable'],
  },
  other: {
    summaryFocus: 'the host’s purpose, guest needs, a simple schedule, and a practical contingency plan',
    budget: [
      { name: 'Venue & Setup', percentage: 0.25, essential: true, notes: 'Confirm capacity, access, setup, cleanup, and cancellation terms.' },
      { name: 'Food & Beverages', percentage: 0.30, essential: true, notes: 'Plan portions, dietary information, and service timing.' },
      { name: 'Decor & Signage', percentage: 0.10, essential: false, notes: 'Prioritize useful wayfinding and a few reusable items.' },
      { name: 'Photography & Keepsakes', percentage: 0.08, essential: false, notes: 'Set a scope that fits the event purpose and budget.' },
      { name: 'Activities & Entertainment', percentage: 0.12, essential: false, notes: 'Match activities to guest interests and event duration.' },
      { name: 'Transport & Logistics', percentage: 0.10, essential: true, notes: 'Confirm arrivals, deliveries, and equipment needs.' },
      { name: 'Contingency Reserve', percentage: 0.05, essential: true, notes: 'Reserve for timing and supplier changes.' },
    ],
    tasks: [
      { title: 'Write the event purpose and must-have outcomes', description: 'Agree on what the hosts want guests to experience and which moments need time in the schedule.', offsetDays: -30, stage: 'initial-planning', priority: 'high', category: 'Planning', owner: 'Lead host' },
      { title: 'Confirm venue, capacity, and access', description: 'Check the venue in {{location}}, arrival routes, setup access, and any use restrictions.', offsetDays: -21, stage: 'early-preparations', priority: 'high', category: 'Venue', owner: 'Venue contact' },
      { title: 'Plan food, dietary information, and service times', description: 'Agree on the menu, portion estimate for {{guestCount}}, and how dietary needs will be handled.', offsetDays: -14, stage: 'month-before', priority: 'high', category: 'Food', owner: 'Food coordinator' },
      { title: 'Send clear invitations and arrival details', description: 'Share the schedule, location, RSVP date, and any useful preparation information.', offsetDays: -10, stage: 'month-before', priority: 'medium', category: 'Guests', owner: 'Guest coordinator' },
      { title: 'Confirm activity and equipment responsibilities', description: 'Name a lead for each activity and check what needs to be delivered or tested.', offsetDays: -5, stage: 'final-week', priority: 'medium', category: 'Program', owner: 'Program lead' },
      { title: 'Walk through the run sheet and contingency plan', description: 'Review transitions, supplier contacts, guest support, and a backup for the most likely disruption.', offsetDays: -1, stage: 'day-before', priority: 'high', category: 'Logistics', owner: 'Lead host' },
      { title: 'Close out suppliers and collect feedback', description: 'Check returns, final invoices, and any lessons the hosts want to keep.', offsetDays: 2, stage: 'post-event', priority: 'low', category: 'Wrap-up', owner: 'Lead host' },
    ],
    vendors: [
      { category: 'Venue', title: 'Venue or event space', needDescription: 'Confirm capacity, access, setup time, cleanup, and cancellation terms.', whyItMatters: 'Venue constraints shape the rest of the event plan.', daysBeforeEvent: 21, priority: 'high' },
      { category: 'Food', title: 'Catering or refreshment provider', needDescription: 'Request menu, portions, dietary process, service timing, and written pricing.', whyItMatters: 'Clear service details reduce last-minute guest and schedule issues.', daysBeforeEvent: 18, priority: 'high' },
      { category: 'Program', title: 'Activity or entertainment provider', needDescription: 'Confirm the scope, equipment, setup, and timing.', whyItMatters: 'A clear activity plan helps the event feel intentional and well-paced.', daysBeforeEvent: 14, priority: 'medium' },
      { category: 'Logistics', title: 'Equipment or transport provider if needed', needDescription: 'Agree on delivery windows, access, setup support, and pickup.', whyItMatters: 'Logistics need to fit the venue’s access and schedule.', daysBeforeEvent: 10, priority: 'medium' },
      { category: 'Photography', title: 'Photographer or designated host', needDescription: 'Set a short list of important moments and confirm photo-sharing preferences.', whyItMatters: 'A simple plan captures important moments without overplanning.', daysBeforeEvent: 7, priority: 'low' },
    ],
    schedule: [
      { startTime: '02:00 PM', endTime: '03:00 PM', activity: 'Setup and venue check', description: 'Confirm room layout, signage, equipment, and access arrangements.', responsiblePerson: 'Setup lead' },
      { startTime: '03:00 PM', endTime: '03:45 PM', activity: 'Guest arrival and welcome', description: 'Welcome guests and explain the event flow.', responsiblePerson: 'Guest coordinator' },
      { startTime: '03:45 PM', endTime: '04:30 PM', activity: 'Opening and introductions', description: 'Share the event purpose and introduce any key participants.', responsiblePerson: 'Emcee or host' },
      { startTime: '04:30 PM', endTime: '05:30 PM', activity: 'Main activity or program', description: 'Run the planned activity with the named lead and required equipment.', responsiblePerson: 'Program lead' },
      { startTime: '05:30 PM', endTime: '06:30 PM', activity: 'Food and conversation', description: 'Serve refreshments and leave time for guests to connect.', responsiblePerson: 'Hospitality lead' },
      { startTime: '06:30 PM', endTime: '07:00 PM', activity: 'Closing and venue handoff', description: 'Thank guests and confirm cleanup and supplier pickup.', responsiblePerson: 'Lead host' },
    ],
    ideas: [
      { category: 'Guest experience', title: 'Simple welcome and wayfinding point', description: 'Place the event schedule, restrooms, access information, and contact person at the entrance.', whyItFits: 'Guests can orient themselves without interrupting the host.', tags: ['Useful', 'Accessible'] },
      { category: 'Event memory', title: 'Optional shared message board', description: 'Invite guests to leave one short note, suggestion, or memory related to the occasion.', whyItFits: 'Adds participation without requiring a formal program segment.', tags: ['Optional', 'Guest-led'] },
    ],
    risks: [
      { risk: 'A supplier or activity runs late', plan: 'Set a latest arrival time and identify which optional segment can be shortened.', severity: 'medium' },
      { risk: 'Guest access or food needs are missed', plan: 'Review requests with the venue and food lead before confirming the final plan.', severity: 'high' },
    ],
    themeDescription: 'A flexible event plan built around the host’s stated purpose, guest needs, and venue constraints.',
    colorPalette: ['#1C3F30', '#C85A32', '#FAF8F5', '#5B8E7D', '#E5DFD5'],
    vibeKeywords: ['Thoughtful', 'Flexible', 'Welcoming', 'Practical'],
  },
};

export function getDemoPlanProfile(eventType: EventType): DemoPlanProfile {
  return profiles[eventType];
}
