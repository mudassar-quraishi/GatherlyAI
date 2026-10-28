'use client';

import React from 'react';
import {
  Sparkles,
  Palette,
  DollarSign,
  Calendar,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { EventDetails } from '@/types/event';
import { formatCurrency, calculateBudgetHealth } from '@/lib/budget/calculator';
import { calculateReadinessScore } from '@/lib/readiness/calculator';

interface OverviewTabProps {
  event: EventDetails;
  onNavigateTab: (tabId: string) => void;
}

export default function OverviewTab({ event, onNavigateTab }: OverviewTabProps) {
  const plan = event.plan;
  const readiness = calculateReadinessScore(event);
  const categories = plan?.budgetBreakdown.categories || [];
  const budgetHealth = calculateBudgetHealth(event.totalBudget, categories);

  const tasks = plan?.timelineTasks || [];
  const upcomingTasks = tasks
    .filter((t) => t.status !== 'done')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* AI Event Summary Banner */}
      {plan && (
        <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-2 text-[#1C3F30] mb-3">
            <Sparkles className="w-5 h-5 text-[#C85A32]" />
            <h2 className="text-base font-bold uppercase tracking-wider text-[#1C3F30]">
              Event Vision & Strategic Summary
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#1E2922] leading-relaxed">
            {plan.eventSummary}
          </p>

          {/* Theme & Palette */}
          {plan.themeIdeas && (
            <div className="mt-6 pt-5 border-t border-[#F4EFEB] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-[#C85A32]" />
                  <span className="text-xs font-bold text-[#1E2922] uppercase tracking-wide">
                    Theme: {plan.themeIdeas.name}
                  </span>
                </div>
                <p className="text-xs text-[#64746D] mt-1 max-w-xl">
                  {plan.themeIdeas.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {plan.themeIdeas.vibeKeywords?.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#F4EFEB] text-[#1E2922] text-[11px] font-medium"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Color swatches */}
              <div className="flex flex-col sm:items-end">
                <span className="text-[11px] font-bold text-[#64746D] uppercase tracking-wide mb-1.5">
                  Color Harmony
                </span>
                <div className="flex items-center space-x-2">
                  {plan.themeIdeas.colorPalette?.map((color, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full shadow-inner border border-black/10 transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid of Key Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget Guardian Card */}
        <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#64746D] uppercase tracking-wider">
                Smart Budget Guardian
              </span>
              <div className="p-2 rounded-lg bg-[#E8F0EB] text-[#1C3F30]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1E2922]">
              {formatCurrency(budgetHealth.totalAllocated, event.currency)}
            </div>
            <p className="text-xs text-[#64746D] mt-0.5">
              of {formatCurrency(event.totalBudget, event.currency)} target
            </p>

            <div className="mt-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#64746D]">
                <span>Actual Spent so far:</span>
                <span className="font-semibold text-[#1E2922]">
                  {formatCurrency(budgetHealth.totalSpent, event.currency)}
                </span>
              </div>
              <div className="flex justify-between text-[#64746D]">
                <span>Contingency Reserve:</span>
                <span className="font-semibold text-[#1E2922]">
                  {budgetHealth.contingencyPercent}%
                </span>
              </div>
            </div>

            {budgetHealth.isOverBudget && (
              <div className="mt-3 p-2.5 rounded-xl bg-[#FDF0ED] text-[#C0392B] text-xs font-medium">
                Warning: Actual spending exceeds budget!
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('budget')}
            className="mt-5 inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1C3F30] hover:text-[#153226]"
          >
            <span>Manage Budget Allocations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Readiness Score Breakdown */}
        <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#64746D] uppercase tracking-wider">
                Readiness Score
              </span>
              <div className="p-2 rounded-lg bg-[#FDF1EB] text-[#C85A32]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-[#1C3F30]">{readiness.score}%</span>
              <span className="text-xs font-semibold uppercase text-[#64746D] capitalize">
                ({readiness.rating.replace('-', ' ')})
              </span>
            </div>
            <p className="text-xs text-[#64746D] mt-1">
              Data-driven score based on tasks, vendor confirmations, and schedule.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[#64746D] mb-1">
                  <span>Task Completion:</span>
                  <span>{readiness.details.tasksCompletedPercent}%</span>
                </div>
                <div className="w-full bg-[#F4EFEB] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#2E7D47] h-full"
                    style={{ width: `${readiness.details.tasksCompletedPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#64746D] mb-1">
                  <span>Vendors Confirmed:</span>
                  <span>{readiness.details.vendorsConfirmedPercent}%</span>
                </div>
                <div className="w-full bg-[#F4EFEB] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#C85A32] h-full"
                    style={{ width: `${readiness.details.vendorsConfirmedPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 text-xs text-[#64746D] italic">
            {readiness.suggestions[0]}
          </div>
        </div>

        {/* Priorities & Logistics */}
        <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#64746D] uppercase tracking-wider">
                Event Priorities
              </span>
              <div className="p-2 rounded-lg bg-[#FEF6EB] text-[#B46B08]">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {event.priorities.map((p, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-[#E8F0EB] text-[#1C3F30] text-xs font-medium"
                >
                  ✓ {p}
                </span>
              ))}
            </div>

            {event.dietaryRequirements && (
              <div className="text-xs text-[#64746D] mb-2">
                <strong className="text-[#1E2922]">Dietary:</strong> {event.dietaryRequirements}
              </div>
            )}
            {event.accessibilityRequirements && (
              <div className="text-xs text-[#64746D]">
                <strong className="text-[#1E2922]">Accessibility:</strong>{' '}
                {event.accessibilityRequirements}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('ideas')}
            className="mt-5 inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1C3F30] hover:text-[#153226]"
          >
            <span>Explore Tailored Ideas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Immediate Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#1E2922] flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#1C3F30]" />
              <span>Immediate Next Steps</span>
            </h3>
            <button
              onClick={() => onNavigateTab('timeline')}
              className="text-xs font-semibold text-[#1C3F30] hover:underline"
            >
              View Full Timeline ({tasks.length} total)
            </button>
          </div>

          <div className="divide-y divide-[#F4EFEB]">
            {upcomingTasks.map((t) => (
              <div key={t.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-[#1E2922]">{t.title}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        t.priority === 'high'
                          ? 'bg-[#FDF0ED] text-[#C0392B]'
                          : 'bg-[#FEF6EB] text-[#B46B08]'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-xs text-[#64746D] mt-0.5">{t.description}</p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-xs font-medium text-[#1E2922]">{t.dueDate}</span>
                  <div className="text-[10px] text-[#64746D]">{t.owner || 'Lead Host'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
