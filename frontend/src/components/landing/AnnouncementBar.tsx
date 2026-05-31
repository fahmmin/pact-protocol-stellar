'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function AnnouncementBar() {
  return (
    <div className="bg-landing-accent">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-sm font-medium text-white">
        <span>Now on Stellar Testnet — escrow &amp; oracle settlement live</span>
        <Link
          href="#contracts"
          className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
        >
          View contracts
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
