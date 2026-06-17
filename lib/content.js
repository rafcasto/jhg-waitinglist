// Page-content helpers. The editable copy lives inside the quiz config's
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

/** Replace {first_name} / {total} style tokens in a copy string. */
export function fillTokens(str, tokens = {}) {
  if (typeof str !== "string") return str;
  return str.replace(/\{(\w+)\}/g, (m, key) =>
    tokens[key] != null ? String(tokens[key]) : m
  );
}
