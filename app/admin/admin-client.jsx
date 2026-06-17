"use client";

import { useState, useEffect } from "react";
import { ADMIN_TABS, DEFAULT_CONFIG } from "@/lib/defaults";
import { normalizeQuestions } from "@/lib/content";
import s from "./admin.module.css";

export default function AdminClient() {
  const [creds, setCreds] = useState({ email: "", password: "" });
  const [userEmail, setUserEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true); // restoring session on load
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [config, setConfig] = useState(null);
  const [dash, setDash] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { ok, text }

  const [team, setTeam] = useState([]);
  const [newMember, setNewMember] = useState({ name: "", email: "", password: "", role: "editor" });

  const isAdmin = role === "admin";

  const hydrate = (cfg) => ({
    ...cfg,
    content: { ...DEFAULT_CONFIG.content, ...(cfg.content || {}) },
    questions: normalizeQuestions(cfg.questions),
  });

  // Load everything for a verified session and reveal the admin.
  async function enterAdmin({ name, role, email }) {
    setAdminName(name);
    setRole(role);
    setUserEmail(email);
    try {
      const cfgRes = await fetch("/api/admin/config");
      const cfgData = await cfgRes.json();
      if (cfgRes.ok) setConfig(hydrate(cfgData.config));
    } catch {}
    loadDashboard();
    if (role === "admin") loadTeam();
    setUnlocked(true);
  }

  // On mount: if the auth cookie is still valid, restore the session so a
  // refresh doesn't bounce the user back to the login screen.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/login");
        if (res.ok) await enterAdmin(await res.json());
      } catch {
        /* not logged in — show the login gate */
      } finally {
        setChecking(false);
      }
    })();
  }, []);

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
      await enterAdmin(data);
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function loadDashboard() {
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      if (res.ok) setDash(data);
    } catch {
      /* dashboard stays in loading state */
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
      setConfig(hydrate(data.config));
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
    setDash(null);
    setRole(null);
    setTeam([]);
    setCreds({ email: "", password: "" });
  }

  // ---------- content field helpers ----------
  const fieldVal = (f) => (f.scope === "root" ? config[f.key] ?? "" : config.content?.[f.key] ?? "");
  const onFieldChange = (f) => (e) => {
    const v = e.target.value;
    setConfig((c) =>
      f.scope === "root" ? { ...c, [f.key]: v } : { ...c, content: { ...c.content, [f.key]: v } }
    );
  };
  const setQuestion = (i, patch) =>
    setConfig((c) => ({ ...c, questions: c.questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) }));
  const addQuestion = () =>
    setConfig((c) => ({
      ...c,
      questions: [
        ...c.questions,
        { id: `q${c.questions.length + 1}_${Date.now()}`, text: "", options: [{ label: "", points: 0 }, { label: "", points: 0 }] },
      ],
    }));
  const removeQuestion = (i) => setConfig((c) => ({ ...c, questions: c.questions.filter((_, idx) => idx !== i) }));
  const setOption = (qi, oi, patch) =>
    setConfig((c) => ({
      ...c,
      questions: c.questions.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : q
      ),
    }));
  const addOption = (qi) =>
    setConfig((c) => ({
      ...c,
      questions: c.questions.map((q, i) => (i === qi ? { ...q, options: [...q.options, { label: "", points: 0 }] } : q)),
    }));
  const removeOption = (qi, oi) =>
    setConfig((c) => ({
      ...c,
      questions: c.questions.map((q, i) => (i === qi ? { ...q, options: q.options.filter((_, j) => j !== oi) } : q)),
    }));

  // ---------- team helpers ----------
  async function loadTeam() {
    try {
      const res = await fetch("/api/admin/team");
      const data = await res.json();
      if (res.ok) setTeam(data.team || []);
    } catch {}
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
  async function changeRole(m, r) {
    try {
      await teamRequest("PATCH", { id: m.id, role: r });
      setNotice({ ok: true, text: `${m.email} is now an ${r}.` });
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    }
  }
  async function resetPassword(m) {
    const password = window.prompt(`New temporary password for ${m.email} (min 8 chars):`);
    if (!password) return;
    try {
      await teamRequest("PATCH", { id: m.id, password });
      setNotice({ ok: true, text: `Password reset for ${m.email}. Share it with them.` });
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    }
  }
  async function removeMember(m) {
    if (!window.confirm(`Remove ${m.email}? They lose all access immediately.`)) return;
    try {
      await teamRequest("DELETE", { id: m.id });
      setNotice({ ok: true, text: `${m.email} removed.` });
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    }
  }

  // ---------- still checking the cookie ----------
  if (checking) {
    return (
      <div className={s.loginWrap}>
        <p className="step-count">Loading…</p>
      </div>
    );
  }

  // ---------- login gate ----------
  if (!unlocked) {
    return (
      <div className={s.loginWrap}>
        <form className={s.loginCard} onSubmit={login}>
          <span className="card-tag">Restricted area</span>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="username" value={creds.email}
              onChange={(e) => setCreds((c) => ({ ...c, email: e.target.value }))} required />
          </div>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input id="pw" type="password" autoComplete="current-password" value={creds.password}
              onChange={(e) => setCreds((c) => ({ ...c, password: e.target.value }))} required />
          </div>
          <button className="btn" type="submit" disabled={busy}>{busy ? "Checking…" : "Log in →"}</button>
          {notice && <p className="error">{notice.text}</p>}
        </form>
      </div>
    );
  }

  const navTabs = [
    { id: "dashboard", label: "Dashboard" },
    ...ADMIN_TABS.map((t) => ({ id: t.id, label: t.label })),
    ...(isAdmin ? [{ id: "team", label: "Team" }] : []),
  ];
  const editorTab = ADMIN_TABS.find((t) => t.id === tab);
  const fmtDate = (d) => { try { return new Date(d).toLocaleDateString(); } catch { return "—"; } };

  return (
    <div className={s.page}>
      {/* top bar */}
      <div className={s.bar}>
        <div className={s.brand}><span className={s.gear}>⚙</span> JobHackers Admin</div>
        <div className={s.barRight}>
          <span className={s.email}>{userEmail}</span>
          <a className={s.viewSite} href="/" target="_blank" rel="noreferrer">View site ↗</a>
          <button className={s.signout} onClick={logout} disabled={busy}>Sign out</button>
        </div>
      </div>

      {/* tabs */}
      <div className={s.tabsWrap}>
        <div className={s.tabs}>
          {navTabs.map((t) => (
            <button key={t.id} className={`${s.tab} ${tab === t.id ? s.tabActive : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={s.main}>
        {notice && <p className={`notice ${notice.ok ? "ok" : "bad"}`} style={{ marginBottom: 16 }}>{notice.text}</p>}

        {/* ---------------- DASHBOARD ---------------- */}
        {tab === "dashboard" && (
          !dash ? (
            <p className="step-count">Loading dashboard…</p>
          ) : (
            <>
              <div className={s.cards}>
                <div className={s.card}><div className={s.cardNum}>{dash.kpis.waitlistJoins}</div><div className={s.cardLabel}>Waitlist joins</div></div>
                <div className={s.card}><div className={s.cardNum}>{dash.kpis.completions}</div><div className={s.cardLabel}>Quiz completions</div></div>
                <div className={s.card}><div className={s.cardNum}>{dash.kpis.completionRate}%</div><div className={s.cardLabel}>Completion rate</div></div>
                <div className={s.card}><div className={s.cardNum}>{dash.kpis.avgScore}<span style={{ fontSize: 18, color: "var(--gray)" }}>/{dash.kpis.maxScore}</span></div><div className={s.cardLabel}>Avg qualification score</div></div>
              </div>

              <div className={s.panel}>
                <div className={s.panelTitle}>Question averages (lead-qualification points)</div>
                <div className={s.avgGrid}>
                  {dash.questionAverages.map((q, i) => (
                    <div className={s.avg} key={i}>
                      <div className={s.avgNum}>{q.avg}</div>
                      <div className={s.avgLabel}>{q.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={s.panel}>
                <div className={s.panelTitle}>Recent submissions</div>
                {dash.recent.length === 0 ? (
                  <div className={s.empty}>No quiz submissions yet.</div>
                ) : (
                  <table className={s.table}>
                    <thead>
                      <tr><th>Name</th><th>Location</th><th>Source</th><th>Score</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {dash.recent.map((r, i) => (
                        <tr key={i}>
                          <td>{r.name}<div className={s.muted} style={{ fontSize: 12 }}>{r.email}</div></td>
                          <td>{r.location}</td>
                          <td className={s.muted}>{r.source}</td>
                          <td>{r.score}<span className={s.muted}>/{dash.kpis.maxScore}</span></td>
                          <td className={s.muted}>{fmtDate(r.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )
        )}

        {/* ---------------- EDITOR TABS ---------------- */}
        {editorTab && config && (
          <>
            <h2 className={s.sectionTitle}>{editorTab.label}</h2>
            {editorTab.note && <p className={s.note}>{editorTab.note}</p>}

            <div className="admin-grid" style={{ maxWidth: 760 }}>
              {editorTab.fields.map((f) => (
                <div className="field" key={f.key} style={{ marginBottom: 4 }}>
                  <label>{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea rows={3} value={fieldVal(f)} onChange={onFieldChange(f)} />
                  ) : (
                    <input type={f.type === "url" ? "url" : "text"} value={fieldVal(f)} onChange={onFieldChange(f)} />
                  )}
                </div>
              ))}

              {editorTab.questions && (
                <>
                  {config.questions.map((q, i) => (
                    <div className="qcard" key={q.id || i}>
                      <div className="qcard-head">
                        <span>Question {String(i + 1).padStart(2, "0")}</span>
                        {config.questions.length > 1 && (
                          <button className="mini-btn" onClick={() => removeQuestion(i)}>Remove</button>
                        )}
                      </div>
                      <div className="field">
                        <label>Question text</label>
                        <input type="text" value={q.text} onChange={(e) => setQuestion(i, { text: e.target.value })} />
                      </div>
                      <div className="field" style={{ marginBottom: 8 }}>
                        <label>Answer options &amp; points (min 2)</label>
                        {q.options.map((o, oi) => (
                          <div className={s.optionRow} key={oi}>
                            <input type="text" placeholder={`Option ${oi + 1}`} value={o.label}
                              onChange={(e) => setOption(i, oi, { label: e.target.value })} />
                            <input className={s.points} type="number" min={0} title="Points" value={o.points}
                              onChange={(e) => setOption(i, oi, { points: Number(e.target.value) || 0 })} />
                            {q.options.length > 2 && (
                              <button className="mini-btn" onClick={() => removeOption(i, oi)} title="Remove option">×</button>
                            )}
                          </div>
                        ))}
                        <button className="mini-btn" style={{ padding: "8px 14px" }} onClick={() => addOption(i)}>+ Add option</button>
                      </div>
                    </div>
                  ))}
                  <button className="mini-btn" style={{ justifySelf: "start", padding: "10px 16px" }} onClick={addQuestion}>+ Add question</button>
                </>
              )}
            </div>

            {/* save bar — pinned to the bottom of the editor */}
            <div className={s.saveBar}>
              <button className="btn" style={{ width: "auto", padding: "13px 30px" }} onClick={save} disabled={busy}>
                {busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </>
        )}

        {/* ---------------- TEAM ---------------- */}
        {tab === "team" && isAdmin && (
          <>
            <h2 className={s.sectionTitle}>Team</h2>
            <div className="admin-grid" style={{ maxWidth: 760 }}>
              <div className="qcard">
                <div className="qcard-head"><span>Add a teammate</span></div>
                <form className="admin-grid" onSubmit={addMember} style={{ gap: 12 }}>
                  <div className="row-2">
                    <div className="field"><label>Name</label>
                      <input type="text" value={newMember.name} onChange={(e) => setNewMember((m) => ({ ...m, name: e.target.value }))} /></div>
                    <div className="field"><label>Email</label>
                      <input type="email" required value={newMember.email} onChange={(e) => setNewMember((m) => ({ ...m, email: e.target.value }))} /></div>
                  </div>
                  <div className="row-2">
                    <div className="field"><label>Temporary password (min 8 — you share this)</label>
                      <input type="text" required value={newMember.password} onChange={(e) => setNewMember((m) => ({ ...m, password: e.target.value }))} /></div>
                    <div className="field"><label>Role</label>
                      <select value={newMember.role} onChange={(e) => setNewMember((m) => ({ ...m, role: e.target.value }))}>
                        <option value="editor">Editor — edits content</option>
                        <option value="admin">Admin — content + team</option>
                      </select></div>
                  </div>
                  <button className="btn" type="submit" disabled={busy} style={{ width: "auto", padding: "10px 22px", justifySelf: "start" }}>
                    {busy ? "Adding…" : "Add teammate"}
                  </button>
                </form>
              </div>

              {team.map((m) => (
                <div className="qcard" key={m.id}>
                  <div className="qcard-head"><span>{m.name || m.email}</span><span className="step-count">{m.role}</span></div>
                  <p className="fineprint" style={{ marginTop: 0, textAlign: "left" }}>{m.email}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <select value={m.role} onChange={(e) => changeRole(m, e.target.value)} disabled={busy}>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button className="mini-btn" onClick={() => resetPassword(m)} disabled={busy}>Reset password</button>
                    <button className="mini-btn" onClick={() => removeMember(m)} disabled={busy}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
