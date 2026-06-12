import { Suspense } from "react";
import Shell from "@/components/Shell";
import WaitlistForm from "./waitlist-form";

export default function WaitlistPage() {
  return (
    <Shell kicker="WAITING LIST // FIRST ACCESS">
      <div className="split">
        <div>
          <span className="eyebrow reveal d1">DOORS OPENING SOON</span>
          <h1 className="headline reveal d2">
            HACK THE
            <br />
            <span className="strike">HIRING&nbsp;GAME.</span>
          </h1>
          <p className="lede reveal d3">
            The job market isn&rsquo;t fair — it&rsquo;s a game with hidden rules.{" "}
            <strong>JobHackers.global</strong> teaches you the rules. Join the
            waiting list and be <strong>first through the door</strong> when we
            open — plus get an instant bonus the moment you&rsquo;re in.
          </p>
        </div>

        <div className="reveal d4">
          <Suspense fallback={null}>
            <WaitlistForm />
          </Suspense>
        </div>
      </div>
    </Shell>
  );
}
