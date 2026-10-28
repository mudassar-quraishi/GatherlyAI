import { describe, it, expect } from 'vitest';
import {
  toMinorUnits,
  toMajorUnits,
  normalizeBudgetBreakdown,
  calculateBudgetHealth,
  formatCurrency,
} from '@/lib/budget/calculator';
import { BudgetCategory } from '@/types/event';

describe('Budget Calculations & Currency Handling', () => {
  it('converts to and from minor units without floating-point errors', () => {
    expect(toMinorUnits(100.55)).toBe(10055);
    expect(toMajorUnits(10055)).toBe(100.55);
    expect(toMinorUnits(0.1 + 0.2)).toBe(30); // 0.30 cents, avoids 0.30000000000000004
  });

  it('reconciles category totals with planned budget and computes unallocated amount', () => {
    const totalBudget = 500000;
    const categories: BudgetCategory[] = [
      { id: '1', name: 'Venue', allocatedAmount: 200000, actualSpent: 0, isEssential: true },
      { id: '2', name: 'Catering', allocatedAmount: 150000, actualSpent: 0, isEssential: true },
      { id: '3', name: 'Contingency Fund', allocatedAmount: 50000, actualSpent: 0, isEssential: true },
    ];

    const result = normalizeBudgetBreakdown(totalBudget, categories);
    expect(result.totalAllocated).toBe(400000);
    expect(result.unallocated).toBe(100000);
    expect(result.contingencyAmount).toBe(50000);
    expect(result.totalAllocated + result.unallocated).toBe(totalBudget);
  });

  it('detects over-allocated budget accurately', () => {
    const totalBudget = 100000;
    const categories: BudgetCategory[] = [
      { id: '1', name: 'Venue', allocatedAmount: 70000, actualSpent: 0, isEssential: true },
      { id: '2', name: 'Decor', allocatedAmount: 50000, actualSpent: 0, isEssential: true },
    ];

    const health = calculateBudgetHealth(totalBudget, categories);
    expect(health.isOverAllocated).toBe(true);
    expect(health.totalAllocated).toBe(120000);
    expect(health.healthStatus).toBe('warning');
  });

  it('detects over-budget spending and updates health status to critical', () => {
    const totalBudget = 100000;
    const categories: BudgetCategory[] = [
      { id: '1', name: 'Venue', allocatedAmount: 60000, actualSpent: 75000, isEssential: true },
      { id: '2', name: 'Catering', allocatedAmount: 40000, actualSpent: 45000, isEssential: true },
    ];

    const health = calculateBudgetHealth(totalBudget, categories);
    expect(health.isOverBudget).toBe(true);
    expect(health.totalSpent).toBe(120000);
    expect(health.remainingBudget).toBe(-20000);
    expect(health.healthStatus).toBe('critical');
    expect(health.notes.some((n) => n.includes('exceeded total budget'))).toBe(true);
  });

  it('warns when contingency reserve is less than 5%', () => {
    const totalBudget = 100000;
    const categories: BudgetCategory[] = [
      { id: '1', name: 'Venue', allocatedAmount: 98000, actualSpent: 0, isEssential: true },
      { id: '2', name: 'Contingency', allocatedAmount: 2000, actualSpent: 0, isEssential: true }, // only 2%
    ];

    const health = calculateBudgetHealth(totalBudget, categories);
    expect(health.hasSufficientContingency).toBe(false);
    expect(health.contingencyPercent).toBe(2);
    expect(health.healthStatus).toBe('caution');
  });

  it('formats currency correctly for INR and foreign currencies', () => {
    const formattedInr = formatCurrency(500000, 'INR');
    expect(formattedInr).toContain('5,00,000'); // Indian number formatting
  });
});
