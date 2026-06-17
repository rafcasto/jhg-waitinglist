import { NextResponse } from "next/server";
import { getEditor } from "@/lib/auth";
import { countRows, selectRows, getQuizConfig } from "@/lib/supabase";
import { normalizeQuestions, scoreAnswers } from "@/lib/content";
import { DEFAULT_CONFIG, TAGS } from "@/lib/defaults";

// Pull the answer items + score out of a stored response row, tolerating both
// the old shape (answers = array) and the new shape (answers = {items,score}).
function unpack(row, questions) {
  const stored = row.answers;
  const items = Array.isArray(stored) ? stored : stored?.items || [];
  const score =
    stored && !Array.isArray(stored) && typeof stored.score === "number"
      ? stored.score
      : scoreAnswers(questions, items).score;
  return { items, score };
}

export async function GET(req) {
  if (!(await getEditor(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let cfg = null;
    try {
      cfg = await getQuizConfig();
    } catch {
      /* fall back to defaults */
    }
    const questions = normalizeQuestions((cfg || DEFAULT_CONFIG).questions);
    const maxScore = questions.reduce(
      (sum, q) => sum + (q.options.length ? Math.max(...q.options.map((o) => o.points)) : 0),
      0
    );

    // Funnel metrics are scoped to the waitlist→quiz tags so the completion
    // rate is meaningful (not diluted by the rest of the CRM list).
    const enc = (t) => encodeURIComponent(t);
    const [waitlistJoins, quizCompletions, responses] = await Promise.all([
      countRows(`jobhackers_leads?select=id&tag=eq.${enc(TAGS.WAITLIST)}`),
      countRows(`jobhackers_leads?select=id&tag=eq.${enc(TAGS.QUIZ)}`),
      selectRows(
        "jobhackers_quiz_responses?select=email,answers,source,created_at&order=created_at.desc&limit=200"
      ),
    ]);

    // Score every response (for averages) and remember the latest 10
    const scored = responses.map((r) => ({ ...r, ...unpack(r, questions) }));
    const avgScore = scored.length
      ? scored.reduce((s, r) => s + r.score, 0) / scored.length
      : 0;

    // Per-question averages ("benchmark lines")
    const questionAverages = questions.map((q) => {
      const pts = [];
      for (const r of scored) {
        const picked = r.items.find((a) => a?.question === q.text);
        const opt = picked && q.options.find((o) => o.label === picked.answer);
        if (opt) pts.push(opt.points);
      }
      const avg = pts.length ? pts.reduce((a, b) => a + b, 0) / pts.length : 0;
      return { label: q.text, avg: Math.round(avg * 100) / 100 };
    });

    // Recent submissions — join names/locations from the leads table
    const recentRows = scored.slice(0, 10);
    const emails = [...new Set(recentRows.map((r) => (r.email || "").toLowerCase()))].filter(Boolean);
    let leadMap = {};
    if (emails.length) {
      const inList = encodeURIComponent(emails.map((e) => `"${e}"`).join(","));
      const leads = await selectRows(
        `jobhackers_leads?select=email,first_name,last_name,location&email=in.(${inList})`
      );
      leadMap = Object.fromEntries(leads.map((l) => [(l.email || "").toLowerCase(), l]));
    }
    const recent = recentRows.map((r) => {
      const lead = leadMap[(r.email || "").toLowerCase()] || {};
      const name =
        [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() ||
        (r.email || "").split("@")[0];
      return {
        name,
        email: r.email,
        location: lead.location || "—",
        source: r.source || "direct",
        score: r.score,
        date: r.created_at,
      };
    });

    return NextResponse.json({
      kpis: {
        waitlistJoins,
        completions: quizCompletions,
        completionRate: waitlistJoins
          ? Math.min(100, Math.round((quizCompletions / waitlistJoins) * 100))
          : 0,
        avgScore: Math.round(avgScore * 10) / 10,
        maxScore,
      },
      questionAverages,
      recent,
    });
  } catch (err) {
    console.error("[admin/dashboard]", err);
    return NextResponse.json({ error: "Could not load the dashboard." }, { status: 500 });
  }
}
