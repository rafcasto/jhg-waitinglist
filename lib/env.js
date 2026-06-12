// Single place to resolve env vars, tolerant of both naming schemes
// (the app's original names and the VITE_-style names used in Vercel).

export const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";

// Server-only powerful key (bypasses RLS) — never sent to the browser.
export const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

// Low-privilege key, used server-side for the Auth password grant.
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  SUPABASE_SECRET_KEY; // fallback: secret key also works server-side

export function assertSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error(
      "Missing Supabase env vars: need SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)."
    );
  }
}
