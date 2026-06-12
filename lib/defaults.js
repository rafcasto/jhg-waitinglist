// Default quiz config. Used as a fallback if the jobhackers_quiz_config
// table is empty or unreachable, and as the seed row in the migration.
export const DEFAULT_CONFIG = {
  quiz_title: "Unlock the Five Finger Interview Maximizer",
  quiz_subtitle:
    "Answer 3 quick questions and we'll hand you the 5-point system to walk into any interview — formal or informal — with total confidence.",
  unlock_label: "The 3-Question Unlock",
  lead_magnet_url:
    "https://drive.google.com/file/d/1O870dTwBsN_BLJoLcEbfxrtPkAs4bueb/view?usp=sharing",
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

export const TAGS = {
  WAITLIST: "EVENT -> JOIN -> WAITINGLIST",
  QUIZ: "EVENT -> ANSWER -> QUIZ",
};
