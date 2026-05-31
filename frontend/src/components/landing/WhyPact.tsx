import { Check, X } from 'lucide-react';

const manualPain = [
  'Budget held in email threads — no guarantee it exists',
  'KPIs argued after the campaign ends',
  'Creators wait 30–90 days (or never get paid)',
  'Brands pay without proof metrics were hit',
  'Disputes handled over DMs with no neutral arbiter',
];

const pactBenefits = [
  'Brand budget locked in escrow before work starts',
  'KPIs agreed and signed by both parties upfront',
  'Payment releases automatically when oracle verifies delivery',
  'Creators get paid on proof, not promises',
  'Every step logged on-chain — no he-said-she-said',
];

export default function WhyPact() {
  return (
    <section id="why-pact" className="border-y border-landing-border bg-landing-surface px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-landing-text md:text-4xl">
            Manual deals break down.{' '}
            <span className="text-landing-accent">Pact fixes the process.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-landing-muted">
            Whether you&apos;re a creator tired of chasing brands or a brand tired of guessing
            if campaigns delivered — the problem is the same: trust without enforcement.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-landing-border bg-landing-bg p-6 md:p-8">
            <p className="mb-5 text-sm font-semibold uppercase tracking-wide text-landing-muted">
              Manual process
            </p>
            <ul className="space-y-4">
              {manualPain.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-landing-nav">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="landing-card p-6 md:p-8">
            <p className="mb-5 text-sm font-semibold uppercase tracking-wide text-landing-accent">
              Through Pact Protocol
            </p>
            <ul className="space-y-4">
              {pactBenefits.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-landing-text">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
