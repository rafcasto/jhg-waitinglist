// Default quiz + page config. Used as a fallback if the jobhackers_quiz_config
// table is empty or unreachable, and as the seed row in the migration.
//
// `content` holds all editable page copy (eyebrow, headers, body, CTAs).
// Editors change these from /admin; the public pages read them at render time
// and fall back to these defaults whenever a field is missing.
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
    // Quiz intro card ({first_name} and {total} are replaced at render time)
    quiz_intro_heading: "You're in, {first_name}. Now unlock your edge.",
    quiz_intro_fineprint: "Takes under 30 seconds. No wrong answers.",
    // Quiz unlocked / thank-you card
    quiz_unlocked_body:
      "The Five Finger Interview Maximizer is yours — the 5-point system to own any interview, formal or informal. Grab it now, it opens in a new tab.",
    quiz_unlocked_cta: "Get the Five Finger Maximizer →",
    quiz_unlocked_fineprint:
      "You're on the list. Watch your inbox for first access.",
  },
  questions: [
    {
      id: "about_you",
      text: "Which of the following best describes you?",
      options: [
        "Student or recent graduate",
        "Employed, but quietly exploring",
        "Actively job hunting right now",
        "Changing careers or industries",
        "Returning to work after a break",
      ],
    },
    {
      id: "goal",
      text: "What’s your #1 goal right now?",
      options: [
        "Land my first real job",
        "Get more interview callbacks",
        "Move to a better company or role",
        "Negotiate a higher salary",
        "Build unshakeable interview confidence",
      ],
    },
    {
      id: "challenge",
      text: "What’s your biggest challenge right now?",
      options: [
        "I’m not getting interviews",
        "I get nervous and freeze in interviews",
        "I struggle to explain my value",
        "I don’t know how to stand out",
        "I don’t know where to start",
      ],
    },
  ],
};

// Field metadata that drives the /admin content editor. Keeping it here means
// the editor and the defaults can never drift apart.
export const CONTENT_FIELDS = [
  { key: "landing_kicker", label: "Header kicker (top bar)", type: "text", group: "Header & footer" },
  { key: "footer_tagline", label: "Footer tagline", type: "text", group: "Header & footer" },
  { key: "eyebrow", label: "Eyebrow", type: "text", group: "Landing page" },
  { key: "headline", label: "Headline", type: "text", group: "Landing page" },
  { key: "headline_strike", label: "Headline (struck-through line)", type: "text", group: "Landing page" },
  { key: "lede", label: "Body / lede", type: "textarea", group: "Landing page" },
  { key: "form_tag", label: "Form badge", type: "text", group: "Waitlist form" },
  { key: "form_cta", label: "Join button (CTA)", type: "text", group: "Waitlist form" },
  { key: "form_fineprint", label: "Fine print", type: "text", group: "Waitlist form" },
  { key: "quiz_intro_heading", label: "Intro heading — use {first_name}, {total}", type: "text", group: "Quiz intro" },
  { key: "quiz_intro_fineprint", label: "Intro fine print", type: "text", group: "Quiz intro" },
  { key: "quiz_unlocked_body", label: "Unlocked body — use {first_name}", type: "textarea", group: "Quiz unlocked" },
  { key: "quiz_unlocked_cta", label: "Unlocked button (CTA)", type: "text", group: "Quiz unlocked" },
  { key: "quiz_unlocked_fineprint", label: "Unlocked fine print", type: "text", group: "Quiz unlocked" },
];

export const TAGS = {
  WAITLIST: "EVENT -> JOIN -> WAITINGLIST",
  QUIZ: "EVENT -> ANSWER -> QUIZ",
};
