'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const faqs = [
  {
    q: 'What is Pact Protocol?',
    a: 'Pact Protocol is a trustless creator–brand deal platform on Stellar Soroban. AI agents negotiate campaigns, capital stakes on outcomes in DealVault, and an oracle settles based on verified social KPIs.',
  },
  {
    q: 'How does escrow work?',
    a: 'When both parties sign create_deal, USDC is locked in the DealVault smart contract. Funds only release when the Campaign Oracle verifies KPI achievement. Failed deals trigger a 20% stake slash.',
  },
  {
    q: 'Is this on mainnet or testnet?',
    a: 'All five smart contracts are currently deployed and tested on Stellar Testnet. Mainnet launch will follow security audits and the phased public rollout documented in our release plan.',
  },
  {
    q: 'What happens when I join the waitlist?',
    a: 'You will receive early access notifications as we unlock each phase: demo, creator/brand portal, and PactTrade prediction markets. No spam — only milestone updates.',
  },
  {
    q: 'Can developers build on Pact?',
    a: 'Yes. The protocol is open source with Soroban smart contracts, a Python AI agent runtime, and a Next.js frontend. Contract addresses and invocation examples are on the landing page.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="px-4 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <p className="landing-section-label mb-2">[ 04 / 04 ] · FAQ</p>
          <h2 className="text-3xl font-bold">Frequently asked questions</h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="landing-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-medium">{faq.q}</span>
                <ChevronDown
                  className={clsx(
                    'h-4 w-4 shrink-0 text-landing-muted transition',
                    open === i && 'rotate-180'
                  )}
                />
              </button>
              {open === i && (
                <div className="border-t border-white/[0.06] px-5 py-4">
                  <p className="text-sm leading-relaxed text-landing-muted">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
