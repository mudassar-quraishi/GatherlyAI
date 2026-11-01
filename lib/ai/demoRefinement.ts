import type { EventDetails, EventPlan, PersonalizedIdea, TimelineTask } from '@/types/event';

type RefinementType =
  | 'budget-friendly'
  | 'more-elegant'
  | 'eco-friendly'
  | 'child-friendly'
  | 'smaller-guest-list'
  | 'rain-contingency';

interface RefinementRule {
  summary: string;
  task: Omit<TimelineTask, 'id' | 'dueDate' | 'status'>;
  idea: Omit<PersonalizedIdea, 'id'>;
  risk?: EventPlan['risksAndContingencies'][number];
}

const rules: Record<RefinementType, RefinementRule> = {
  'budget-friendly': {
    summary: 'reviewed discretionary allocations and moved available savings to the contingency reserve',
    task: {
      title: 'Compare lower-cost options for nonessential items',
      description: 'Request comparable scopes and confirm service quality before changing any supplier or allocation.',
      stage: 'early-preparations', priority: 'medium', category: 'Budget', owner: 'Lead host',
    },
    idea: {
      category: 'Budget planning', title: 'Use a focused set of high-impact details',
      description: 'Choose one or two visible decor or program moments and keep supporting elements simple or reusable.',
      whyItFits: 'Concentrating the spend can preserve the intended experience while making trade-offs easier to review.',
      tags: ['Budget-aware', 'Practical'],
    },
  },
  'more-elegant': {
    summary: 'added a considered styling and hospitality focus',
    task: {
      title: 'Review the guest-facing style details',
      description: 'Check lighting, table layout, signage, and service flow together so the chosen theme feels consistent.',
      stage: 'early-preparations', priority: 'medium', category: 'Design', owner: 'Design lead',
    },
    idea: {
      category: 'Atmosphere', title: 'Create one cohesive welcome moment',
      description: 'Use a clear arrival cue, warm lighting, and a small theme detail at the welcome point.',
      whyItFits: 'A coordinated first impression can feel polished without adding complexity throughout the venue.',
      tags: ['Welcoming', 'Coordinated'],
    },
  },
  'eco-friendly': {
    summary: 'added waste reduction and reusable sourcing actions',
    task: {
      title: 'Confirm reusable and lower-waste service options',
      description: 'Ask the venue and food provider about reusable serviceware, sorting, water refill points, and post-event collection.',
      stage: 'early-preparations', priority: 'medium', category: 'Sustainability', owner: 'Operations lead',
    },
    idea: {
      category: 'Sustainability', title: 'Set up clearly marked reuse and recycling points',
      description: 'Coordinate labeled collection points with the venue and identify who will check them during the event.',
      whyItFits: 'A named owner and clear signs make waste reduction easier for guests and the venue team.',
      tags: ['Lower-waste', 'Operational'],
    },
  },
  'child-friendly': {
    summary: 'added family comfort and age-flexible activity planning',
    task: {
      title: 'Confirm family-friendly facilities and supervision',
      description: 'Check seating, safe activity space, quiet breaks, and the adults responsible for any child-focused activity.',
      stage: 'early-preparations', priority: 'high', category: 'Guest comfort', owner: 'Guest coordinator',
    },
    idea: {
      category: 'Family activities', title: 'Offer an optional calm activity space',
      description: 'Prepare a visible, supervised area with a quiet activity and seating for guests who need a break.',
      whyItFits: 'Families can choose the level of participation that works for them.',
      tags: ['Family-friendly', 'Flexible'],
    },
  },
  'smaller-guest-list': {
    summary: 'added a guest-count and layout review before final supplier commitments',
    task: {
      title: 'Recheck headcount and room layout before confirming quantities',
      description: 'Confirm the latest RSVP target, seating plan, food quantities, and supplier minimums with the host.',
      stage: 'early-preparations', priority: 'high', category: 'Guests and budget', owner: 'Guest coordinator',
    },
    idea: {
      category: 'Guest connection', title: 'Leave room for unhurried conversation',
      description: 'Use the revised layout to create comfortable seating clusters and a simple shared activity.',
      whyItFits: 'A smaller gathering can feel personal when the room supports conversation and easy movement.',
      tags: ['Intimate', 'Guest comfort'],
    },
  },
  'rain-contingency': {
    summary: 'added a weather decision point and backup arrangements',
    task: {
      title: 'Confirm the weather backup and guest notification owner',
      description: 'Agree on the sheltered alternative, decision deadline, setup changes, and how guests will hear about a change.',
      stage: 'final-week', priority: 'high', category: 'Contingency', owner: 'Lead coordinator',
    },
    idea: {
      category: 'Contingency', title: 'Prepare a simple indoor transition checklist',
      description: 'List the people, equipment, signs, and timing needed to move the event to its sheltered alternative.',
      whyItFits: 'A named decision point and checklist reduce uncertainty if conditions change.',
      tags: ['Weather-ready', 'Operational'],
    },
    risk: {
      risk: 'Weather makes the planned outdoor area unusable',
      plan: 'Confirm a sheltered alternative, a decision deadline, and who will notify guests and suppliers.',
      severity: 'high',
    },
  },
};

function appendUnique<T>(items: T[], item: T, key: (value: T) => string): T[] {
  const signature = key(item).toLowerCase();
  return items.some((existing) => key(existing).toLowerCase() === signature) ? items : [...items, item];
}

