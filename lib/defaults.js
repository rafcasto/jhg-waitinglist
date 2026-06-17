// Default quiz + page config. Used as a fallback if the jobhackers_quiz_config
// table is empty or unreachable, and as the seed row in the migration.
//
// `content` holds all editable page copy (eyebrow, headers, body, CTAs).
// Editors change these from /admin; the public pages read them at render time
// and fall back to these defaults whenever a field is missing.
//
// Each question option is { label, points }. `points` is an INTERNAL lead-
// qualification weight: the picked options are summed into a score that is
// stored with the lead's quiz response for segmentation. It is never shown to
// the person taking the quiz.
export const DEFAULT_CONFIG = {
  quiz_title: "Unlock the Five Finger Interview Maximizer",
  quiz_subtitle:
    "Answer 3 quick questions and we'll hand you the 5-point system to walk into any interview — formal or informal — with total confidence.",
  unlock_label: "The 3-Question Unlock",
  lead_magnet_url:
    "https://drive.google.com/file/d/1O870dTwBsN_BLJoLcEbfxrtPkAs4bueb/view?usp=sharing",
  content: {
    // Shell (shared header kicker + footer tagline)
    landing_kicker: "Waiting list · First access",
    footer_tagline: "Get a job you love",
    // Landing hero
    eyebrow: "JobHackers Global",
    headline: "Get a job you love.",
    headline_strike: "Doors open soon.",
    lede:
      "Escape career limbo. Bypass the application black hole and land the salary you deserve. Join the waiting list to be first through the door when the next cohort opens — plus get an instant bonus the moment you're in.",
    // Waitlist form card
    form_tag: "Reserve your spot",
    form_cta: "Join the waiting list →",
    form_fineprint:
      "No spam, ever. First access + an instant bonus on the next screen.",
    // Waitlist thank-you (intro card heading) — {first_name}, {total}
    quiz_intro_heading: "You're in, {first_name}. Now unlock your edge.",
    // Start-quiz card
    quiz_start_cta: "Start the {total}-question unlock →",
    quiz_intro_fineprint: "Takes under 30 seconds. No wrong answers.",
    // After-quiz delivery card — {first_name}
    quiz_unlocked_body:
      "The Five Finger Interview Maximizer is yours, {first_name} — the 5-point system to own any interview, formal or informal. Grab it now, it opens in a new tab.",
    quiz_unlocked_cta: "Get the Five Finger Maximizer →",
    quiz_unlocked_fineprint:
      "You're on the list. Watch your inbox for first access.",
  },
  questions: [
    {
      id: "about_you",
      text: "Which of the following best describes you?",
      options: [
        { label: "Student or recent graduate", points: 1 },
        { label: "Employed, but quietly exploring", points: 2 },
        { label: "Actively job hunting right now", points: 3 },
        { label: "Changing careers or industries", points: 4 },
        { label: "Returning to work after a break", points: 5 },
      ],
    },
    {
      id: "goal",
      text: "What’s your #1 goal right now?",
      options: [
        { label: "Land my first real job", points: 1 },
        { label: "Get more interview callbacks", points: 2 },
        { label: "Move to a better company or role", points: 3 },
        { label: "Negotiate a higher salary", points: 4 },
        { label: "Build unshakeable interview confidence", points: 5 },
      ],
    },
    {
      id: "challenge",
      text: "What’s your biggest challenge right now?",
      options: [
        { label: "I’m not getting interviews", points: 1 },
        { label: "I get nervous and freeze in interviews", points: 2 },
        { label: "I struggle to explain my value", points: 3 },
        { label: "I don’t know how to stand out", points: 4 },
        { label: "I don’t know where to start", points: 5 },
      ],
    },
  ],
};

// Drives the /admin Content editor. Each tab maps to a funnel step. Fields are
// either `content` (config.content[key]) or `root` (config[key]) scoped.
export const ADMIN_TABS = [
  {
    id: "lp",
    label: "Join waitlist LP",
    fields: [
      { key: "landing_kicker", scope: "content", label: "Header kicker (top bar)", type: "text" },
      { key: "eyebrow", scope: "content", label: "Eyebrow", type: "text" },
      { key: "headline", scope: "content", label: "Headline", type: "text" },
      { key: "headline_strike", scope: "content", label: "Headline — struck-through line", type: "text" },
      { key: "lede", scope: "content", label: "Body / lede", type: "textarea" },
      { key: "form_tag", scope: "content", label: "Form badge", type: "text" },
      { key: "form_cta", scope: "content", label: "Join button (CTA)", type: "text" },
      { key: "form_fineprint", scope: "content", label: "Fine print", type: "text" },
      { key: "footer_tagline", scope: "content", label: "Footer tagline", type: "text" },
    ],
  },
  {
    id: "thankyou",
    label: "Join waitlist thank you",
    note: "Shown the moment someone joins, at the top of the quiz screen.",
    fields: [
      { key: "quiz_intro_heading", scope: "content", label: "Thank-you heading — use {first_name}, {total}", type: "text" },
    ],
  },
  {
    id: "start",
    label: "Start Quiz",
    fields: [
      { key: "unlock_label", scope: "root", label: "Unlock badge", type: "text" },
      { key: "quiz_title", scope: "root", label: "Quiz title", type: "text" },
      { key: "quiz_subtitle", scope: "root", label: "Quiz subtitle / hook", type: "textarea" },
      { key: "quiz_start_cta", scope: "content", label: "Start button (CTA) — use {total}", type: "text" },
      { key: "quiz_intro_fineprint", scope: "content", label: "Fine print", type: "text" },
    ],
  },
  {
    id: "questions",
    label: "Quiz questions",
    note: "Points are an internal lead-qualification weight — they're summed and stored with each lead for segmentation. They are NOT shown to the person taking the quiz.",
    fields: [],
    questions: true,
  },
  {
    id: "delivery",
    label: "After quiz (delivery)",
    note: "Shown after the quiz, where the lead magnet is handed over. Use {first_name} for personalization.",
    fields: [
      { key: "lead_magnet_url", scope: "root", label: "Lead magnet URL (the file/link people receive)", type: "url" },
      { key: "quiz_unlocked_body", scope: "content", label: "Delivery body", type: "textarea" },
      { key: "quiz_unlocked_cta", scope: "content", label: "Delivery button (CTA)", type: "text" },
      { key: "quiz_unlocked_fineprint", scope: "content", label: "Fine print", type: "text" },
    ],
  },
];

export const TAGS = {
  WAITLIST: "EVENT -> JOIN -> WAITINGLIST",
  QUIZ: "EVENT -> ANSWER -> QUIZ",
};
