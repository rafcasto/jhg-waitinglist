# JobHackers.global — Waiting List Funnel

Three-step funnel: **waiting list opt-in → 3-question quiz → Five Finger Interview Maximizer delivery**, with an admin panel at `/admin`.

## Pages

| Route | What it does |
|---|---|
| `/` | Single-viewport waiting list page. Captures first name, last name, email. `source` comes from `?source=...` (defaults to `direct`). Writes lead: `stage=acquisition`, `tag=EVENT -> JOIN -> WAITINGLIST`. Redirects to `/quiz` with the lead in the URL. |
| `/quiz` | Reads `first_name`, `last_name`, `email`, `source` from the URL. 3 multiple-choice questions, one at a time. On completion writes lead: `stage=activation`, `tag=EVENT -> ANSWER -> QUIZ`, stores raw answers, then reveals the lead-magnet link. |
| `/admin` | Password-protected. Edit the lead magnet URL and the quiz questions/answers (add/remove questions too). |

## Setup

1. **Database** — paste `supabase/migration.sql` into the Supabase SQL editor and run it. It creates `jobhackers_quiz_config` (admin-editable settings) and `jobhackers_quiz_responses` (raw answers), both RLS-locked to server-only access. `jobhackers_leads` is untouched.
2. **Env vars** — `cp .env.local.example .env.local` and fill in:
   - `SUPABASE_URL` — project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — **server-only**; all Supabase writes happen in API routes, no key ever reaches the browser
   - `ADMIN_PASSWORD` — gate for `/admin`
3. **Run** — `npm install && npm run dev`
4. **Deploy** — push to Vercel, add the same three env vars in the project settings.

## Source attribution

Share links like `https://yourdomain.com/?source=linkedin` — the `source` is captured at opt-in and carried through the quiz. No param = `direct`.

## Notes

- Lead writes are upserts on `(email, tag, stage)` — re-submissions update instead of erroring.
- The lead-magnet URL is never exposed before quiz completion; it's only returned by the server after a valid submission.
- The `activation` value must exist in your `lead_stage` enum (it references it as a default elsewhere, so it should).
