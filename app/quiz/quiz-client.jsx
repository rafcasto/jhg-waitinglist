"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fillTokens } from "@/lib/content";

const KEYS = "ABCDEFGH";

export default function QuizClient() {
  const params = useSearchParams();
  const lead = {
    first_name: (params.get("first_name") || "").trim(),
    last_name: (params.get("last_name") || "").trim(),
    email: (params.get("email") || "").trim(),
    source: (params.get("source") || "").trim() || "direct",
  };

  const [config, setConfig] = useState(null);
  const [step, setStep] = useState(-1); // -1 = intro, 0..n-1 = questions
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [magnetUrl, setMagnetUrl] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setError("Could not load the quiz. Refresh and try again."));
  }, []);

  if (!lead.email || !lead.first_name) {
    return (
      <div className="quiz-wrap">
        <div className="card" style={{ textAlign: "center" }}>
          <span className="card-tag">Hold on</span>
          <h2 className="question">Join the waiting list first</h2>
          <p className="lede" style={{ margin: "0 auto 20px" }}>
            This unlock is reserved for people on the waiting list. It takes
            ten seconds to join.
          </p>
          <a className="btn" href="/">
            Join the waiting list →
          </a>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="quiz-wrap">
        <p className="step-count">Loading…</p>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  const content = config.content || {};
  const questions = config.questions || [];
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const tokens = { first_name: lead.first_name, total };

  async function submit(finalAnswers) {
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...lead,
        answers: questions.map((q) => ({
          question: q.text,
          answer: finalAnswers[q.id],
        })),
      };
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMagnetUrl(data.magnet_url);
      setStep(total); // unlocked state
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function choose(q, option) {
    const next = { ...answers, [q.id]: option };
    setAnswers(next);
    setTimeout(() => {
      if (step < total - 1) setStep(step + 1);
      else submit(next);
    }, 220);
  }

  // ---------- unlocked ----------
  if (step >= total && magnetUrl) {
    return (
      <div className="quiz-wrap">
        <div className="card">
          <div className="unlocked">
            <img className="hand" src="/jhg-hand.png" alt="" />
            <h2>
              <span>Unlocked.</span>
              <br />
              High five, {lead.first_name}.
            </h2>
            <p>
              {fillTokens(
                content.quiz_unlocked_body ||
                  "The Five Finger Interview Maximizer is yours — the 5-point system to own any interview, formal or informal. Grab it now, it opens in a new tab.",
                tokens
              )}
            </p>
            <a className="btn" href={magnetUrl} target="_blank" rel="noreferrer">
              {content.quiz_unlocked_cta || "Get the Five Finger Maximizer →"}
            </a>
            <p className="fineprint">
              {content.quiz_unlocked_fineprint ||
                "You're on the list. Watch your inbox for first access."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- intro ----------
  if (step === -1) {
    return (
      <div className="quiz-wrap">
        <div className="card">
          <span className="card-tag">{config.unlock_label || "The 3-question unlock"}</span>
          <h2 className="question">
            {fillTokens(
              content.quiz_intro_heading || "You're in, {first_name}. Now unlock your edge.",
              tokens
            )}
          </h2>
          <p className="lede" style={{ marginBottom: 20 }}>
            <strong>{config.quiz_title}</strong> — {config.quiz_subtitle}
          </p>
          <button className="btn" onClick={() => setStep(0)}>
            Start the {total}-question unlock →
          </button>
          <p className="fineprint">
            {content.quiz_intro_fineprint || "Takes under 30 seconds. No wrong answers."}
          </p>
        </div>
      </div>
    );
  }

  // ---------- questions ----------
  const q = questions[step];
  return (
    <div className="quiz-wrap">
      <div className="steps">
        <span className="step-count">
          {String(step + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
        {questions.map((_, i) => (
          <span key={i} className="bar">
            <i style={{ transform: `scaleX(${i < step || (i === step && answers[questions[i].id]) ? 1 : 0})` }} />
          </span>
        ))}
      </div>

      <div className="card">
        <h2 className="question">{q.text}</h2>
        <div className="options">
          {q.options.map((option, i) => (
            <button
              key={option}
              className={`option ${answers[q.id] === option ? "selected" : ""}`}
              disabled={busy}
              onClick={() => choose(q, option)}
            >
              <span className="key">{KEYS[i]}</span>
              {option}
            </button>
          ))}
        </div>

        <div className="quiz-nav">
          {step > 0 ? (
            <button className="back-link" onClick={() => setStep(step - 1)}>
              ← Back
            </button>
          ) : (
            <span />
          )}
          <span className="step-count">{busy ? "Unlocking…" : `${answered}/${total} answered`}</span>
        </div>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
