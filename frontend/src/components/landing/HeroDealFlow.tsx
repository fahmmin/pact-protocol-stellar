'use client';

import { useState } from 'react';
import { FileText, Lock, Eye, Wallet } from 'lucide-react';

const steps = [
  {
    id: 'terms',
    label: '1. Agree',
    icon: FileText,
    title: 'Both sides sign the same terms',
    creator: 'You know exactly what you\'re delivering and what you\'ll earn.',
    brand: 'Campaign scope and KPIs are locked before a dollar moves.',
  },
  {
    id: 'escrow',
    label: '2. Escrow',
    icon: Lock,
    title: 'Budget is locked before work starts',
    creator: 'No more "we\'ll pay you after approval" — funds are already committed.',
    brand: 'Budget stays in escrow until delivery is verified, not spent on promises.',
  },
  {
    id: 'verify',
    label: '3. Verify',
    icon: Eye,
    title: 'Delivery checked against agreed KPIs',
    creator: 'Views, engagement, and deliverables measured objectively — not argued in DMs.',
    brand: 'You only release payment when metrics actually hit the target.',
  },
  {
    id: 'pay',
    label: '4. Pay',
    icon: Wallet,
    title: 'Settlement happens automatically',
    creator: 'Get paid the moment KPIs are met. No invoice chasing.',
    brand: 'Close the campaign with a verified receipt, not a spreadsheet dispute.',
  },
] as const;

type StepId = (typeof steps)[number]['id'];

export default function HeroDealFlow() {
  const [active, setActive] = useState<StepId>('terms');
  const current = steps.find((s) => s.id === active)!;

  return (
    <section id="how-it-works" className="px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-landing-text md:text-4xl">
            How a deal works on Pact
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-landing-muted">
            Four steps replace the back-and-forth that slows manual sponsorships.
          </p>
        </div>

        <div className="landing-card overflow-hidden">
          <div className="flex overflow-x-auto border-b border-landing-border">
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setActive(step.id)}
                className={`flex min-w-[7rem] flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition ${
                  active === step.id
                    ? 'border-b-2 border-landing-accent bg-landing-bg text-landing-text'
                    : 'text-landing-muted hover:text-landing-text'
                }`}
              >
                <step.icon className="h-4 w-4" />
                {step.label}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8">
            <h3 className="mb-6 text-lg font-semibold text-landing-text">{current.title}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-landing-border bg-landing-bg p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-landing-accent">
                  For creators
                </p>
                <p className="text-sm leading-relaxed text-landing-muted">{current.creator}</p>
              </div>
              <div className="rounded-xl border border-landing-border bg-landing-bg p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-landing-nav">
                  For brands
                </p>
                <p className="text-sm leading-relaxed text-landing-muted">{current.brand}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
