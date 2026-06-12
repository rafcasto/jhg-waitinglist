// Server-only Supabase REST helpers.
// The service-role key bypasses RLS, so it lives in server env vars ONLY
// and every write goes through a Next.js API route. The browser never
// sees a Supabase key.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnv() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars. Copy .env.local.example to .env.local and fill them in."
    );
  }
}

async function rest(path, { method = "GET", body, headers = {} } = {}) {
  assertEnv();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${method} /${path} -> ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Insert-or-update a lead. The table has a unique constraint on
 * (email, tag, stage), so re-submissions merge instead of erroring.
 */
export async function upsertLead(lead) {
  return rest("jobhackers_leads?on_conflict=email,tag,stage", {
    method: "POST",
    body: lead,
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  });
}

/** Best-effort raw answer storage (jobhackers_quiz_responses). */
export async function insertQuizResponse(row) {
  return rest("jobhackers_quiz_responses", {
    method: "POST",
    body: row,
    headers: { Prefer: "return=minimal" },
  });
}

/** Single-row config table (id = 1). Returns the JSON config or null. */
export async function getQuizConfig() {
  const rows = await rest("jobhackers_quiz_config?id=eq.1&select=data");
  return rows?.[0]?.data ?? null;
}

export async function saveQuizConfig(data) {
  return rest("jobhackers_quiz_config?on_conflict=id", {
    method: "POST",
    body: { id: 1, data },
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  });
}
