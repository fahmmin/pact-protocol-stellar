import { Building2, Sparkles } from 'lucide-react';

const audiences = [
  {
    icon: Sparkles,
    title: 'For creators',
    headline: 'Get paid on delivery, not promises.',
    points: [
      'Budget is escrowed before you post — no ghosting after the campaign',
      'KPIs are agreed upfront so scope creep can\'t shrink your fee',
      'Automatic payout when metrics hit target — skip the 60-day invoice chase',
      'On-chain reputation grows with every completed deal',
    ],
  },
  {
    icon: Building2,
    title: 'For brands',
    headline: 'Pay for results, not hope.',
    points: [
      'Lock campaign budget in escrow — creators start work knowing it\'s real',
      'Define view and engagement targets before launch, not after',
      'Funds release only when an oracle verifies delivery against KPIs',
      'Cut admin time: no manual tracking, no payment disputes, no spreadsheets',
    ],
  },
];

export default function UseCases() {
  return (
    <section className="border-t border-landing-border bg-landing-bg px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-landing-text md:text-4xl">
            Built for the people doing the deal
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-landing-muted">
            Pact isn&apos;t another marketplace listing. It&apos;s the settlement layer that makes
            creator–brand partnerships enforceable.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {audiences.map((audience) => {
            const Icon = audience.icon;
            return (
              <div key={audience.title} className="landing-card p-6 md:p-8">
                <div className="mb-4 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-landing-accent" />
                  <span className="text-sm font-semibold text-landing-accent">{audience.title}</span>
                </div>
                <h3 className="mb-5 text-xl font-bold text-landing-text">{audience.headline}</h3>
                <ul className="space-y-3">
                  {audience.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-landing-muted">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-landing-accent" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
