import { NextResponse } from "next/server";
import { getQuizConfig } from "@/lib/supabase";
import { mergeContent } from "@/lib/content";
import { DEFAULT_CONFIG } from "@/lib/defaults";

// Public config: questions + copy only. The lead-magnet URL is deliberately
// NOT exposed here — it's only returned by /api/quiz after a completed quiz.
export async function GET() {
  let config = null;
  try {
    config = await getQuizConfig();
  } catch (e) {
    console.error("[config] read failed, using defaults", e);
  }
  const cfg = config || DEFAULT_CONFIG;
  return NextResponse.json({
    quiz_title: cfg.quiz_title,
    quiz_subtitle: cfg.quiz_subtitle,
    unlock_label: cfg.unlock_label,
    questions: cfg.questions,
    content: mergeContent(cfg),
  });
}
