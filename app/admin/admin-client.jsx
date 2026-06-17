"use client";

import { useState } from "react";
import { CONTENT_FIELDS, DEFAULT_CONFIG } from "@/lib/defaults";

export default function AdminClient() {
  const [creds, setCreds] = useState({ email: "", password: "" });
  const [adminName, setAdminName] = useState("");
  const [role, setRole] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState("content"); // "content" | "team"
  const [config, setConfig] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { ok, text }

  // Team state
  const [team, setTeam] = useState([]);
  const [newMember, setNewMember] = useState({ name: "", email: "", password: "", role: "editor" });

  const isAdmin = role === "admin";

  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      setAdminName(data.name);
      setRole(data.role);

      const cfgRes = await fetch("/api/admin/config");
      const cfgData = await cfgRes.json();
      if (!cfgRes.ok) throw new Error(cfgData.error || "Could not load config.");
      const cfg = cfgData.config;
      setConfig({ ...cfg, content: { ...DEFAULT_CONFIG.content, ...(cfg.content || {}) } });

      if (data.role === "admin") loadTeam();
      setUnlocked(true);
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      setConfig({ ...data.config, content: { ...DEFAULT_CONFIG.content, ...(data.config.content || {}) } });
      setNotice({ ok: true, text: "Saved. Live immediately." });
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setUnlocked(false);
    setConfig(null);
    setRole(null);
    setTeam([]);
    setCreds({ email: "", password: "" });
  }

  // ---------- content helpers ----------
  const setField = (k) => (e) => setConfig((c) => ({ ...c, [k]: e.target.value }));
  const setContentField = (k) => (e) =>
    setConfig((c) => ({ ...c, content: { ...c.content, [k]: e.target.value } }));

  function setQuestion(i, patch) {
    setConfig((c) => {
      const questions = c.questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q));
      return { ...c, questions };
    });
  }
  function addQuestion() {
    setConfig((c) => ({
      ...c,
      questions: [
        ...c.questions,
        { id: `q${c.questions.length + 1}_${Date.now()}`, text: "", options: ["", ""] },
      ],
    }));
  }
  function removeQuestion(i) {
    setConfig((c) => ({ ...c, questions: c.questions.filter((_, idx) => idx !== i) }));
  }

  // ---------- team helpers ----------
  async function loadTeam() {
    try {
      const res = await fetch("/api/admin/team");
      const data = await res.json();
      if (res.ok) setTeam(data.team || []);
    } catch {
      /* ignore — team panel just shows empty */
    }
  }

  async function teamRequest(method, body) {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/team", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");
      if (data.team) setTeam(data.team);
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function addMember(e) {
    e.preventDefault();
    try {
      await teamRequest("POST", newMember);
      setNewMember({ name: "", email: "", password: "", role: "editor" });
      setNotice({ ok: true, text: "Added. Share the email + temporary password so they can log in." });
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    }
  }

  async function changeRole(member, nextRole) {
    try {
      await teamRequest("PATCH", { id: member.id, role: nextRole });
      setNotice({ ok: true, text: `${member.email} is now an ${nextRole}.` });
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    }
  }

  async function resetPassword(member) {
    const password = window.prompt(`New temporary password for ${member.email} (min 8 chars):`);
    if (!password) return;
    try {
      await teamRequest("PATCH", { id: member.id, password });
      setNotice({ ok: true, text: `Password reset for ${member.email}. Share it with them.` });
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    }
  }

  async function removeMember(member) {
    if (!window.confirm(`Remove ${member.email}? They lose all access immediately.`)) return;
    try {
      await teamRequest("DELETE", { id: member.id });
      setNotice({ ok: true, text: `${member.email} removed.` });
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    }
  }

  // ---------- login gate ----------
  if (!unlocked) {
    return (
      <div className="quiz-wrap" style={{ maxWidth: 440 }}>
        <form className="card" onSubmit={login}>
          <span className="card-tag">Restricted area</span>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={creds.email}
              onChange={(e) => setCreds((c) => ({ ...c, email: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input
              id="pw"
              type="password"
              autoComplete="current-password"
              value={creds.password}
              onChange={(e) => setCreds((c) => ({ ...c, password: e.target.value }))}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Checking…" : "Log in →"}
          </button>
          {notice && <p className="error">{notice.text}</p>}
        </form>
      </div>
    );
  }

  // group content fields by their `group` for tidy sections
  const groups = CONTENT_FIELDS.reduce((acc, f) => {
    (acc[f.group] = acc[f.group] || []).push(f);
    return acc;
  }, {});

  // ---------- editor ----------
  return (
    <div className="admin-wrap">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
          <span className="card-tag" style={{ marginBottom: 0 }}>
            {adminName ? `${adminName} · ` : ""}{isAdmin ? "Admin" : "Editor"}
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="mini-btn" onClick={logout} disabled={busy}>
              Log out
            </button>
            {tab === "content" && (
              <button className="btn" style={{ width: "auto", padding: "10px 22px" }} onClick={save} disabled={busy}>
                {busy ? "Saving…" : "Save changes"}
              </button>
            )}
          </div>
        </div>

        {/* tabs */}
        {isAdmin && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button className="mini-btn" style={tab === "content" ? { borderColor: "#fff" } : {}} onClick={() => setTab("content")}>
              Content
            </button>
            <button className="mini-btn" style={tab === "team" ? { borderColor: "#fff" } : {}} onClick={() => { setTab("team"); loadTeam(); }}>
              Team
            </button>
          </div>
        )}

        {notice && <p className={`notice ${notice.ok ? "ok" : "bad"}`}>{notice.text}</p>}

        {/* ---------------- CONTENT TAB ---------------- */}
        {tab === "content" && (
          <div className="admin-scroll" style={{ marginTop: 14 }}>
            <div className="admin-grid">
              <div className="field">
                <label>Lead magnet URL (delivered after quiz completion)</label>
                <input type="url" value={config.lead_magnet_url} onChange={setField("lead_magnet_url")} />
              </div>

              <div className="row-2">
                <div className="field">
                  <label>Quiz title</label>
                  <input type="text" value={config.quiz_title} onChange={setField("quiz_title")} />
                </div>
                <div className="field">
                  <label>Unlock label (badge on intro card)</label>
                  <input type="text" value={config.unlock_label || ""} onChange={setField("unlock_label")} />
                </div>
              </div>

              <div className="field">
                <label>Quiz subtitle / hook</label>
                <textarea rows={2} value={config.quiz_subtitle} onChange={setField("quiz_subtitle")} />
              </div>

              {/* editable page copy, grouped */}
              {Object.entries(groups).map(([group, fields]) => (
                <div className="qcard" key={group}>
                  <div className="qcard-head">
                    <span>{group}</span>
                  </div>
                  {fields.map((f) => (
                    <div className="field" key={f.key} style={{ marginBottom: 12 }}>
                      <label>{f.label}</label>
                      {f.type === "textarea" ? (
                        <textarea rows={3} value={config.content[f.key] ?? ""} onChange={setContentField(f.key)} />
                      ) : (
                        <input type="text" value={config.content[f.key] ?? ""} onChange={setContentField(f.key)} />
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {/* questions */}
              {config.questions.map((q, i) => (
                <div className="qcard" key={q.id || i}>
                  <div className="qcard-head">
                    <span>Question {String(i + 1).padStart(2, "0")}</span>
                    {config.questions.length > 1 && (
                      <button className="mini-btn" onClick={() => removeQuestion(i)}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="field">
                    <label>Question text</label>
                    <input type="text" value={q.text} onChange={(e) => setQuestion(i, { text: e.target.value })} />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Answer options — one per line (min 2)</label>
                    <textarea
                      rows={Math.max(3, q.options.length)}
                      value={q.options.join("\n")}
                      onChange={(e) => setQuestion(i, { options: e.target.value.split("\n") })}
                    />
                  </div>
                </div>
              ))}

              <button className="mini-btn" style={{ justifySelf: "start", padding: "10px 16px" }} onClick={addQuestion}>
                + Add question
              </button>
            </div>
          </div>
        )}

        {/* ---------------- TEAM TAB (admins only) ---------------- */}
        {tab === "team" && isAdmin && (
          <div className="admin-scroll" style={{ marginTop: 14 }}>
            <div className="admin-grid">
              <div className="qcard">
                <div className="qcard-head"><span>Add a teammate</span></div>
                <form className="admin-grid" onSubmit={addMember} style={{ gap: 12 }}>
                  <div className="row-2">
                    <div className="field">
                      <label>Name</label>
                      <input type="text" value={newMember.name} onChange={(e) => setNewMember((m) => ({ ...m, name: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label>Email</label>
                      <input type="email" required value={newMember.email} onChange={(e) => setNewMember((m) => ({ ...m, email: e.target.value }))} />
                    </div>
                  </div>
                  <div className="row-2">
                    <div className="field">
                      <label>Temporary password (min 8 — you share this)</label>
                      <input type="text" required value={newMember.password} onChange={(e) => setNewMember((m) => ({ ...m, password: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label>Role</label>
                      <select value={newMember.role} onChange={(e) => setNewMember((m) => ({ ...m, role: e.target.value }))}>
                        <option value="editor">Editor — edits content</option>
                        <option value="admin">Admin — content + team</option>
                      </select>
                    </div>
                  </div>
                  <button className="btn" type="submit" disabled={busy} style={{ width: "auto", padding: "10px 22px", justifySelf: "start" }}>
                    {busy ? "Adding…" : "Add teammate"}
                  </button>
                </form>
              </div>

              {team.map((m) => (
                <div className="qcard" key={m.id}>
                  <div className="qcard-head">
                    <span>{m.name || m.email}</span>
                    <span className="step-count">{m.role}</span>
                  </div>
                  <p className="fineprint" style={{ marginTop: 0 }}>{m.email}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <select value={m.role} onChange={(e) => changeRole(m, e.target.value)} disabled={busy}>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button className="mini-btn" onClick={() => resetPassword(m)} disabled={busy}>
                      Reset password
                    </button>
                    <button className="mini-btn" onClick={() => removeMember(m)} disabled={busy}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
