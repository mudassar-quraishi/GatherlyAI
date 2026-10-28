'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowRight, Trash2, CheckSquare } from 'lucide-react';
import { EventDetails } from '@/types/event';
import { formatCurrency } from '@/lib/budget/calculator';
import { calculateReadinessScore } from '@/lib/readiness/calculator';

interface EventCardProps {
  event: EventDetails;
  onDelete: (id: string, name: string) => void;
}

export default function EventCard({ event, onDelete }: EventCardProps) {
  const readiness = calculateReadinessScore(event);
  const tasks = event.plan?.timelineTasks || [];
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const taskPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Readiness badge color
  const getRatingBadgeClass = () => {
    switch (readiness.rating) {
      case 'ready':
        return 'bg-[#EDF7F0] text-[#2E7D47] border-[#B7E4C7]';
      case 'well-prepared':
        return 'bg-[#E8F0EB] text-[#1C3F30] border-[#B2D1BE]';
      case 'on-track':
        return 'bg-[#FEF6EB] text-[#B46B08] border-[#FCD34D]';
      default:
        return 'bg-[#F4EFEB] text-[#64746D] border-[#E5DFD5]';
    }
  };

  const getEventTypeBadgeClass = () => {
    switch (event.eventType) {
      case 'wedding':
        return 'bg-[#FDF1EB] text-[#C85A32]';
      case 'birthday':
        return 'bg-[#FEF6EB] text-[#B46B08]';
      case 'community':
        return 'bg-[#E8F0EB] text-[#1C3F30]';
      default:
        return 'bg-[#F4EFEB] text-[#1E2922]';
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E5DFD5] hover:border-[#1C3F30]/40 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top badges */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${getEventTypeBadgeClass()}`}
            >
              {event.eventType}
            </span>
            {event.isSample && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FEF6EB] text-[#B46B08] border border-[#FCD34D]">
                Demo Sample
              </span>
            )}
          </div>

          <div
            className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getRatingBadgeClass()}`}
            title="Preparation Readiness Score"
          >
            {readiness.score}% Ready
          </div>
        </div>

        {/* Event Name */}
        <Link href={`/events/${event.id}`}>
          <h3 className="text-lg font-bold text-[#1E2922] group-hover:text-[#1C3F30] transition-colors leading-snug line-clamp-1">
            {event.name}
          </h3>
        </Link>
        <p className="text-xs text-[#64746D] mt-1 line-clamp-1 italic">
          {event.styleTheme || event.atmosphere || 'Custom planning'}
        </p>

        {/* Meta details */}
        <div className="mt-4 space-y-2 text-xs text-[#64746D]">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-[#1C3F30]" />
            <span>{event.date}</span>
            <span className="text-[#CDC5B7]">•</span>
            <span>{event.duration}</span>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-[#1C3F30]" />
            <span className="line-clamp-1">{event.location}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-[#1C3F30]" />
              <span>{event.guestCount} guests</span>
            </div>
            <span className="font-semibold text-sm text-[#1E2922]">
              {formatCurrency(event.totalBudget, event.currency)}
            </span>
          </div>
        </div>

        {/* Task progress mini bar */}
        {tasks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#F4EFEB]">
            <div className="flex items-center justify-between text-xs text-[#64746D] mb-1">
              <span className="flex items-center space-x-1">
                <CheckSquare className="w-3 h-3 text-[#2E7D47]" />
                <span>Tasks</span>
              </span>
              <span>
                {completedTasks}/{tasks.length} ({taskPercent}%)
              </span>
            </div>
            <div className="w-full bg-[#F4EFEB] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#2E7D47] h-full rounded-full transition-all duration-300"
                style={{ width: `${taskPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3 border-t border-[#E5DFD5] flex items-center justify-between">
        <button
          onClick={() => onDelete(event.id, event.name)}
          className="text-[#64746D] hover:text-[#C0392B] p-1.5 rounded-lg hover:bg-[#FDF0ED] transition-colors focus:outline-none"
          title="Delete event"
          aria-label={`Delete ${event.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1C3F30] hover:text-[#153226] group-hover:translate-x-0.5 transition-all"
        >
          <span>Open Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
