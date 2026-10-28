'use client';

import React, { Suspense } from 'react';
import Navbar from '@/components/ui/Navbar';
import CreateEventWizard from '@/components/events/CreateEventWizard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewEventPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#64746D] hover:text-[#1C3F30] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E2922] mt-2">
            Plan a New Celebration
          </h1>
          <p className="text-xs sm:text-sm text-[#64746D] mt-1">
            Complete the 3-step setup to launch your dedicated event planning workspace.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="p-8 text-center text-xs text-[#64746D]">
              Loading event creation wizard...
            </div>
          }
        >
          <CreateEventWizard />
        </Suspense>
      </main>
    </div>
  );
}
