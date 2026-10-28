import { describe, it, expect } from 'vitest';
import { calculateReadinessScore } from '@/lib/readiness/calculator';
import { createDefaultDemoEvent } from '@/lib/ai/sampleProvider';

describe('Readiness Score Calculator', () => {
  it('returns a sensible score and breakdown for sample event', () => {
    const demoEvent = createDefaultDemoEvent();
    const result = calculateReadinessScore(demoEvent);

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(['early', 'on-track', 'well-prepared', 'ready']).toContain(result.rating);
    expect(result.details.tasksCompletedPercent).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('handles an event with no generated plan gracefully', () => {
    const rawEvent = {
      ...createDefaultDemoEvent(),
      plan: undefined,
    };
    const result = calculateReadinessScore(rawEvent);

    expect(result.score).toBe(10);
    expect(result.rating).toBe('early');
    expect(result.suggestions.some((s) => s.includes('Generate an AI'))).toBe(true);
  });
});
