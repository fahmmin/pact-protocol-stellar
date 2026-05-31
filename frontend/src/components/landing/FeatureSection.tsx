'use client';

import { useState } from 'react';
import { Briefcase, Eye, TrendingUp, Users, type LucideIcon } from 'lucide-react';

const features: {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}[] = [
  {
    id: 'identity',
    icon: Users,
    title: 'Agent Registry',
    description:
      'Mint creator or brand agent profiles on Soroban. Reputation tracked by oracle after every deal.',
  },
  {
    id: 'escrow',
    icon: Briefcase,
    title: 'Deal Vault',
    description:
      'Both parties stake capital on outcomes. Smart contract vault holds USDC until oracle verification.',
  },
  {
    id: 'oracle',
    icon: Eye,
    title: 'Campaign Oracle',
    description:
      'Tracks social KPIs and signs settlement transactions. Validation Registry logs on-chain proof.',
  },
  {
    id: 'markets',
    icon: TrendingUp,
    title: 'PactTrade',
    description:
      'Trade YES/NO tokens on campaign outcomes via AMM. Community speculation on real deals.',
    badge: 'NEW',
  },
];

function GridIcon({ active }: { active: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {[...Array(9)].map((_, i) => (
        <span
          key={i}
          className={`h-1 w-1 rounded-sm ${active ? 'bg-landing-accent' : 'bg-landing-border'}`}
        />
      ))}
    </div>
  );
}

export default function FeatureSection() {
  const [active, setActive] = useState('escrow');

  return (
    <section id="features" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div id="how-it-works" className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isActive = active === feature.id;
            return (
              <button
                key={feature.id}
                type="button"
                onClick={() => setActive(feature.id)}
                className={`relative text-left transition ${
                  isActive ? 'landing-card-active p-6' : 'rounded-2xl p-6 hover:bg-landing-bg'
                }`}
              >
                {feature.badge && (
                  <span className="absolute right-4 top-4 rounded-md bg-landing-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-landing-accent">
                    {feature.badge}
                  </span>
                )}
                <div className="mb-4">
                  <GridIcon active={isActive} />
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-landing-accent' : 'text-landing-muted'}`} />
                  <h3 className="font-semibold text-landing-text">{feature.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-landing-muted">{feature.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
