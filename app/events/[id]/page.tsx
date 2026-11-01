'use client';

import React, { useEffect, useState, use, Suspense, useRef } from 'react';
import Navbar from '@/components/ui/Navbar';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import OverviewTab from '@/components/workspace/OverviewTab';
import BudgetTab from '@/components/workspace/BudgetTab';
import TimelineTab from '@/components/workspace/TimelineTab';
import VendorsTab from '@/components/workspace/VendorsTab';
import ScheduleTab from '@/components/workspace/ScheduleTab';
import IdeasTab from '@/components/workspace/IdeasTab';
import type { EventDetails } from '@/types/event';
import { eventStorage } from '@/lib/storage/eventStorage';
import { generateSamplePlan } from '@/lib/ai/sampleProvider';
import { calculateReadinessScore } from '@/lib/readiness/calculator';
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  Users,
  Clock,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface WorkspacePageProps {
  params: Promise<{ id: string }>;
}

type TabType = 'overview' | 'budget' | 'timeline' | 'vendors' | 'schedule' | 'ideas';
interface WorkspaceTab {
  id: TabType;
  label: string;
  icon: LucideIcon;
}

function WorkspaceContent({ params }: WorkspacePageProps) {
  const resolvedParams = use(params);

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persistent workspace-level readiness score tracking across all tab switches
  const readiness = event ? calculateReadinessScore(event) : null;
  const readinessScore = readiness?.score ?? null;
  const readinessRating = readiness?.rating ?? null;
  const [readinessAnnouncement, setReadinessAnnouncement] = useState<string>('');
  const prevScoreRef = useRef<number | null>(null);

  useEffect(() => {
    if (readinessScore === null || readinessRating === null) return;
    // Suppress announcement on initial page load; only announce meaningful runtime changes
    if (prevScoreRef.current !== null && prevScoreRef.current !== readinessScore) {
      const msg = `Event preparation readiness updated to ${readinessScore} percent, ${readinessRating.replace('-', ' ')}.`;
      setReadinessAnnouncement(msg);
    }
    prevScoreRef.current = readinessScore;
  }, [readinessScore, readinessRating]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = eventStorage.getEventById(resolvedParams.id);
      setEvent(found);
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [resolvedParams.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUpdateEvent = (updates: Partial<EventDetails>) => {
    if (!event) return;
    const updated = eventStorage.updateEvent(event.id, updates);
    if (updated) {
      setEvent(updated);
    }
  };

  const handleGeneratePlan = async () => {
    if (!event || isGenerating) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      const data = await res.json();
      if (data.success && data.plan) {
        handleUpdateEvent({ plan: data.plan });
        showToast(
          data.source === 'live-ai'
            ? 'Live Gemini AI generated your plan!'
            : data.notice || 'Generated curated sample plan in Demo Mode.'
        );
      } else {
        alert(data.error || 'Failed to generate plan.');
      }
    } catch (err) {
      console.error('Generation error:', err);
      // Local fallback
      const sample = generateSamplePlan(event);
      handleUpdateEvent({ plan: sample });
      showToast('Offline fallback: Loaded curated sample plan in Demo Mode.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadSamplePlan = () => {
    if (!event) return;
    const sample = generateSamplePlan(event);
    handleUpdateEvent({ plan: sample });
    showToast('Loaded curated sample plan in Demo Mode.');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-8 h-8 border-3 border-[#1C3F30] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-lg mx-auto flex flex-col items-center justify-center text-center p-8">
          <AlertCircle className="w-12 h-12 text-[#C0392B] mb-3" />
          <h2 className="text-xl font-bold text-[#1E2922]">Celebration Plan Not Found</h2>
          <p className="text-xs text-[#64746D] mt-1 mb-6">
            The event workspace you are attempting to access does not exist or has been deleted.
          </p>
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#1C3F30] text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const tabs: WorkspaceTab[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'budget', label: 'Budget Planner', icon: DollarSign },
    { id: 'timeline', label: 'Timeline & Tasks', icon: Calendar },
    { id: 'vendors', label: 'Vendor Checklist', icon: Users },
    { id: 'schedule', label: 'Day Schedule', icon: Clock },
    { id: 'ideas', label: 'Ideas & Refinement', icon: Sparkles },
  ];

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;
    if (e.key === 'ArrowRight') {
      targetIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      targetIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
    } else if (e.key === 'End') {
      targetIndex = tabs.length - 1;
    }

    if (targetIndex !== -1) {
      e.preventDefault();
      const nextTab = tabs[targetIndex];
      setActiveTab(nextTab.id);
      tabRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <Navbar />

      {/* Floating Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl bg-[#1C3F30] text-white shadow-lg text-xs sm:text-sm animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#B7E4C7]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Workspace Header Strip */}
      <WorkspaceHeader
        event={event}
        onGeneratePlan={handleGeneratePlan}
        isGenerating={isGenerating}
        onLoadSamplePlan={handleLoadSamplePlan}
      />

      {/* Navigation Tabs Bar with WAI-ARIA Tablist */}
      <div className="no-print bg-[#FFFFFF] border-b border-[#E5DFD5] sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            role="tablist"
            aria-label="Workspace Sections"
            className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2"
          >
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  ref={(el) => {
                    tabRefs.current[idx] = el;
                  }}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus:outline-hidden focus:ring-2 focus:ring-[#1C3F30] focus:ring-offset-2 ${
                    isActive
                      ? 'bg-[#1C3F30] text-white shadow-xs'
                      : 'text-[#64746D] hover:text-[#1E2922] hover:bg-[#F4EFEB]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dedicated Screen Reader Live Announcement Region: Persistent across all tabs */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          id="workspace-readiness-announcement"
        >
          {readinessAnnouncement}
        </div>

        {/* Screen/Interactive View with WAI-ARIA Tabpanels: All 6 panels exist in the DOM */}
        <div
          role="tabpanel"
          id="tabpanel-overview"
          aria-labelledby="tab-overview"
          tabIndex={activeTab === 'overview' ? 0 : -1}
          hidden={activeTab !== 'overview'}
          className="no-print focus:outline-hidden"
        >
          <OverviewTab event={event} onNavigateTab={setActiveTab} />
        </div>

        <div
          role="tabpanel"
          id="tabpanel-budget"
          aria-labelledby="tab-budget"
          tabIndex={activeTab === 'budget' ? 0 : -1}
          hidden={activeTab !== 'budget'}
          className="no-print focus:outline-hidden"
        >
          <BudgetTab event={event} onUpdateEvent={handleUpdateEvent} />
        </div>

        <div
          role="tabpanel"
          id="tabpanel-timeline"
          aria-labelledby="tab-timeline"
          tabIndex={activeTab === 'timeline' ? 0 : -1}
          hidden={activeTab !== 'timeline'}
          className="no-print focus:outline-hidden"
        >
          <TimelineTab event={event} onUpdateEvent={handleUpdateEvent} />
        </div>

        <div
          role="tabpanel"
          id="tabpanel-vendors"
          aria-labelledby="tab-vendors"
          tabIndex={activeTab === 'vendors' ? 0 : -1}
          hidden={activeTab !== 'vendors'}
          className="no-print focus:outline-hidden"
        >
          <VendorsTab event={event} onUpdateEvent={handleUpdateEvent} />
        </div>

        <div
          role="tabpanel"
          id="tabpanel-schedule"
          aria-labelledby="tab-schedule"
          tabIndex={activeTab === 'schedule' ? 0 : -1}
          hidden={activeTab !== 'schedule'}
          className="no-print focus:outline-hidden"
        >
          <ScheduleTab event={event} onUpdateEvent={handleUpdateEvent} />
        </div>

        <div
          role="tabpanel"
          id="tabpanel-ideas"
          aria-labelledby="tab-ideas"
          tabIndex={activeTab === 'ideas' ? 0 : -1}
          hidden={activeTab !== 'ideas'}
          className="no-print focus:outline-hidden"
        >
          <IdeasTab event={event} onUpdateEvent={handleUpdateEvent} />
        </div>

        {/* Print Layout (All sections rendered seamlessly in print mode) */}
        <div className="hidden print:block print-page-break space-y-8">
          <div className="border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold">{event.name} — Comprehensive Event Plan</h1>
            <p className="text-sm text-gray-600 mt-1">
              Date: {event.date} • Location: {event.location} • Headcount: {event.guestCount} guests • Planned Budget: {event.currency} {event.totalBudget}
            </p>
          </div>

          <div className="space-y-6">
            <OverviewTab event={event} onNavigateTab={() => {}} />
            <ScheduleTab event={event} onUpdateEvent={() => {}} />
            <BudgetTab event={event} onUpdateEvent={() => {}} />
            <TimelineTab event={event} onUpdateEvent={() => {}} />
            <VendorsTab event={event} onUpdateEvent={() => {}} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print mt-auto py-6 border-t border-[#E5DFD5] bg-[#FFFFFF] text-center text-xs text-[#64746D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <strong>Gatherly AI</strong> — Event Workspace #{event.id}
          </p>
          <p className="text-[11px] text-[#8E9E96]">
            Browser Local Storage • Reconciled Integer Arithmetic • Production MVP
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-8">
          <div className="w-8 h-8 border-3 border-[#1C3F30] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-[#64746D] font-medium">Opening event workspace...</p>
        </div>
      }
    >
      <WorkspaceContent params={params} />
    </Suspense>
  );
}
