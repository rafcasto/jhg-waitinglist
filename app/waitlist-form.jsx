"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function WaitlistForm() {
  const router = useRouter();
  const params = useSearchParams();
  const source = (params.get("source") || "").trim() || "direct";

  const [form, setForm] = useState({ first_name: "", last_name: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      const qs = new URLSearchParams({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        source,
      });
      router.push(`/quiz?${qs.toString()}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <span className="card-tag">RESERVE YOUR SPOT</span>

      <div className="row-2">
        <div className="field">
          <label htmlFor="first_name">First name *</label>
          <input
            id="first_name"
            type="text"
            autoComplete="given-name"
            placeholder="Alex"
            required
            value={form.first_name}
            onChange={set("first_name")}
          />
        </div>
        <div className="field">
          <label htmlFor="last_name">Last name</label>
          <input
            id="last_name"
            type="text"
            autoComplete="family-name"
            placeholder="Rivera"
            value={form.last_name}
            onChange={set("last_name")}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="alex@email.com"
          required
          value={form.email}
          onChange={set("email")}
        />
      </div>

      <button className="btn" type="submit" disabled={busy}>
        {busy ? "LOCKING IT IN…" : "JOIN THE WAITING LIST →"}
      </button>

      {error && <p className="error">{error}</p>}

      <p className="fineprint">NO SPAM. FIRST ACCESS + A BONUS ON THE NEXT SCREEN.</p>
    </form>
  );
}
