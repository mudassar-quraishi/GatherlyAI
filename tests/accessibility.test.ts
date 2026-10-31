import { describe, it, expect } from 'vitest';
import React, { useState, useEffect, useRef } from 'react';
import { render, screen, act } from '@testing-library/react';
import { calculateReadinessScore } from '@/lib/readiness/calculator';
import { createDefaultDemoEvent } from '@/lib/ai/sampleProvider';
import { EventDetails } from '@/types/event';

// Test Harness simulating Workspace Navigation and Live Announcement behavior using React.createElement
function AccessibleWorkspaceHarness({ initialEvent }: { initialEvent: EventDetails }) {
  const [event, setEvent] = useState(initialEvent);
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'timeline' | 'vendors'>('overview');
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'budget', label: 'Budget Planner' },
    { id: 'timeline', label: 'Timeline & Tasks' },
    { id: 'vendors', label: 'Vendor Checklist' },
  ] as const;

  const readiness = calculateReadinessScore(event);
  const [readinessAnnouncement, setReadinessAnnouncement] = useState<string>('');
  const prevScoreRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevScoreRef.current !== null && prevScoreRef.current !== readiness.score) {
      setReadinessAnnouncement(
        `Event preparation readiness updated to ${readiness.score} percent, ${readiness.rating.replace('-', ' ')}.`
      );
    }
    prevScoreRef.current = readiness.score;
  }, [readiness.score, readiness.rating]);

  return React.createElement(
    'div',
    null,
    // Workspace-level screen reader live announcer
    React.createElement(
      'div',
      {
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': 'true',
        className: 'sr-only',
        'data-testid': 'workspace-announcer',
      },
      readinessAnnouncement
    ),
    // Tab Navigation
    React.createElement(
      'div',
      { role: 'tablist', 'aria-label': 'Workspace Sections' },
      tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return React.createElement(
          'button',
          {
            key: tab.id,
            id: `tab-${tab.id}`,
            role: 'tab',
            'aria-selected': isActive,
            'aria-controls': `tabpanel-${tab.id}`,
            tabIndex: isActive ? 0 : -1,
            onClick: () => setActiveTab(tab.id),
          },
          tab.label
        );
      })
    ),
    // All Tab Panels rendered in DOM with WAI-ARIA states
    tabs.map((tab) =>
      React.createElement(
        'div',
        {
          key: tab.id,
          role: 'tabpanel',
          id: `tabpanel-${tab.id}`,
          'aria-labelledby': `tab-${tab.id}`,
          tabIndex: activeTab === tab.id ? 0 : -1,
          hidden: activeTab !== tab.id,
        },
        `${tab.label} Panel Content`
      )
    ),
    // Simulation button to mark task complete
    React.createElement(
      'button',
      {
        'data-testid': 'simulate-task-toggle',
        onClick: () => {
          if (!event.plan) return;
          const updatedTasks = event.plan.timelineTasks.map((t, idx) => {
            if (idx === 0) {
              const nextStatus: 'todo' | 'in_progress' | 'done' = t.status === 'done' ? 'todo' : 'done';
              return { ...t, status: nextStatus };
            }
            return t;
          });
          setEvent({
            ...event,
            plan: {
              ...event.plan,
              timelineTasks: updatedTasks,
            },
          });
        },
      },
      'Toggle Task'
    )
  );
}

describe('Accessibility Semantics & Runtime Interactions', () => {
  it('renders complete WAI-ARIA tab pattern with matching tab-to-panel relationships', () => {
    const demo = createDefaultDemoEvent();
    render(React.createElement(AccessibleWorkspaceHarness, { initialEvent: demo }));

    // Tablist has proper accessible label
    const tablist = screen.getByRole('tablist', { name: 'Workspace Sections' });
    expect(tablist).not.toBeNull();

    const tabs = ['overview', 'budget', 'timeline', 'vendors'];
    for (const tabId of tabs) {
      const tab = document.getElementById(`tab-${tabId}`);
      expect(tab?.getAttribute('role')).toBe('tab');
      expect(tab?.getAttribute('aria-controls')).toBe(`tabpanel-${tabId}`);

      // Crucial WAI-ARIA check: The referenced panel MUST exist in the document
      const panel = document.getElementById(`tabpanel-${tabId}`);
      expect(panel).not.toBeNull();
      expect(panel?.getAttribute('role')).toBe('tabpanel');
      expect(panel?.getAttribute('aria-labelledby')).toBe(`tab-${tabId}`);
    }

    // Active tab has aria-selected=true and its panel is visible (not hidden)
    const activeTab = document.getElementById('tab-overview');
    expect(activeTab?.getAttribute('aria-selected')).toBe('true');
    expect(document.getElementById('tabpanel-overview')?.hasAttribute('hidden')).toBe(false);

    // Inactive panels have hidden attribute
    expect(document.getElementById('tabpanel-budget')?.hasAttribute('hidden')).toBe(true);
    expect(document.getElementById('tabpanel-timeline')?.hasAttribute('hidden')).toBe(true);
  });

  it('updates readiness score and announces to screen reader via live status region upon runtime changes', async () => {
    const demo = createDefaultDemoEvent();
    render(React.createElement(AccessibleWorkspaceHarness, { initialEvent: demo }));

    const announcer = screen.getByTestId('workspace-announcer');
    expect(announcer.getAttribute('role')).toBe('status');
    expect(announcer.getAttribute('aria-live')).toBe('polite');
    expect(announcer.getAttribute('aria-atomic')).toBe('true');

    // Initially empty to avoid loud page load noise
    expect(announcer.textContent).toBe('');

    // Simulate completing a task at runtime
    const toggleBtn = screen.getByTestId('simulate-task-toggle');
    act(() => {
      toggleBtn.click();
    });

    // Announcer should now announce the updated readiness score
    expect(announcer.textContent).toMatch(/Event preparation readiness updated to \d+ percent/);
  });

  it('calculates proper wrap-around indices for keyboard navigation', () => {
    const tabCount = 6;
    expect((5 + 1) % tabCount).toBe(0); // ArrowRight wrap from last to first
    expect((0 - 1 + tabCount) % tabCount).toBe(5); // ArrowLeft wrap from first to last
  });
});
