import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Gatherly AI — Every celebration, thoughtfully planned",
  description:
    "AI-powered personal celebration & event coordinator. Plan weddings, birthdays, anniversaries, and community gatherings with budget management, timelines, vendor checklists, and personalized ideas.",
  keywords: [
    "event planning",
    "wedding coordinator",
    "birthday planner",
    "budget planner",
    "timeline manager",
    "Gatherly AI",
    "GenAI event assistant",
  ],
  authors: [{ name: "Gatherly AI Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-warm-bg text-[#1E2922] selection:bg-[#E8F0EB] selection:text-[#1C3F30]">
        {children}
      </body>
    </html>
  );
}
