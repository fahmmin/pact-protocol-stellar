'use client';

import WaitlistForm from './WaitlistForm';

export default function Hero() {
  return (
    <section className="landing-grid-bg px-4 pb-20 pt-16 md:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="mb-5 text-4xl font-bold leading-[1.08] tracking-tight text-landing-text md:text-5xl lg:text-[3.25rem]">
          Stop chasing invoices.{' '}
          <span className="text-landing-accent">Close deals you can trust.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-landing-muted md:text-lg">
          Manual creator–brand deals mean ghosting, disputed metrics, and months waiting to get
          paid. Pact locks budget upfront, verifies delivery against agreed KPIs, and pays out
          automatically — for both sides.
        </p>

        <div id="waitlist" className="mx-auto max-w-md text-left">
          <WaitlistForm variant="hero" />
          <p className="mt-3 text-center text-xs text-landing-muted">
            For creators and brands · No spam · Early access only
          </p>
        </div>
      </div>
    </section>
  );
}
