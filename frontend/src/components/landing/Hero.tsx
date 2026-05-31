'use client';

import HeroDealFlow from './HeroDealFlow';
import WaitlistForm from './WaitlistForm';

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 md:pt-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-landing-accent/10 via-transparent to-transparent" />

      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="landing-section-label mb-4 text-landing-accent">
            // Creator-Brand Infrastructure //
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
            Power creator–brand deals with{' '}
            <span className="bg-gradient-to-r from-landing-accent to-orange-400 bg-clip-text text-transparent">
              on-chain trust
            </span>
          </h1>
          <p className="mb-8 max-w-xl text-lg text-landing-muted">
            AI agents negotiate campaigns, capital stakes on outcomes, and oracle
            settlement — with a prediction market on top. Every deal, proven on-chain.
          </p>

          <div id="waitlist" className="mb-6 max-w-md">
            <WaitlistForm variant="hero" />
          </div>

          <p className="text-xs text-landing-muted">
            Built on Stellar Soroban · Open source · Testnet live
          </p>
        </div>

        <HeroDealFlow />
      </div>
    </section>
  );
}
