import { BudgetCategory, BudgetBreakdown, BudgetHealthResult } from '@/types/event';

const MINOR_UNIT_MULTIPLIER = 100; // 100 paise/cents per unit

/**
 * Converts a major currency value (e.g. 5000) to minor units (e.g. 500000) safely rounding to integer.
 */
export function toMinorUnits(majorAmount: number): number {
  if (isNaN(majorAmount) || !isFinite(majorAmount)) return 0;
  return Math.round(majorAmount * MINOR_UNIT_MULTIPLIER);
}

/**
 * Converts minor units back to major currency value.
 */
export function toMajorUnits(minorAmount: number): number {
  return minorAmount / MINOR_UNIT_MULTIPLIER;
}

/**
 * Format currency with locale and symbol.
 */
export function formatCurrency(
  amount: number,
  currency: string = 'INR'
): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  } catch {
    // Fallback if currency code is unusual
    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
    return `${symbol}${safeAmount.toLocaleString()}`;
  }
}

/**
 * Normalizes a list of budget categories against the event total budget:
 * Ensures all allocations sum up cleanly and calculates any unallocated balance.
 * Uses integer minor units to eliminate floating-point arithmetic errors.
 */
export function normalizeBudgetBreakdown(
  totalBudget: number,
  categories: BudgetCategory[]
): BudgetBreakdown {
  const totalBudgetMinor = Math.max(0, toMinorUnits(totalBudget));
  
  let totalAllocatedMinor = 0;
  let contingencyMinor = 0;

  const sanitizedCategories = categories.map((cat, idx) => {
    const allocated = Math.max(0, cat.allocatedAmount || 0);
    const spent = Math.max(0, cat.actualSpent || 0);
    const allocatedMinor = toMinorUnits(allocated);
    totalAllocatedMinor += allocatedMinor;

    if (cat.name.toLowerCase().includes('contingency')) {
      contingencyMinor += allocatedMinor;
    }

    return {
      ...cat,
      id: cat.id || `cat-${idx}-${Date.now()}`,
      allocatedAmount: allocated,
      actualSpent: spent,
    };
  });

  const unallocatedMinor = Math.max(0, totalBudgetMinor - totalAllocatedMinor);

  return {
    categories: sanitizedCategories,
    totalAllocated: toMajorUnits(totalAllocatedMinor),
    unallocated: toMajorUnits(unallocatedMinor),
    contingencyAmount: toMajorUnits(contingencyMinor),
  };
}

/**
 * Calculates budget health metrics and alerts.
 */
export function calculateBudgetHealth(
  totalBudget: number,
  categories: BudgetCategory[]
): BudgetHealthResult {
  const totalBudgetMinor = toMinorUnits(totalBudget);
  
  let totalAllocatedMinor = 0;
  let totalSpentMinor = 0;
  let contingencyMinor = 0;

  for (const cat of categories) {
    const allocatedMinor = toMinorUnits(cat.allocatedAmount || 0);
    const spentMinor = toMinorUnits(cat.actualSpent || 0);
    totalAllocatedMinor += allocatedMinor;
    totalSpentMinor += spentMinor;

    if (cat.name.toLowerCase().includes('contingency')) {
      contingencyMinor += allocatedMinor;
    }
  }

  const remainingBudgetMinor = totalBudgetMinor - totalSpentMinor;
  const isOverBudget = totalSpentMinor > totalBudgetMinor;
  const isOverAllocated = totalAllocatedMinor > totalBudgetMinor;

  const contingencyPercent =
    totalBudgetMinor > 0 ? (contingencyMinor / totalBudgetMinor) * 100 : 0;
  const hasSufficientContingency = contingencyPercent >= 5;

  const notes: string[] = [];

  if (isOverBudget) {
    const excess = toMajorUnits(totalSpentMinor - totalBudgetMinor);
    notes.push(`Actual spending has exceeded total budget by ${excess.toLocaleString()}.`);
  }

  if (isOverAllocated) {
    const overage = toMajorUnits(totalAllocatedMinor - totalBudgetMinor);
    notes.push(`Category allocations exceed planned budget by ${overage.toLocaleString()}.`);
  }

  if (!hasSufficientContingency && totalBudgetMinor > 0) {
    notes.push(
      `Contingency reserve (${contingencyPercent.toFixed(1)}%) is below the recommended 5–10% safety cushion.`
    );
  }

  let healthStatus: 'healthy' | 'caution' | 'warning' | 'critical' = 'healthy';
  if (isOverBudget) {
    healthStatus = 'critical';
  } else if (isOverAllocated) {
    healthStatus = 'warning';
  } else if (!hasSufficientContingency) {
    healthStatus = 'caution';
  }

  return {
    totalBudget: toMajorUnits(totalBudgetMinor),
    totalAllocated: toMajorUnits(totalAllocatedMinor),
    totalSpent: toMajorUnits(totalSpentMinor),
    remainingBudget: toMajorUnits(remainingBudgetMinor),
    isOverBudget,
    isOverAllocated,
    contingencyPercent: Math.round(contingencyPercent * 10) / 10,
    hasSufficientContingency,
    healthStatus,
    notes,
  };
}
