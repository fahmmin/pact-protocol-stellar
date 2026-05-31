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
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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
          className="landing-input flex-1"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="landing-input sm:w-auto"
        >
          <option value="creator">I&apos;m a creator</option>
          <option value="brand">I&apos;m a brand</option>
        </select>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="landing-btn-primary shrink-0 rounded-full disabled:opacity-60"
        >
          {status === 'loading' ? 'Joining…' : 'Join Waitlist'}
        </button>
      </div>

      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

      {status === 'error' && (
        <p className="text-sm text-red-600">{message}</p>
      )}
    </form>
  );
}
