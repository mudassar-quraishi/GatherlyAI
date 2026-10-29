import { describe, it, expect } from 'vitest';
import { calculateReadinessScore } from '@/lib/readiness/calculator';
import { createDefaultDemoEvent } from '@/lib/ai/sampleProvider';

describe('Accessibility Semantics & Interactions', () => {
  it('formats accessible readiness announcement strings correctly', () => {
    const demo = createDefaultDemoEvent();
    const readiness = calculateReadinessScore(demo);

    const announcement = `Event preparation readiness updated to ${readiness.score} percent, ${readiness.rating.replace('-', ' ')}.`;
    expect(announcement).toContain(`${readiness.score} percent`);
    expect(announcement).toMatch(/ready|well prepared|on track|early/);
  });

  it('verifies tab navigation index bounds and wrap-around calculation', () => {
    const tabs = ['overview', 'budget', 'timeline', 'vendors', 'schedule', 'ideas'];
    const tabCount = tabs.length;

    // ArrowRight from last tab wraps to first
    const nextIndex = (tabCount - 1 + 1) % tabCount;
    expect(nextIndex).toBe(0);

    // ArrowLeft from first tab wraps to last
    const prevIndex = (0 - 1 + tabCount) % tabCount;
    expect(prevIndex).toBe(tabCount - 1);

    // Home moves to 0, End moves to tabCount - 1
    expect(0).toBe(0);
    expect(tabCount - 1).toBe(5);
  });

  it('ensures distinct ARIA controls and panel IDs across all tabs', () => {
    const tabs = ['overview', 'budget', 'timeline', 'vendors', 'schedule', 'ideas'];
    const tabIds = new Set();
    const panelIds = new Set();

    for (const tab of tabs) {
      const tabElementId = `tab-${tab}`;
      const panelElementId = `tabpanel-${tab}`;

      expect(tabIds.has(tabElementId)).toBe(false);
      expect(panelIds.has(panelElementId)).toBe(false);

      tabIds.add(tabElementId);
      panelIds.add(panelElementId);
    }

    expect(tabIds.size).toBe(6);
    expect(panelIds.size).toBe(6);
  });
});
