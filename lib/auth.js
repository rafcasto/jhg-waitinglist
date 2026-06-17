// Admin auth backed by Supabase Auth.
//
// Two roles live in user_metadata.role:
//   - "admin"  → edits content AND manages the team (add/remove editors)
//   - "editor" → edits all page content + quiz questions, but not the team
//
// Login: the server exchanges email+password for an access token (password
// grant), verifies the user is an admin or editor, and stores the token in an
// httpOnly cookie. Every admin API call re-verifies the token with Supabase.

import {
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  SUPABASE_PUBLISHABLE_KEY,
  assertSupabaseEnv,
} from "./env";

export const ADMIN_COOKIE = "jhg_admin_token";
export const EDITOR_ROLES = ["admin", "editor"];

const roleOf = (user) => user?.user_metadata?.role || null;

/** Exchange email+password for a session. Returns { token, user, role } or null. */
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
  const role = roleOf(data?.user);
  if (!EDITOR_ROLES.includes(role)) return null; // valid user, but not staff
  return { token: data.access_token, user: data.user, role };
}

/** Resolve an access token to its Supabase user, or null if invalid. */
export async function getUserFromToken(token) {
  if (!token) return null;
  assertSupabaseEnv();
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

/** Pull the admin token from a Next.js Request's cookies. */
export function tokenFromRequest(req) {
  return req.cookies?.get?.(ADMIN_COOKIE)?.value || "";
}

/** Request guard: returns { user, role } for any admin/editor, else null. */
export async function getEditor(req) {
  const user = await getUserFromToken(tokenFromRequest(req));
  const role = roleOf(user);
  if (EDITOR_ROLES.includes(role)) return { user, role };
  return null;
}

/** Request guard: returns { user, role } only for admins, else null. */
export async function getAdmin(req) {
  const ctx = await getEditor(req);
  return ctx && ctx.role === "admin" ? ctx : null;
}

// ---------- Supabase Auth admin API (service-role key, server only) ----------

async function adminAuthApi(path, init = {}) {
  assertSupabaseEnv();
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg =
      body?.msg || body?.message || body?.error_description || `status ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return body;
}

/** List the team (admins + editors) as { id, email, name, role }. */
export async function listTeam() {
  const body = await adminAuthApi("users?page=1&per_page=1000");
  return (body?.users || [])
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.name || "",
      role: roleOf(u),
    }))
    .filter((u) => EDITOR_ROLES.includes(u.role))
    .sort((a, b) => (a.role === b.role ? a.email.localeCompare(b.email) : a.role.localeCompare(b.role)));
}

/** Create a new admin/editor with a temporary password (Option A flow). */
export async function createTeamMember({ email, password, name, role }) {
  return adminAuthApi("users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    }),
  });
}

async function getAuthUser(id) {
  return adminAuthApi(`users/${id}`);
}

/** Update a team member's name/role and optionally reset their password. */
export async function updateTeamMember(id, { name, role, password }) {
  const existing = await getAuthUser(id);
  const meta = { ...(existing?.user_metadata || {}) };
  if (name !== undefined) meta.name = name;
  if (role !== undefined) meta.role = role;
  const payload = { user_metadata: meta };
  if (password) payload.password = password;
  return adminAuthApi(`users/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function deleteTeamMember(id) {
  return adminAuthApi(`users/${id}`, { method: "DELETE" });
}
