import { NextResponse } from "next/server";
import { adminLogin, ADMIN_COOKIE } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json().catch(() => ({}));
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required." }, { status: 400 });
    }

    const session = await adminLogin(email.trim().toLowerCase(), password);
    if (!session) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const res = NextResponse.json({
      ok: true,
      name: session.user?.user_metadata?.name || "Admin",
      role: session.role,
    });
    res.cookies.set(ADMIN_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // matches Supabase access-token lifetime
    });
    return res;
  } catch (err) {
    console.error("[admin/login]", err);
    return NextResponse.json({ error: "Login failed. Try again." }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
