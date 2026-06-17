import { Suspense } from "react";
import Shell from "@/components/Shell";
import WaitlistForm from "./waitlist-form";
import { loadContent } from "@/lib/content";

export default async function WaitlistPage() {
  const content = await loadContent();

  return (
    <Shell kicker={content.landing_kicker} footerTagline={content.footer_tagline}>
      <div className="split">
        <div>
          <span className="eyebrow reveal d1">{content.eyebrow}</span>
          <h1 className="headline reveal d2">
            {content.headline}
            <br />
            <span className="strike">{content.headline_strike}</span>
          </h1>
          <p className="lede reveal d3">{content.lede}</p>
        </div>

        <div className="reveal d4">
          <Suspense fallback={null}>
            <WaitlistForm content={content} />
          </Suspense>
        </div>
      </div>
    </Shell>
  );
}
