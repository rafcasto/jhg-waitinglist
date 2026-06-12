// Admin auth backed by Supabase Auth.
// Login: server exchanges email+password for an access token (password grant),
// verifies the user has user_metadata.role === "admin", and sets it as an
// httpOnly cookie. Every admin API call re-verifies the token with Supabase.

import {
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  SUPABASE_PUBLISHABLE_KEY,
  assertSupabaseEnv,
} from "./env";

export const ADMIN_COOKIE = "jhg_admin_token";

/** Exchange email+password for a session. Returns { token, user } or null. */
export async function adminLogin(email, password) {
  assertSupabaseEnv();
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  const role = data?.user?.user_metadata?.role;
  if (role !== "admin") return null; // valid user, but not an admin
  return { token: data.access_token, user: data.user };
}

/** Verify an access token belongs to an admin user. */
export async function verifyAdminToken(token) {
  if (!token) return false;
  assertSupabaseEnv();
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (!res.ok) return false;
  const user = await res.json();
  return user?.user_metadata?.role === "admin";
}

/** Pull the admin token from a Next.js Request's cookies. */
export function tokenFromRequest(req) {
  return req.cookies?.get?.(ADMIN_COOKIE)?.value || "";
}
