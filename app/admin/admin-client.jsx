"use client";

import { useState } from "react";

export default function AdminClient() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [config, setConfig] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { ok, text }

  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/config", {
        headers: { "x-admin-password": password },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Wrong password.");
      setConfig(data.config);
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
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      setConfig(data.config);
      setNotice({ ok: true, text: "Saved. Live immediately." });
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const setField = (k) => (e) => setConfig((c) => ({ ...c, [k]: e.target.value }));

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

  // ---------- login gate ----------
  if (!unlocked) {
    return (
      <div className="quiz-wrap" style={{ maxWidth: 440 }}>
        <form className="card" onSubmit={login}>
          <span className="card-tag">RESTRICTED AREA</span>
          <div className="field">
            <label htmlFor="pw">Admin password</label>
            <input
              id="pw"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "CHECKING…" : "ENTER ADMIN →"}
          </button>
          {notice && <p className="error">{notice.text}</p>}
        </form>
      </div>
    );
  }

  // ---------- editor ----------
  return (
    <div className="admin-wrap">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span className="card-tag" style={{ marginBottom: 0 }}>QUIZ + LEAD MAGNET SETTINGS</span>
          <button className="btn" style={{ width: "auto", padding: "10px 22px" }} onClick={save} disabled={busy}>
            {busy ? "SAVING…" : "SAVE CHANGES"}
          </button>
        </div>

        {notice && <p className={`notice ${notice.ok ? "ok" : "bad"}`}>{notice.text}</p>}

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

            {config.questions.map((q, i) => (
              <div className="qcard" key={q.id || i}>
                <div className="qcard-head">
                  <span>QUESTION {String(i + 1).padStart(2, "0")}</span>
                  {config.questions.length > 1 && (
                    <button className="mini-btn" onClick={() => removeQuestion(i)}>
                      REMOVE
                    </button>
                  )}
                </div>
                <div className="field">
                  <label>Question text</label>
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => setQuestion(i, { text: e.target.value })}
                  />
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
              + ADD QUESTION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
