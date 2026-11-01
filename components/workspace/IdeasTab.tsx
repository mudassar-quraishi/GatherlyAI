'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Lightbulb,
  ShieldAlert,
  Send,
  Leaf,
  DollarSign,
  CloudRain,
  Users,
  Smile,
  CheckCircle2,
} from 'lucide-react';
import { EventDetails } from '@/types/event';

interface IdeasTabProps {
  event: EventDetails;
  onUpdateEvent: (updated: Partial<EventDetails>) => void;
}

export default function IdeasTab({ event, onUpdateEvent }: IdeasTabProps) {
  const plan = event.plan;
  const ideas = plan?.personalizedIdeas || [];
  const contingencies = plan?.risksAndContingencies || [];

  const [isRefining, setIsRefining] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [refinementSuccessNotice, setRefinementSuccessNotice] = useState<string | null>(null);

  const refinementPresets = [
    {
      id: 'budget-friendly',
      label: 'More Budget-Friendly',
      icon: DollarSign,
      desc: 'Optimize vendor allocations and suggest high-impact low-cost alternatives.',
    },
    {
      id: 'more-elegant',
      label: 'Elevate Elegance & Luxury',
      icon: Sparkles,
      desc: 'Infuse refined styling, sophisticated lighting, and curated hospitality moments.',
    },
    {
      id: 'eco-friendly',
      label: 'Eco-Friendly & Zero-Waste',
      icon: Leaf,
      desc: 'Compostable dining, plantable favors, and sustainable local sourcing.',
    },
    {
      id: 'rain-contingency',
      label: 'Strengthen Rain Contingency',
      icon: CloudRain,
      desc: 'Comprehensive inclement weather backups, tenting, and indoor run sheets.',
    },
    {
      id: 'child-friendly',
      label: 'Family & Child-Friendly',
      icon: Smile,
      desc: 'Special activities, designated quiet zones, and kid-approved catering.',
    },
    {
      id: 'smaller-guest-list',
      label: 'Intimate Small Gathering',
      icon: Users,
      desc: 'Streamlined seating, personal storytelling, and reduced bulk logistics.',
    },
  ];

  const handleExecuteRefinement = async (type: string, promptText?: string) => {
    if (!plan || isRefining) return;
    setIsRefining(true);
    setRefinementSuccessNotice(null);

    try {
      const res = await fetch('/api/refine-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modificationType: type,
          customPrompt: promptText,
          eventDetails: {
            name: event.name,
            eventType: event.eventType,
            date: event.date,
            location: event.location,
            guestCount: event.guestCount,
            totalBudget: event.totalBudget,
            currency: event.currency,
            styleTheme: event.styleTheme,
            venueType: event.venueType,
            atmosphere: event.atmosphere,
            priorities: event.priorities,
            dietaryRequirements: event.dietaryRequirements,
            accessibilityRequirements: event.accessibilityRequirements,
            specialActivities: event.specialActivities,
            additionalNotes: event.additionalNotes,
          },
          currentPlan: plan,
        }),
      });

      const data = await res.json();
      if (data.success && data.plan) {
        onUpdateEvent({
          plan: data.plan,
        });
        setRefinementSuccessNotice(
          data.notice || `Plan successfully refined for: "${type.replace('-', ' ')}"`
        );
        setTimeout(() => setRefinementSuccessNotice(null), 5000);
      } else {
        alert(data.error || 'Failed to refine plan. Please try again.');
      }
    } catch (err) {
      console.error('Refinement error:', err);
      alert('Network error while refining plan. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  if (!plan) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-12 text-center">
        <Lightbulb className="w-12 h-12 text-[#64746D] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[#1E2922]">No Ideas Plan Available</h3>
        <p className="text-xs text-[#64746D] mt-1">
          Generate an AI or sample plan to establish personalized event ideas and contingencies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* AI Plan Refinement Control Center */}
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center space-x-2 text-[#1C3F30] mb-2">
          <Sparkles className="w-5 h-5 text-[#C85A32]" />
          <h3 className="text-base font-bold uppercase tracking-wider text-[#1C3F30]">
            AI Plan Refinement Studio
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-[#64746D] mb-6">
          Request real-time plan modifications. The AI engine recalculates allocations, vendor recommendations, and activities while preserving your existing budget ceiling.
        </p>
        <p className="text-xs text-[#64746D] mb-6">
          With live Gemini enabled, Gatherly sends event details (including style, priorities, food and accessibility needs, activities, and host notes), the plan summary, budget categories, task and vendor progress, run sheet, and your refinement request to Google. Avoid including sensitive personal details.
        </p>

        {refinementSuccessNotice && (
          <div className="mb-6 p-4 rounded-xl bg-[#EDF7F0] border border-[#B7E4C7] text-[#2E7D47] text-xs sm:text-sm flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{refinementSuccessNotice}</span>
          </div>
        )}

        {/* Refinement Preset Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {refinementPresets.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={isRefining}
                onClick={() => handleExecuteRefinement(preset.id)}
                className="p-4 rounded-xl text-left border border-[#E5DFD5] hover:border-[#1C3F30] bg-[#FAF8F5] hover:bg-[#FFFFFF] transition-all disabled:opacity-50 group"
              >
                <div className="flex items-center space-x-2.5 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-[#E8F0EB] text-[#1C3F30] group-hover:bg-[#1C3F30] group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-xs sm:text-sm text-[#1E2922]">
                    {preset.label}
                  </span>
                </div>
                <p className="text-[11px] text-[#64746D] line-clamp-2 leading-relaxed">
                  {preset.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Custom refinement input */}
        <div className="pt-4 border-t border-[#F4EFEB]">
          <label htmlFor="custom-refinement" className="block text-xs font-bold text-[#1E2922] uppercase tracking-wide mb-2">
            Custom Refinement Instruction
          </label>
          <div className="flex gap-2">
            <input
              id="custom-refinement"
              type="text"
              maxLength={600}
              aria-describedby="custom-refinement-help"
              disabled={isRefining}
              placeholder="e.g. Focus on traditional Rajasthani folk music and reduce fireworks allocation..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#1C3F30] focus:outline-none"
            />
            <button
              onClick={() => handleExecuteRefinement('custom', customPrompt)}
              disabled={isRefining || !customPrompt.trim()}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-[#1C3F30] hover:bg-[#153226] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {isRefining ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isRefining ? 'Refining...' : 'Refine'}</span>
            </button>
          </div>
          <p id="custom-refinement-help" className="mt-2 text-[11px] text-[#64746D]">
            Up to 600 characters. Live Gemini receives this instruction when it refines your plan.
          </p>
        </div>
      </div>

      {/* Personalized Ideas Grid */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-serif font-bold text-[#1E2922]">
            Personalized Inspiration & Curated Touches
          </h3>
          <p className="text-xs text-[#64746D] mt-0.5">
            Tailored suggestions designed specifically for your {event.eventType} in {event.location}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 shadow-sm hover:border-[#1C3F30]/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#C85A32] uppercase tracking-wider">
                    {idea.category}
                  </span>
                  {idea.tags && (
                    <div className="flex gap-1">
                      {idea.tags.map((t, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-[#F4EFEB] text-[#64746D] font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <h4 className="text-base font-bold text-[#1E2922] mb-2">{idea.title}</h4>
                <p className="text-xs text-[#64746D] leading-relaxed mb-4">{idea.description}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5DFD5]/60 text-xs text-[#1E2922]">
                <strong className="text-[#1C3F30] font-semibold">Why this fits your event: </strong>
                <span className="text-[#64746D]">{idea.whyItFits}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risks & Contingencies Card */}
      {contingencies.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center space-x-2 text-[#B46B08] mb-4">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-base font-bold uppercase tracking-wider text-[#1E2922]">
              Risks & Contingency Mitigation
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contingencies.map((c, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FEF6EB] text-[#B46B08]">
                      {c.severity} severity
                    </span>
                  </div>
                  <h5 className="font-semibold text-xs text-[#1E2922] mt-1">{c.risk}</h5>
                </div>
                <p className="text-xs text-[#64746D] leading-relaxed pt-2 border-t border-[#E5DFD5]/50">
                  <strong className="text-[#1C3F30] font-semibold">Action Plan: </strong>
                  {c.plan}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
