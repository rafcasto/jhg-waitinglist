import { Suspense } from "react";
import Shell from "@/components/Shell";
import WaitlistForm from "./waitlist-form";

export default function WaitlistPage() {
  return (
    <Shell kicker="Waiting list · First access">
      <div className="split">
        <div>
          <span className="eyebrow reveal d1">JobHackers Global</span>
          <h1 className="headline reveal d2">
            Get a job you love.
            <br />
            <span className="strike">Doors open soon.</span>
          </h1>
          <p className="lede reveal d3">
            Escape career limbo. Bypass the application black hole and land the
            salary you deserve. Join the waiting list to be{" "}
            <strong>first through the door</strong> when the next cohort opens —
            plus get an instant bonus the moment you&rsquo;re in.
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
