'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { LANDING_FAQS as faqs } from '@/lib/faq';

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
