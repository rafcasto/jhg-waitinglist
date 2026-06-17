import { NextResponse } from "next/server";
import { upsertLead, insertQuizResponse, getQuizConfig } from "@/lib/supabase";
import { scoreAnswers } from "@/lib/content";
import { DEFAULT_CONFIG, TAGS } from "@/lib/defaults";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const first_name = (body.first_name || "").trim();
    const last_name = (body.last_name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const source = (body.source || "").trim() || "direct";
    const answers = body.answers;

    if (!first_name || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Missing name or email — join the waiting list first." },
        { status: 400 }
      );
    }

    let config = null;
    try {
      config = await getQuizConfig();
    } catch (e) {
      console.error("[quiz] config read failed, using defaults", e);
    }
    const cfg = config || DEFAULT_CONFIG;

    if (
      !Array.isArray(answers) ||
      answers.length !== cfg.questions.length ||
      answers.some((a) => !a?.question || !a?.answer)
    ) {
      return NextResponse.json(
        { error: "Please answer every question." },
        { status: 400 }
      );
    }

    // Internal lead-qualification score, computed server-side from the stored
    // config so it can't be tampered with. Stored, never returned to the client.
    const { score, max_score } = scoreAnswers(cfg.questions, answers);

    // Lead moves to activation with the quiz tag, carrying its qualification score
    await upsertLead({
      first_name,
      last_name: last_name || null,
      email,
      stage: "activation",
      tag: TAGS.QUIZ,
      source,
      score,
    });

    // Best-effort: store raw answers + qualification score (won't block delivery)
    try {
      await insertQuizResponse({
        email,
        answers: { items: answers, score, max_score },
        source,
      });
    } catch (e) {
      console.error("[quiz] response storage failed (non-blocking)", e);
    }

    return NextResponse.json({ ok: true, magnet_url: cfg.lead_magnet_url });
  } catch (err) {
    console.error("[quiz]", err);
    return NextResponse.json(
      { error: "Something went wrong on our side. Please try again." },
      { status: 500 }
    );
  }
}
