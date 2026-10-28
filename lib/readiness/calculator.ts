import { EventDetails, ReadinessScoreResult } from '@/types/event';
import { calculateBudgetHealth } from '@/lib/budget/calculator';

/**
 * Calculates a transparent, 0–100 Preparation Readiness Score from genuine event data:
 * 1. Task Completion (35% weight):
 *    - Overall tasks done percentage (20 pts)
 *    - High-priority tasks done (15 pts)
 * 2. Vendor Confirmation (25% weight):
 *    - Percent of vendors confirmed or marked not-required (25 pts)
 * 3. Schedule Completeness (20% weight):
 *    - At least 3 structured event-day schedule items (20 pts)
 * 4. Budget Integrity (20% weight):
 *    - Allocations balanced without overspending/over-allocation (20 pts)
 */
export function calculateReadinessScore(event: EventDetails): ReadinessScoreResult {
  const plan = event.plan;
  if (!plan) {
    return {
      score: 10,
      rating: 'early',
      details: {
        tasksCompletedPercent: 0,
        highPriorityTasksDone: 0,
        totalHighPriorityTasks: 0,
        vendorsConfirmedPercent: 0,
        budgetBalanced: false,
        scheduleReady: false,
      },
      suggestions: ['Generate an AI or sample plan to establish your initial timeline and budget.'],
    };
  }

  const tasks = plan.timelineTasks || [];
  const vendors = plan.vendorChecklist || [];
  const schedule = plan.eventDaySchedule || [];
  const categories = plan.budgetBreakdown?.categories || [];

  // 1. Task Scoring (35 points)
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const tasksCompletedPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const taskProgressPoints = (tasksCompletedPercent / 100) * 20;

  const highPriorityTasks = tasks.filter((t) => t.priority === 'high');
  const highPriorityDone = highPriorityTasks.filter((t) => t.status === 'done').length;
  const highPriorityRatio =
    highPriorityTasks.length > 0 ? highPriorityDone / highPriorityTasks.length : 1;
  const highPriorityPoints = highPriorityRatio * 15;

  // 2. Vendor Scoring (25 points)
  const activeVendors = vendors.filter((v) => v.status !== 'not-required');
  const confirmedVendors = activeVendors.filter((v) => v.status === 'confirmed');
  const vendorsConfirmedPercent =
    activeVendors.length > 0
      ? Math.round((confirmedVendors.length / activeVendors.length) * 100)
      : 100;
  const vendorPoints = (vendorsConfirmedPercent / 100) * 25;

  // 3. Schedule Completeness (20 points)
  const scheduleReady = schedule.length >= 3;
  const schedulePoints = scheduleReady ? 20 : (schedule.length / 3) * 20;

  // 4. Budget Integrity (20 points)
  const budgetHealth = calculateBudgetHealth(event.totalBudget, categories);
  const budgetBalanced = !budgetHealth.isOverBudget && !budgetHealth.isOverAllocated;
  let budgetPoints = 20;
  if (budgetHealth.isOverBudget) {
    budgetPoints = 0;
  } else if (budgetHealth.isOverAllocated) {
    budgetPoints = 10;
  } else if (!budgetHealth.hasSufficientContingency) {
    budgetPoints = 16;
  }

  const totalRawScore = taskProgressPoints + highPriorityPoints + vendorPoints + schedulePoints + budgetPoints;
  const score = Math.min(100, Math.max(0, Math.round(totalRawScore)));

  let rating: 'early' | 'on-track' | 'well-prepared' | 'ready' = 'early';
  if (score >= 85) {
    rating = 'ready';
  } else if (score >= 65) {
    rating = 'well-prepared';
  } else if (score >= 40) {
    rating = 'on-track';
  }

  const suggestions: string[] = [];
  if (highPriorityTasks.length > highPriorityDone) {
    suggestions.push(
      `${highPriorityTasks.length - highPriorityDone} high-priority checklist task(s) still require action.`
    );
  }
  if (vendorsConfirmedPercent < 50 && activeVendors.length > 0) {
    suggestions.push('Over half of your essential event suppliers are awaiting confirmation.');
  }
  if (!budgetBalanced) {
    suggestions.push('Review your budget allocation to resolve budget overages.');
  }
  if (schedule.length < 3) {
    suggestions.push('Add key milestone times to your Event-Day schedule run sheet.');
  }
  if (suggestions.length === 0) {
    suggestions.push('Everything is in order! Review your day schedule and contingency plans.');
  }

  return {
    score,
    rating,
    details: {
      tasksCompletedPercent,
      highPriorityTasksDone: highPriorityDone,
      totalHighPriorityTasks: highPriorityTasks.length,
      vendorsConfirmedPercent,
      budgetBalanced,
      scheduleReady,
    },
    suggestions,
  };
}
