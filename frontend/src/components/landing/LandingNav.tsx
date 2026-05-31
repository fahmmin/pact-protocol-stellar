'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';

const navLinks = [
  { href: '#why-pact', label: 'Why Pact' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#faq', label: 'FAQ' },
];

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-landing-border bg-landing-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-landing-text">
          <Zap className="h-5 w-5 fill-landing-accent text-landing-accent" />
          <span>Pact Protocol</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-landing-nav transition hover:text-landing-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#waitlist" className="landing-btn-primary rounded-full px-5 text-sm">
          Join Waitlist
        </a>
      </div>
    </header>
  );
}
