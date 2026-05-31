'use client';

import { useState, FormEvent } from 'react';
import clsx from 'clsx';

type Role = 'creator' | 'brand' | 'trader' | 'other';

interface WaitlistFormProps {
  variant?: 'hero' | 'footer';
}

export default function WaitlistForm({ variant = 'hero' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('creator');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, website: '' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
      setMessage(data.message || "You're on the list!");
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to join waitlist');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div
        className={clsx(
          'flex gap-2',
          variant === 'hero' ? 'flex-col sm:flex-row' : 'flex-col'
        )}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="flex-1 rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-landing-muted focus:border-landing-accent focus:outline-none"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-landing-accent focus:outline-none"
        >
          <option value="creator">Creator</option>
          <option value="brand">Brand</option>
          <option value="trader">Trader</option>
          <option value="other">Other</option>
        </select>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="landing-btn-primary shrink-0 disabled:opacity-60"
        >
          {status === 'loading' ? 'Joining…' : 'Join Waitlist'}
        </button>
      </div>

      {/* Honeypot — hidden from users */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

      {status === 'error' && (
        <p className="text-sm text-red-400">{message}</p>
      )}
    </form>
  );
}
