'use client';

import React from 'react';
import Link from 'next/link';
import { PlusCircle, Compass, RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  onLoadDemo: () => void;
  onReset: () => void;
  eventCount: number;
}

export default function DashboardHeader({
  onLoadDemo,
  onReset,
  eventCount,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E2922] tracking-tight">
          Celebration Studio
        </h1>
        <p className="text-sm text-[#64746D] mt-1">
          Every celebration, thoughtfully planned. Manage budgets, timelines, suppliers, and schedules.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {eventCount > 0 && (
          <button
            onClick={onReset}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F4EFEB] text-[#64746D] hover:text-[#C0392B] border border-[#E5DFD5] text-xs font-medium transition-colors focus:outline-none"
            title="Reset and clear all saved events"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        )}

        <button
          onClick={onLoadDemo}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#FDF1EB] hover:bg-[#FBE5DC] text-[#C85A32] border border-[#F6D0C1] text-xs sm:text-sm font-medium transition-all focus:outline-none"
          title="Preload curated sample wedding plan"
        >
          <Compass className="w-4 h-4 text-[#C85A32]" />
          <span>Load Demo Event</span>
        </button>

        <Link
          href="/events/new"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#1C3F30] hover:bg-[#153226] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1C3F30] focus:ring-offset-1"
        >
          <PlusCircle className="w-4 h-4 text-[#FDF1EB]" />
          <span>Create an Event</span>
        </Link>
      </div>
    </div>
  );
}
