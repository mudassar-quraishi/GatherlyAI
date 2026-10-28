'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, PlusCircle, Compass, HeartHandshake, CheckCircle2 } from 'lucide-react';

interface EmptyDashboardProps {
  onLoadDemo: () => void;
}

export default function EmptyDashboard({ onLoadDemo }: EmptyDashboardProps) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-8 sm:p-12 text-center shadow-sm max-w-3xl mx-auto my-8">
      {/* Decorative Icon */}
      <div className="w-16 h-16 rounded-2xl bg-[#E8F0EB] text-[#1C3F30] flex items-center justify-center mx-auto mb-6 shadow-inner">
        <Sparkles className="w-8 h-8 text-[#1C3F30]" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E2922] mb-3">
        Welcome to Gatherly AI
      </h2>
      <p className="text-sm sm:text-base text-[#64746D] max-w-xl mx-auto mb-8 leading-relaxed">
        Your personal celebration and event coordinator. Plan weddings, milestone birthdays, and community gatherings with intelligent budgets, date-aware timelines, and practical vendor checklists.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
        <Link
          href="/events/new"
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-[#1C3F30] hover:bg-[#153226] text-white text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1C3F30] focus:ring-offset-2"
        >
          <PlusCircle className="w-4 h-4 text-[#FDF1EB]" />
          <span>Create an Event Plan</span>
        </Link>

        <button
          onClick={onLoadDemo}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-[#FDF1EB] hover:bg-[#FBE5DC] text-[#C85A32] text-sm font-semibold border border-[#F6D0C1] transition-all focus:outline-none focus:ring-2 focus:ring-[#C85A32] focus:ring-offset-2"
        >
          <Compass className="w-4 h-4 text-[#C85A32]" />
          <span>Explore Sample Event (1-Click Demo)</span>
        </button>
      </div>

      {/* Value pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-[#F4EFEB] text-left">
        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-[#EDF7F0] text-[#2E7D47] mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1E2922] uppercase tracking-wide">
              Balanced Budgets
            </h4>
            <p className="text-xs text-[#64746D] mt-1">
              Integer-precise minor units calculation with automated contingency reserves and category warnings.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-[#E8F0EB] text-[#1C3F30] mt-0.5">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1E2922] uppercase tracking-wide">
              Date-Aware Timeline
            </h4>
            <p className="text-xs text-[#64746D] mt-1">
              Preparation milestones anchored to your event date with realistic stages and timezone-safe planning.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-[#FEF6EB] text-[#B46B08] mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1E2922] uppercase tracking-wide">
              Actionable Guidance
            </h4>
            <p className="text-xs text-[#64746D] mt-1">
              Detailed vendor requirements and run sheets with live Gemini AI or deterministic demo mode.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
