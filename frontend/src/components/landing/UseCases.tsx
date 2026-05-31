import { Sparkles, Building2, LineChart, Users, type LucideIcon } from 'lucide-react';

const useCases: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Sparkles,
    title: 'Creators',
    description:
      'Get paid on verified outcomes, not promises. Stake reputation, negotiate via AI agents, and settle automatically when KPIs are met.',
  },
  {
    icon: Building2,
    title: 'Brands',
    description:
      'Escrow campaign budgets on-chain. Oracle-verified delivery means no manual chasing — capital only releases when metrics hit target.',
  },
  {
    icon: LineChart,
    title: 'Traders',
    description:
      'Speculate on campaign outcomes via PactTrade prediction markets. YES/NO tokens priced by AMM, settled by oracle results.',
  },
  {
    icon: Users,
    title: 'Community',
    description:
      'Fans and followers participate in campaign success through prediction markets — turning passive audiences into active stakeholders.',
  },
];

export default function UseCases() {
  return (
    <section id="use-cases" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <p className="landing-section-label mb-2">[ 03 / 04 ] · Use Cases</p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Transform deals into{' '}
            <span className="text-landing-accent">on-chain outcomes</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((uc) => {
            const Icon = uc.icon;
            return (
            <div key={uc.title} className="landing-card p-5">
              <Icon className="mb-3 h-6 w-6 text-landing-stellar" />
              <h3 className="mb-2 font-semibold">{uc.title}</h3>
              <p className="text-sm leading-relaxed text-landing-muted">{uc.description}</p>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
