// Page-content + quiz helpers. The editable copy lives inside the quiz config's
// `content` object; these helpers merge whatever is stored with the defaults
// so a missing field never renders blank.

import { getQuizConfig } from "./supabase";
import { DEFAULT_CONFIG } from "./defaults";

/** Merge stored content over the defaults so every field is always present. */
export function mergeContent(config) {
  return { ...DEFAULT_CONFIG.content, ...(config?.content || {}) };
}

/** Server-side: load merged content, never throwing (falls back to defaults). */
export async function loadContent() {
  try {
    const config = await getQuizConfig();
    return mergeContent(config);
  } catch (e) {
    console.error("[content] read failed, using defaults", e);
    return DEFAULT_CONFIG.content;
  }
}

/** Replace {first_name} / {total} / {score} style tokens in a copy string. */
export function fillTokens(str, tokens = {}) {
  if (typeof str !== "string") return str;
  return str.replace(/\{(\w+)\}/g, (m, key) =>
    tokens[key] != null ? String(tokens[key]) : m
  );
}

/**
 * Normalize questions so every option is { label, points }.
 * Tolerates the old shape where options were plain strings.
 */
export function normalizeQuestions(questions = []) {
  return (questions || []).map((q, i) => ({
    id: q.id || `q${i + 1}`,
    text: q.text || "",
    options: (q.options || []).map((o) =>
      typeof o === "string"
        ? { label: o, points: 0 }
        : { label: o?.label ?? "", points: Number(o?.points) || 0 }
    ),
  }));
}

/**
 * Score a set of answers against the questions.
 * `answers` is [{ question, answer }] where `answer` is the chosen option label.
 * Returns { score, max_score } where max_score is the best possible total.
 */
export function scoreAnswers(questions, answers = []) {
  const norm = normalizeQuestions(questions);
  let score = 0;
  let max_score = 0;
  for (const q of norm) {
    const pts = q.options.map((o) => o.points);
    max_score += pts.length ? Math.max(...pts) : 0;
    const picked = answers.find((a) => a?.question === q.text);
    const opt = picked && q.options.find((o) => o.label === picked.answer);
    if (opt) score += opt.points;
  }
  return { score, max_score };
}
