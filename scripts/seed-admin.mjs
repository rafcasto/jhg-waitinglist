#!/usr/bin/env node
// Seed (or update) the admin user in Supabase Auth.
//
//   npm run seed:admin
//
// Reads from .env / .env.local:
//   SUPABASE_URL (or VITE_SUPABASE_URL)
//   SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)
//   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
//
// Idempotent: creates the user if missing, otherwise updates the password,
// name, and admin role. Safe to re-run any time you rotate the password.

import { readFileSync } from "node:fs";

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
const KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const NAME = process.env.ADMIN_NAME || "Admin";

if (!URL || !KEY || !EMAIL || !PASSWORD) {
  console.error("✗ Missing env vars. Need SUPABASE_URL, SUPABASE_SECRET_KEY, ADMIN_EMAIL, ADMIN_PASSWORD.");
  process.exit(1);
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function api(path, init = {}) {
  const res = await fetch(`${URL}/auth/v1/admin/${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

const payload = {
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
  user_metadata: { name: NAME, role: "admin" },
};

// 1) Try to create
const created = await api("users", { method: "POST", body: JSON.stringify(payload) });
if (created.ok) {
  console.log(`✓ Admin user created: ${EMAIL} (${NAME})`);
  process.exit(0);
}

// 2) Already exists -> find and update
const msg = created.body?.msg || created.body?.message || "";
if (created.status === 422 || /already.*(registered|exists)/i.test(msg)) {
  const list = await api(`users?page=1&per_page=1000`);
  const user = (list.body?.users || []).find(
    (u) => u.email?.toLowerCase() === EMAIL.toLowerCase()
  );
  if (!user) {
    console.error("✗ User reported as existing but not found in list:", msg);
    process.exit(1);
  }
  const updated = await api(`users/${user.id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (updated.ok) {
    console.log(`✓ Admin user updated: ${EMAIL} (${NAME}) — password + role refreshed`);
    process.exit(0);
  }
  console.error("✗ Update failed:", updated.status, JSON.stringify(updated.body));
  process.exit(1);
}

console.error("✗ Create failed:", created.status, JSON.stringify(created.body));
process.exit(1);
