'use client';

import React from 'react';
import { Calendar, DollarSign, CheckCircle2, Clock } from 'lucide-react';
import { EventDetails } from '@/types/event';
import { formatCurrency } from '@/lib/budget/calculator';

interface StatsOverviewProps {
  events: EventDetails[];
}

export default function StatsOverview({ events }: StatsOverviewProps) {
  if (events.length === 0) return null;

  // Aggregate calculations
  const totalEvents = events.length;
  
  // Total planned budget
  const totalPlannedBudget = events.reduce((sum, e) => sum + (e.totalBudget || 0), 0);
  const primaryCurrency = events[0]?.currency || 'INR';

  // Task metrics across all events
  let totalTasks = 0;
  let completedTasks = 0;
  events.forEach((e) => {
    if (e.plan?.timelineTasks) {
      totalTasks += e.plan.timelineTasks.length;
      completedTasks += e.plan.timelineTasks.filter((t) => t.status === 'done').length;
    }
  });

  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Upcoming closest event
  const sortedByDate = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const nextEvent = sortedByDate[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Planned Events */}
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#64746D] uppercase tracking-wider">
            Active Celebrations
          </span>
          <div className="p-2 rounded-lg bg-[#E8F0EB] text-[#1C3F30]">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-[#1E2922]">{totalEvents}</span>
          <span className="text-xs text-[#64746D]">
            {totalEvents === 1 ? 'event saved' : 'events saved'}
          </span>
        </div>
      </div>

      {/* Total Planned Budget */}
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#64746D] uppercase tracking-wider">
            Total Planned Budget
          </span>
          <div className="p-2 rounded-lg bg-[#FDF1EB] text-[#C85A32]">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-[#1E2922]">
            {formatCurrency(totalPlannedBudget, primaryCurrency)}
          </span>
        </div>
      </div>

      {/* Task Completion Progress */}
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#64746D] uppercase tracking-wider">
            Overall Task Progress
          </span>
          <div className="p-2 rounded-lg bg-[#EDF7F0] text-[#2E7D47]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl font-bold text-[#1E2922]">{completionPercent}%</span>
            <span className="text-xs text-[#64746D]">
              {completedTasks}/{totalTasks} tasks done
            </span>
          </div>
          <div className="w-full bg-[#F4EFEB] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#2E7D47] h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Next Up Event */}
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#64746D] uppercase tracking-wider">
            Next Celebration
          </span>
          <div className="p-2 rounded-lg bg-[#FEF6EB] text-[#B46B08]">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-base font-semibold text-[#1E2922] line-clamp-1">
            {nextEvent?.name || 'None'}
          </span>
          <span className="text-xs text-[#64746D]">
            {nextEvent ? `${nextEvent.date} (${nextEvent.location})` : 'Create your first event'}
          </span>
        </div>
      </div>
    </div>
  );
}
