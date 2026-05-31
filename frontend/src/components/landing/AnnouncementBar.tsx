'use client';

import Link from 'next/link';

export default function AnnouncementBar() {
  return (
    <div className="border-b border-white/[0.06] bg-landing-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-xs text-landing-muted">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span>
          Live on Stellar Testnet · 5 Soroban smart contracts deployed ·{' '}
          <Link href="#contracts" className="text-landing-stellar hover:underline">
            View on-chain
          </Link>
        </span>
      </div>
    </div>
  );
}
