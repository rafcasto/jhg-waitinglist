import { NextResponse } from "next/server";
import {
  getAdmin,
  listTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  EDITOR_ROLES,
} from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET — list the team. Any admin can view.
export async function GET(req) {
  if (!(await getAdmin(req))) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }
  try {
    return NextResponse.json({ team: await listTeam() });
  } catch (err) {
    console.error("[admin/team] list", err);
    return NextResponse.json({ error: "Could not load the team." }, { status: 500 });
  }
}

// POST — add a new admin/editor with a temporary password.
export async function POST(req) {
  if (!(await getAdmin(req))) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }
  try {
    const { email, name, password, role } = await req.json().catch(() => ({}));
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanRole = EDITOR_ROLES.includes(role) ? role : "editor";

    if (!EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Temporary password must be at least 8 characters." },
        { status: 400 }
      );
    }

    await createTeamMember({
      email: cleanEmail,
      password,
      name: (name || "").trim() || cleanEmail.split("@")[0],
      role: cleanRole,
    });
    return NextResponse.json({ ok: true, team: await listTeam() });
  } catch (err) {
    console.error("[admin/team] create", err);
    const dup = err.status === 422 || /already|registered|exists/i.test(err.message || "");
    return NextResponse.json(
      { error: dup ? "Someone with that email already exists." : "Could not add that person." },
      { status: dup ? 409 : 500 }
    );
  }
}

// PATCH — change a member's role/name or reset their password.
export async function PATCH(req) {
  const me = await getAdmin(req);
  if (!me) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }
  try {
    const { id, name, role, password } = await req.json().catch(() => ({}));
    if (!id) return NextResponse.json({ error: "Missing user id." }, { status: 400 });
    if (role !== undefined && !EDITOR_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
    if (password !== undefined && password.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }
    // Guard: an admin can't demote themselves out of admin (avoids lockout).
    if (id === me.user.id && role && role !== "admin") {
      return NextResponse.json(
        { error: "You can't remove your own admin role." },
        { status: 400 }
      );
    }
    await updateTeamMember(id, { name, role, password });
    return NextResponse.json({ ok: true, team: await listTeam() });
  } catch (err) {
    console.error("[admin/team] update", err);
    return NextResponse.json({ error: "Could not update that person." }, { status: 500 });
  }
}

// DELETE — remove a team member (can't remove yourself).
export async function DELETE(req) {
  const me = await getAdmin(req);
  if (!me) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }
  try {
    const { id } = await req.json().catch(() => ({}));
    if (!id) return NextResponse.json({ error: "Missing user id." }, { status: 400 });
    if (id === me.user.id) {
      return NextResponse.json({ error: "You can't remove yourself." }, { status: 400 });
    }
    await deleteTeamMember(id);
    return NextResponse.json({ ok: true, team: await listTeam() });
  } catch (err) {
    console.error("[admin/team] delete", err);
    return NextResponse.json({ error: "Could not remove that person." }, { status: 500 });
  }
}
