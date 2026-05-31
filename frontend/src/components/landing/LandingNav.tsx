'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#use-cases', label: 'Use cases' },
  { href: '#faq', label: 'FAQ' },
];

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-landing-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Zap className="h-5 w-5 text-landing-accent" />
          <span>Pact Protocol</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-landing-muted transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/fahmmin/pact-protocol-stellar"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-sm text-landing-muted transition hover:text-white sm:inline"
          >
            GitHub
          </a>
          <a href="#waitlist" className="landing-btn-primary text-sm">
            Join Waitlist
          </a>
        </div>
      </div>
    </header>
  );
}
