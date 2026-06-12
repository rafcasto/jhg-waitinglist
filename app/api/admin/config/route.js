import { NextResponse } from "next/server";
import { getQuizConfig, saveQuizConfig } from "@/lib/supabase";
import { DEFAULT_CONFIG } from "@/lib/defaults";

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false; // refuse everything until a password is set
  const given = req.headers.get("x-admin-password") || "";
  return given.length > 0 && given === expected;
}

export async function GET(req) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let config = null;
  try {
    config = await getQuizConfig();
  } catch (e) {
    console.error("[admin/config] read failed, using defaults", e);
  }
  return NextResponse.json({ config: config || DEFAULT_CONFIG });
}

export async function PUT(req) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { config } = await req.json();

    // Validate shape
    if (
      !config ||
      typeof config.lead_magnet_url !== "string" ||
      !config.lead_magnet_url.startsWith("http") ||
      !Array.isArray(config.questions) ||
      config.questions.length === 0 ||
      config.questions.some(
        (q) =>
          !q?.text?.trim() ||
          !Array.isArray(q.options) ||
          q.options.filter((o) => o?.trim()).length < 2
      )
    ) {
      return NextResponse.json(
        { error: "Invalid config: need a valid URL and every question needs text plus at least 2 answer options." },
        { status: 400 }
      );
    }

    const clean = {
      quiz_title: (config.quiz_title || DEFAULT_CONFIG.quiz_title).trim(),
      quiz_subtitle: (config.quiz_subtitle || DEFAULT_CONFIG.quiz_subtitle).trim(),
      unlock_label: (config.unlock_label || DEFAULT_CONFIG.unlock_label).trim(),
      lead_magnet_url: config.lead_magnet_url.trim(),
      questions: config.questions.map((q, i) => ({
        id: q.id || `q${i + 1}`,
        text: q.text.trim(),
        options: q.options.map((o) => o.trim()).filter(Boolean),
      })),
    };

    await saveQuizConfig(clean);
    return NextResponse.json({ ok: true, config: clean });
  } catch (err) {
    console.error("[admin/config]", err);
    return NextResponse.json(
      { error: "Could not save config. Did you run supabase/migration.sql?" },
      { status: 500 }
    );
  }
}
