-- ============================================================
-- Migration 2 — editable page content + multi-user editors
-- Run once in the Supabase SQL editor (after supabase/migration.sql).
-- ============================================================
--
-- TEAM / EDITORS: no schema change needed. Admins and editors are regular
-- Supabase Auth users with user_metadata.role = 'admin' | 'editor'. They are
-- created from the /admin Team panel (Option A: admin sets a temp password).
-- Your first admin still comes from `npm run seed:admin`.
--
-- PAGE CONTENT: lives inside the existing jobhackers_quiz_config.data JSONB
-- under a new "content" key. The app falls back to defaults for any missing
-- field, so this backfill is optional — but it makes the stored row explicit.

update public.jobhackers_quiz_config
set data = jsonb_set(
  data,
  '{content}',
  '{
    "landing_kicker": "Waiting list · First access",
    "footer_tagline": "Get a job you love",
    "eyebrow": "JobHackers Global",
    "headline": "Get a job you love.",
    "headline_strike": "Doors open soon.",
    "lede": "Escape career limbo. Bypass the application black hole and land the salary you deserve. Join the waiting list to be first through the door when the next cohort opens — plus get an instant bonus the moment you''re in.",
    "form_tag": "Reserve your spot",
    "form_cta": "Join the waiting list →",
    "form_fineprint": "No spam, ever. First access + an instant bonus on the next screen.",
    "quiz_intro_heading": "You''re in, {first_name}. Now unlock your edge.",
    "quiz_intro_fineprint": "Takes under 30 seconds. No wrong answers.",
    "quiz_unlocked_body": "The Five Finger Interview Maximizer is yours — the 5-point system to own any interview, formal or informal. Grab it now, it opens in a new tab.",
    "quiz_unlocked_cta": "Get the Five Finger Maximizer →",
    "quiz_unlocked_fineprint": "You''re on the list. Watch your inbox for first access."
  }'::jsonb,
  true
)
where id = 1
  and not (data ? 'content');
