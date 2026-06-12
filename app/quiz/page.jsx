import { Suspense } from "react";
import Shell from "@/components/Shell";
import QuizClient from "./quiz-client";

export const metadata = {
  title: "You're In — Unlock Your Bonus | JobHackers.global",
};

export default function QuizPage() {
  return (
    <Shell kicker="STEP 2 // THE 3-QUESTION UNLOCK">
      <Suspense fallback={null}>
        <QuizClient />
      </Suspense>
    </Shell>
  );
}
