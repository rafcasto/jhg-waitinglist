-- ============================================================
-- JobHackers waiting-list funnel — run once in the Supabase SQL editor
-- (jobhackers_leads already exists; this adds the two support tables)
-- ============================================================

-- 1) Quiz / lead-magnet config (single row, edited from /admin)
create table if not exists public.jobhackers_quiz_config (
  id integer primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.jobhackers_quiz_config enable row level security;
-- No policies on purpose: only the server (service-role key) reads/writes it.

create trigger trg_jobhackers_quiz_config_updated_at
  before update on public.jobhackers_quiz_config
  for each row execute function set_updated_at();

-- Seed the default config (admin can change everything later)
insert into public.jobhackers_quiz_config (id, data) values (1, '{
  "quiz_title": "Unlock the Five Finger Interview Maximizer",
  "quiz_subtitle": "Answer 3 quick questions and we''ll hand you the 5-point system to walk into any interview — formal or informal — with total confidence.",
  "unlock_label": "The 3-Question Unlock",
  "lead_magnet_url": "https://drive.google.com/file/d/1O870dTwBsN_BLJoLcEbfxrtPkAs4bueb/view?usp=sharing",
  "questions": [
    {
      "id": "about_you",
      "text": "Which of the following best describes you?",
      "options": ["Student or recent graduate", "Employed, but quietly exploring", "Actively job hunting right now", "Changing careers or industries", "Returning to work after a break"]
    },
    {
      "id": "goal",
      "text": "What’s your #1 goal right now?",
      "options": ["Land my first real job", "Get more interview callbacks", "Move to a better company or role", "Negotiate a higher salary", "Build unshakeable interview confidence"]
    },
    {
      "id": "challenge",
      "text": "What’s your biggest challenge right now?",
      "options": ["I’m not getting interviews", "I get nervous and freeze in interviews", "I struggle to explain my value", "I don’t know how to stand out", "I don’t know where to start"]
    }
  ]
}'::jsonb)
on conflict (id) do nothing;

-- 2) Raw quiz answers (bonus: keeps every answer for future segmentation)
create table if not exists public.jobhackers_quiz_responses (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  answers jsonb not null,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists idx_jobhackers_quiz_responses_email
  on public.jobhackers_quiz_responses (email);

alter table public.jobhackers_quiz_responses enable row level security;
-- No policies: service-role (server) only.

-- 3) OPTIONAL but recommended: lock down jobhackers_leads.
-- All writes in this app go through the server with the service-role key,
-- so the table needs no anon policies. ONLY run this if no OTHER tool of
-- yours writes to jobhackers_leads with the anon key.
-- alter table public.jobhackers_leads enable row level security;
