import { Suspense } from "react";
import Shell from "@/components/Shell";
import QuizClient from "./quiz-client";
import { loadContent } from "@/lib/content";

export const metadata = {
  title: "You're In — Unlock Your Bonus | JobHackers.global",
};

export default async function QuizPage() {
  const content = await loadContent();
  return (
    <Shell kicker="Step 2 · The 3-question unlock" footerTagline={content.footer_tagline}>
      <Suspense fallback={null}>
        <QuizClient />
      </Suspense>
    </Shell>
  );
}
