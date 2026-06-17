#!/usr/bin/env node
// One-off: backfill the `content` block into jobhackers_quiz_config (id=1).
// Idempotent — only writes content if the row is missing it. Mirrors
// supabase/migration-2-content.sql but runs through PostgREST so it works
// without SQL-editor access.
//
//   node scripts/backfill-content.mjs

import { readFileSync } from "node:fs";

// Kept in sync with lib/defaults.js -> DEFAULT_CONFIG.content
const CONTENT = {
  landing_kicker: "Waiting list · First access",
  footer_tagline: "Get a job you love",
  eyebrow: "JobHackers Global",
  headline: "Get a job you love.",
  headline_strike: "Doors open soon.",
  lede:
    "Escape career limbo. Bypass the application black hole and land the salary you deserve. Join the waiting list to be first through the door when the next cohort opens — plus get an instant bonus the moment you're in.",
  form_tag: "Reserve your spot",
  form_cta: "Join the waiting list →",
  form_fineprint: "No spam, ever. First access + an instant bonus on the next screen.",
  quiz_intro_heading: "You're in, {first_name}. Now unlock your edge.",
  quiz_intro_fineprint: "Takes under 30 seconds. No wrong answers.",
  quiz_unlocked_body:
    "The Five Finger Interview Maximizer is yours — the 5-point system to own any interview, formal or informal. Grab it now, it opens in a new tab.",
  quiz_unlocked_cta: "Get the Five Finger Maximizer →",
  quiz_unlocked_fineprint: "You're on the list. Watch your inbox for first access.",
};

function loadEnvFile(file) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {}
}
loadEnvFile(".env.local");
loadEnvFile(".env");

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!URL || !KEY) {
  console.error("✗ Missing SUPABASE_URL / SUPABASE_SECRET_KEY in .env(.local).");
  process.exit(1);
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};
const base = `${URL}/rest/v1/jobhackers_quiz_config`;

const getRes = await fetch(`${base}?id=eq.1&select=data`, { headers, cache: "no-store" });
if (!getRes.ok) {
  console.error("✗ Read failed:", getRes.status, await getRes.text());
  process.exit(1);
}
const rows = await getRes.json();

if (!rows.length) {
  console.error("✗ No config row (id=1) found. Run supabase/migration.sql first.");
  process.exit(1);
}

const data = rows[0].data || {};
if (data.content) {
  console.log("✓ Already has a content block — nothing to do (idempotent).");
  process.exit(0);
}

const merged = { ...data, content: CONTENT };
const patch = await fetch(`${base}?id=eq.1`, {
  method: "PATCH",
  headers: { ...headers, Prefer: "return=minimal" },
  body: JSON.stringify({ data: merged }),
});
if (!patch.ok) {
  console.error("✗ Update failed:", patch.status, await patch.text());
  process.exit(1);
}
console.log("✓ Content block backfilled into config row (id=1).");
