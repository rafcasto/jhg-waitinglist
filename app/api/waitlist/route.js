import { NextResponse } from "next/server";
import { upsertLead } from "@/lib/supabase";
import { TAGS } from "@/lib/defaults";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const first_name = (body.first_name || "").trim();
    const last_name = (body.last_name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const source = (body.source || "").trim() || "direct";

    if (!first_name) {
      return NextResponse.json({ error: "First name is required." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    await upsertLead({
      first_name,
      last_name: last_name || null,
      email,
      stage: "acquisition",
      tag: TAGS.WAITLIST,
      source,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[waitlist]", err);
    return NextResponse.json(
      { error: "Something went wrong on our side. Please try again." },
      { status: 500 }
    );
  }
}
