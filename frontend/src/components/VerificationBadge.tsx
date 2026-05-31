'use client';

import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

interface Props {
  verified: boolean;
  pending?: boolean;
  size?: 'sm' | 'md';
}

export default function VerificationBadge({ verified, pending, size = 'sm' }: Props) {
  const fontSize = size === 'sm' ? '0.65rem' : '0.75rem';
  const padding = size === 'sm' ? '0.15rem 0.4rem' : '0.25rem 0.6rem';

  if (pending) {
    return (
      <span
        className="badge badge-yellow"
        style={{ fontSize, padding, display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        <Clock size={10} /> PENDING REVIEW
      </span>
    );
  }

  if (verified) {
    return (
      <span
        className="badge badge-green"
        style={{ fontSize, padding, display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        <ShieldCheck size={10} /> VERIFIED
      </span>
    );
  }

  return (
    <span
      className="badge badge-gray"
      style={{ fontSize, padding, display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      <ShieldAlert size={10} /> UNVERIFIED
    </span>
  );
}