function addBudgetReserve(plan: EventPlan): EventPlan {
  const categories = plan.budgetBreakdown.categories.map((category) => ({ ...category }));
  const reserveIndex = categories.findIndex((category) => /contingency|reserve/i.test(category.name));
  let savings = 0;

  for (const category of categories) {
    if (category.isEssential || /contingency|reserve/i.test(category.name)) continue;
    const unspentAllocation = Math.max(0, category.allocatedAmount - category.actualSpent);
    const reduction = Math.min(Math.floor(category.allocatedAmount * 0.1), unspentAllocation);
    category.allocatedAmount -= reduction;
    savings += reduction;
  }

  if (savings > 0 && reserveIndex >= 0) {
    categories[reserveIndex].allocatedAmount += savings;
  } else if (savings > 0) {
    categories.push({
      id: `demo-refinement-reserve-${Date.now()}`,
      name: 'Contingency Reserve',
      allocatedAmount: savings,
      actualSpent: 0,
      isEssential: true,
      notes: 'Reserve created from available discretionary allocations.',
    });
  }

  return {
    ...plan,
    budgetBreakdown: {
      ...plan.budgetBreakdown,
      categories,
      contingencyAmount: plan.budgetBreakdown.contingencyAmount + savings,
    },
  };
}

function taskFor(rule: RefinementRule, event: EventDetails): TimelineTask {
  return {
    id: `demo-refinement-task-${Date.now()}`,
    ...rule.task,
    dueDate: event.date,
    status: 'todo',
  };
}

function applyRule(plan: EventPlan, event: EventDetails, type: RefinementType): EventPlan {
  const rule = rules[type];
  const basePlan = type === 'budget-friendly' ? addBudgetReserve(plan) : plan;
  const task = taskFor(rule, event);
  const idea: PersonalizedIdea = { id: `demo-refinement-idea-${Date.now()}`, ...rule.idea };

  return {
    ...basePlan,
    eventSummary: `${basePlan.eventSummary} Demo refinement: ${rule.summary}.`,
    timelineTasks: appendUnique(basePlan.timelineTasks, task, (item) => item.title),
    personalizedIdeas: appendUnique(basePlan.personalizedIdeas, idea, (item) => item.title),
    risksAndContingencies: rule.risk
      ? appendUnique(basePlan.risksAndContingencies, rule.risk, (item) => item.risk)
      : basePlan.risksAndContingencies,
  };
}

function customRule(prompt: string): RefinementType | undefined {
  if (/\b(eco|sustainab|reus|waste|recycl|compost)\b/i.test(prompt)) return 'eco-friendly';
  if (/\b(rain|weather|storm|outdoor backup)\b/i.test(prompt)) return 'rain-contingency';
  if (/\b(child|children|kid|family)\b/i.test(prompt)) return 'child-friendly';
  if (/\b(budget|cheaper|save money|lower cost)\b/i.test(prompt)) return 'budget-friendly';
  if (/\b(elegant|luxury|polished|upscale)\b/i.test(prompt)) return 'more-elegant';
  if (/\b(smaller|intimate|fewer guests|guest list)\b/i.test(prompt)) return 'smaller-guest-list';
  return undefined;
}

function isRefinementType(value: string): value is RefinementType {
  return Object.hasOwn(rules, value);
}

/** Applies transparent, local demo rules while keeping existing user edits intact. */
export function refineDemoPlan(
  event: EventDetails,
  currentPlan: EventPlan,
  modificationType: string,
  customPrompt?: string
): { plan: EventPlan; notice: string } {
  let nextPlan = currentPlan;
  let notice: string;

  if (modificationType === 'custom') {
    const prompt = customPrompt?.trim();
    const matchedRule = prompt ? customRule(prompt) : undefined;
    if (matchedRule) {
      nextPlan = applyRule(currentPlan, event, matchedRule);
      notice = `Demo mode applied the matching “${matchedRule}” planning rule. Existing task progress and spending were retained.`;
    } else {
      const request = prompt || 'Add a specific custom planning request';
      const followUp: TimelineTask = {
        id: `demo-custom-review-${Date.now()}`,
        title: `Review custom request: ${request}`.slice(0, 200),
        description: 'Demo mode cannot interpret this request in detail. Review it with the event host and update the relevant plan sections.',
        stage: 'early-preparations', dueDate: event.date, priority: 'medium', status: 'todo',
        category: 'Custom request', owner: 'Lead host',
      };
      nextPlan = {
        ...currentPlan,
        eventSummary: `${currentPlan.eventSummary} A custom request was recorded for review.`,
        timelineTasks: appendUnique(currentPlan.timelineTasks, followUp, (item) => item.title),
      };
      notice = 'Demo mode recorded a review task. It cannot interpret open-ended custom requests; configure live Gemini for that.';
    }
  } else if (isRefinementType(modificationType)) {
    nextPlan = applyRule(currentPlan, event, modificationType);
    notice = `Demo mode applied the “${modificationType}” planning rule. Existing task progress and spending were retained.`;
  } else {
    notice = 'Demo mode did not recognize this refinement, so the existing plan was kept.';
  }

  return {
    plan: {
      ...nextPlan,
      generationSource: 'demo',
      lastRefinedAt: new Date().toISOString(),
    },
    notice,
  };
}
