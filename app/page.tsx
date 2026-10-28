'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/ui/Navbar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsOverview from '@/components/dashboard/StatsOverview';
import EventCard from '@/components/dashboard/EventCard';
import EmptyDashboard from '@/components/dashboard/EmptyDashboard';
import { EventDetails } from '@/types/event';
import { eventStorage } from '@/lib/storage/eventStorage';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const loadEvents = () => {
    const loaded = eventStorage.getAllEvents();
    setEvents(loaded);
    setIsLoaded(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEvents();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const triggerToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleLoadDemo = () => {
    const demoEvent = eventStorage.loadDemoEvent();
    loadEvents();
    triggerToast(`Loaded sample demo event: "${demoEvent.name}"`);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    eventStorage.deleteEvent(deleteTarget.id);
    loadEvents();
    triggerToast(`Event "${deleteTarget.name}" deleted.`, 'info');
    setDeleteTarget(null);
  };

  const handleResetConfirm = () => {
    eventStorage.resetAllEvents();
    loadEvents();
    triggerToast('All saved events cleared.', 'info');
    setShowResetConfirm(false);
  };

  const filteredEvents = events.filter((e) => {
    if (selectedFilter === 'all') return true;
    return e.eventType === selectedFilter;
  });

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

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <Navbar />

      {/* Floating Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl bg-[#1C3F30] text-white shadow-lg text-sm transition-all animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#B7E4C7]" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center space-x-3 text-[#C0392B] mb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Delete Event Plan</h3>
            </div>
            <p className="text-sm text-[#64746D] mb-6">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#1E2922]">&ldquo;{deleteTarget.name}&rdquo;</strong>? All associated
              budget allocations, timeline tasks, vendor checklists, and schedules will be removed.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#64746D] hover:bg-[#F4EFEB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#C0392B] hover:bg-[#A93226] shadow-sm transition-colors"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center space-x-3 text-[#C0392B] mb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Reset All Events</h3>
            </div>
            <p className="text-sm text-[#64746D] mb-6">
              This will clear all events saved in your browser localStorage. Are you sure you wish to proceed?
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#64746D] hover:bg-[#F4EFEB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#C0392B] hover:bg-[#A93226] shadow-sm transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <DashboardHeader
          onLoadDemo={handleLoadDemo}
          onReset={() => setShowResetConfirm(true)}
          eventCount={events.length}
        />

        {events.length === 0 ? (
          <EmptyDashboard onLoadDemo={handleLoadDemo} />
        ) : (
          <div>
            <StatsOverview events={events} />

            {/* Filter pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-6 text-xs sm:text-sm">
              {['all', 'wedding', 'birthday', 'anniversary', 'community', 'fundraiser'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full capitalize font-medium transition-colors whitespace-nowrap ${
                    selectedFilter === f
                      ? 'bg-[#1C3F30] text-white shadow-xs'
                      : 'bg-[#FFFFFF] text-[#64746D] hover:bg-[#F4EFEB] border border-[#E5DFD5]'
                  }`}
                >
                  {f === 'all' ? 'All Celebrations' : f}
                </button>
              ))}
            </div>

            {/* Event Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onDelete={(id, name) => setDeleteTarget({ id, name })}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print mt-auto py-6 border-t border-[#E5DFD5] bg-[#FFFFFF] text-center text-xs text-[#64746D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            <strong>Gatherly AI</strong> — Every celebration, thoughtfully planned.
          </p>
          <p className="text-[11px] text-[#8E9E96]">
            Browser-local persistence • Dual GenAI & Demo engine • Hackathon MVP
          </p>
        </div>
      </footer>
    </div>
  );
}
