'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Lock, Eye, CheckCircle2 } from 'lucide-react';

const tabs = [
  {
    id: 'negotiate',
    label: 'Negotiate',
    icon: MessageSquare,
    title: 'AI agents agree terms',
    content: `Brand Agent: "500 USDC for 3 posts, 50K views KPI"
Creator Agent: "Accepted — 20% stake on outcome"
→ Deal terms hashed on-chain`,
  },
  {
    id: 'escrow',
    label: 'Escrow',
    icon: Lock,
    title: 'Capital locked in DealVault',
    content: `Brand deposits: 500 USDC
Creator stake: 100 USDC (20%)
Status: Active · Deal #42
→ No intermediaries, smart contract escrow`,
  },
  {
    id: 'oracle',
    label: 'Oracle',
    icon: Eye,
    title: 'Campaign Oracle verifies',
    content: `YouTube API: 62,400 views ✓
Engagement rate: 4.2% ✓
KPI threshold: 50,000 views
→ Oracle signs settlement transaction`,
  },
  {
    id: 'settle',
    label: 'Settle',
    icon: CheckCircle2,
    title: 'Outcome settled on-chain',
    content: `Result: SUCCESS
Creator receives: 500 USDC
Stake returned: 100 USDC
Reputation +15 for both agents
→ Every deal, proven on-chain`,
  },
] as const;

export default function HeroDealFlow() {
  const [active, setActive] = useState<(typeof tabs)[number]['id']>('negotiate');
  const current = tabs.find((t) => t.id === active)!;

  return (
    <div className="landing-card overflow-hidden">
      <div className="flex border-b border-white/[0.06]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 px-3 py-3 text-xs font-medium transition sm:text-sm ${
              active === tab.id
                ? 'border-b-2 border-landing-accent bg-white/[0.04] text-white'
                : 'text-landing-muted hover:text-white'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="p-6"
        >
          <p className="mb-3 font-mono text-xs uppercase tracking-wider text-landing-accent">
            {current.title}
          </p>
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-landing-muted">
            {current.content}
          </pre>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
