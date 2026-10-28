'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Printer,
  Download,
  Copy,
  Check,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { EventDetails } from '@/types/event';
import { formatCurrency } from '@/lib/budget/calculator';
import { calculateReadinessScore } from '@/lib/readiness/calculator';
import { eventStorage } from '@/lib/storage/eventStorage';

interface WorkspaceHeaderProps {
  event: EventDetails;
  onGeneratePlan: () => void;
  isGenerating: boolean;
  onLoadSamplePlan: () => void;
}

export default function WorkspaceHeader({
  event,
  onGeneratePlan,
  isGenerating,
  onLoadSamplePlan,
}: WorkspaceHeaderProps) {
  const [copied, setCopied] = useState(false);
  const readiness = calculateReadinessScore(event);

  const handleCopySummary = () => {
    const summary = eventStorage.generatePlainTextSummary(event);
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadBackup = () => {
    const jsonStr = eventStorage.exportEventAsJSON(event.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-plan.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#FFFFFF] border-b border-[#E5DFD5] pt-6 pb-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb & Top Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <Link
            href="/"
            className="no-print inline-flex items-center space-x-1.5 text-xs font-semibold text-[#64746D] hover:text-[#1C3F30] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Celebrations</span>
          </Link>

          {/* Export Actions Toolbar */}
          <div className="no-print flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[#E5DFD5] bg-[#FAF8F5] hover:bg-[#F4EFEB] text-xs font-medium text-[#1E2922] transition-colors"
              title="Copy plain-text summary to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#2E7D47]" /> : <Copy className="w-3.5 h-3.5 text-[#64746D]" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[#E5DFD5] bg-[#FAF8F5] hover:bg-[#F4EFEB] text-xs font-medium text-[#1E2922] transition-colors"
              title="Download JSON plan backup"
            >
              <Download className="w-3.5 h-3.5 text-[#64746D]" />
              <span>Backup JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[#E5DFD5] bg-[#FAF8F5] hover:bg-[#F4EFEB] text-xs font-medium text-[#1E2922] transition-colors"
              title="Print event run sheet and plan"
            >
              <Printer className="w-3.5 h-3.5 text-[#64746D]" />
              <span>Print Run Sheet</span>
            </button>
          </div>
        </div>

        {/* Main Title & Status Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full capitalize bg-[#FDF1EB] text-[#C85A32]">
                {event.eventType}
              </span>

              {event.plan ? (
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                    event.plan.generationSource === 'live-ai'
                      ? 'bg-[#EDF7F0] text-[#2E7D47] border-[#B7E4C7]'
                      : 'bg-[#FEF6EB] text-[#B46B08] border-[#FCD34D]'
                  }`}
                >
                  {event.plan.generationSource === 'live-ai'
                    ? `Live Gemini Plan (${event.plan.modelUsed || 'Gemini 2.5'})`
                    : 'Curated Sample Plan (Demo Mode)'}
                </span>
              ) : (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#F4EFEB] text-[#64746D] border border-[#E5DFD5]">
                  Plan Not Generated Yet
                </span>
              )}

              {event.isSample && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FEF6EB] text-[#B46B08]">
                  Demo Workspace
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E2922]">
              {event.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#64746D] mt-0.5">
              {event.styleTheme} • {event.atmosphere}
            </p>
          </div>

          {/* Primary Action & Readiness pill */}
          <div className="no-print flex flex-wrap items-center gap-3">
            <div
              className="bg-[#FAF8F5] border border-[#E5DFD5] px-3.5 py-2 rounded-xl flex items-center space-x-2 text-xs"
              title="Preparation readiness score based on tasks, vendors, and budget balance"
            >
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-[#64746D] uppercase font-bold tracking-wider">
                  Readiness
                </span>
                <span className="font-bold text-[#1C3F30] text-sm">{readiness.score}%</span>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-[#1C3F30] flex items-center justify-center text-[10px] font-bold text-[#1C3F30]">
                {readiness.rating === 'ready'
                  ? 'Ready'
                  : readiness.rating === 'well-prepared'
                  ? 'Good'
                  : readiness.rating === 'on-track'
                  ? 'Track'
                  : 'Early'}
              </div>
            </div>

            {/* AI Generation or Re-generation Button */}
            <button
              onClick={onGeneratePlan}
              disabled={isGenerating}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#1C3F30] hover:bg-[#153226] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1C3F30] focus:ring-offset-1"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#FDF1EB]" />
                  <span>Generating Thoughtful Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#FDF1EB]" />
                  <span>{event.plan ? 'Re-generate Plan with AI' : 'Generate Plan with AI'}</span>
                </>
              )}
            </button>

            {!event.plan && (
              <button
                onClick={onLoadSamplePlan}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-[#FDF1EB] hover:bg-[#FBE5DC] text-[#C85A32] border border-[#F6D0C1] text-xs sm:text-sm font-medium transition-all"
                title="Load curated sample plan immediately without waiting for API"
              >
                <Compass className="w-4 h-4 text-[#C85A32]" />
                <span>Load Sample Plan</span>
              </button>
            )}
          </div>
        </div>

        {/* Metadata Details Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-[#F4EFEB] text-xs text-[#64746D]">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#1C3F30]" />
            <div>
              <div className="font-semibold text-[#1E2922]">{event.date}</div>
              <div className="text-[11px]">{event.duration}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#1C3F30]" />
            <div>
              <div className="font-semibold text-[#1E2922] line-clamp-1">{event.location}</div>
              <div className="text-[11px] capitalize">{event.venueType} Venue</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#1C3F30]" />
            <div>
              <div className="font-semibold text-[#1E2922]">{event.guestCount} Guests</div>
              <div className="text-[11px]">Planned Headcount</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-[#1C3F30]" />
            <div>
              <div className="font-semibold text-[#1E2922]">
                {formatCurrency(event.totalBudget, event.currency)}
              </div>
              <div className="text-[11px]">Total Target Budget</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
