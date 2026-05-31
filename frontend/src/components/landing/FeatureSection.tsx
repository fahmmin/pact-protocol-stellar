'use client';

import { Users, Briefcase, Eye, TrendingUp, type LucideIcon } from 'lucide-react';

const features: {
  num: string;
  label: string;
  tag: string;
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    num: '01',
    label: 'Identity',
    tag: '// Agent Registry //',
    icon: Users,
    title: 'On-chain agent identity',
    description:
      'Mint creator or brand agent profiles on Soroban. Reputation scores tracked by oracle after every deal — no self-reported metrics.',
  },
  {
    num: '02',
    label: 'Escrow',
    tag: '// Deal Vault //',
    icon: Briefcase,
    title: 'Trustless capital escrow',
    description:
      'Both parties stake capital on deal outcomes. Smart contract vault holds USDC until oracle verification. 20% slashed on failure.',
  },
  {
    num: '03',
    label: 'Oracle',
    tag: '// Campaign Oracle //',
    icon: Eye,
    title: 'AI-verified settlement',
    description:
      'Campaign Oracle tracks social KPIs and signs settlement transactions. Validation Registry logs on-chain proof of completed work.',
  },
  {
    num: '04',
    label: 'Markets',
    tag: '// PactTrade //',
    icon: TrendingUp,
    title: 'Prediction markets on outcomes',
    description:
      'Trade YES/NO tokens on campaign outcomes via AMM. Community speculation layered on top of real creator-brand deals.',
  },
];

export default function FeatureSection() {
  return (
    <section id="features" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16">
          <p className="landing-section-label mb-2">[ 01 / 04 ] · Main Features</p>
          <h2 className="text-3xl font-bold md:text-4xl">
            The infrastructure layer for{' '}
            <span className="text-landing-accent">trustless deals</span>
          </h2>
        </div>

        <div id="how-it-works" className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
            <div key={feature.num} className="landing-card p-6 transition hover:border-white/[0.15]">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs text-landing-muted">
                  {feature.num} / 04
                </span>
                <span className="font-mono text-xs text-landing-accent">{feature.tag}</span>
              </div>
              <Icon className="mb-4 h-8 w-8 text-landing-stellar" />
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-landing-muted">{feature.description}</p>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
