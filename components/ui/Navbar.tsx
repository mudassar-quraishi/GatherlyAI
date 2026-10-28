'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const [aiStatus, setAiStatus] = useState<{ liveAiConfigured: boolean; modelName: string } | null>(null);

  useEffect(() => {
    // Fetch AI Status asynchronously
    fetch('/api/ai-status')
      .then((res) => res.json())
      .then((data) => setAiStatus(data))
      .catch(() => setAiStatus({ liveAiConfigured: false, modelName: 'Demo Provider' }));
  }, []);

  return (
    <nav className="no-print bg-[#FFFFFF] border-b border-[#E5DFD5] sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#1C3F30] flex items-center justify-center text-white shadow-sm group-hover:bg-[#153226] transition-colors">
                <Sparkles className="w-5 h-5 text-[#FDF1EB]" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-lg text-[#1C3F30] tracking-tight leading-none">
                  Gatherly<span className="text-[#C85A32]">.ai</span>
                </span>
                <span className="text-[10px] text-[#64746D] font-medium tracking-wide">
                  Celebration Planning Studio
                </span>
              </div>
            </Link>
          </div>

          {/* AI Capability Pill & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {aiStatus && (
              <div
                className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  aiStatus.liveAiConfigured
                    ? 'bg-[#EDF7F0] text-[#2E7D47] border-[#B7E4C7]'
                    : 'bg-[#FEF6EB] text-[#B46B08] border-[#FCD34D]'
                }`}
                title={
                  aiStatus.liveAiConfigured
                    ? `Live Gemini AI active (${aiStatus.modelName})`
                    : 'Running in deterministic Demo Mode (no API key configured)'
                }
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    aiStatus.liveAiConfigured ? 'bg-[#2E7D47] animate-pulse' : 'bg-[#B46B08]'
                  }`}
                />
                <span>{aiStatus.liveAiConfigured ? 'Gemini 2.5 Active' : 'Demo Mode (Deterministic)'}</span>
              </div>
            )}

            <Link
              href="/"
              className="text-xs sm:text-sm font-medium text-[#1E2922] hover:text-[#1C3F30] px-3 py-1.5 rounded-lg hover:bg-[#F4EFEB] transition-colors"
            >
              Dashboard
            </Link>

            <Link
              href="/events/new"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#1C3F30] hover:bg-[#153226] text-white text-xs sm:text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1C3F30] focus:ring-offset-1"
            >
              <PlusCircle className="w-4 h-4 text-[#FDF1EB]" />
              <span>Create Event</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
