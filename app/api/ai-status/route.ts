import { NextResponse } from 'next/server';
import { isGeminiConfigured } from '@/lib/ai/geminiService';


export async function GET() {
  const configured = isGeminiConfigured();
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  return NextResponse.json({
    liveAiConfigured: configured,
    modelName: configured ? model : 'Deterministic Demo Provider',
    demoModeAvailable: true,
  });
}
