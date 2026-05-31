'use client';

import Link from 'next/link';
import { CheckCircle, Circle, Wallet, User, Shield, Briefcase } from 'lucide-react';

interface Props {
  walletConnected: boolean;
  agentRegistered: boolean;
  verified: boolean;
  hasDeal: boolean;
  agentType: 'Creator' | 'Brand' | null;
}

export default function OnboardingChecklist({
  walletConnected,
  agentRegistered,
  verified,
  hasDeal,
  agentType,
}: Props) {
  const steps = [
    {
      id: 'wallet',
      label: 'Connect Freighter wallet',
      done: walletConnected,
      href: null,
      icon: Wallet,
    },
    {
      id: 'register',
      label: `Register ${agentType || 'creator or brand'} agent`,
      done: agentRegistered,
      href: '/agents',
      icon: User,
    },
    ...(agentType === 'Creator'
      ? [
          {
            id: 'verify',
            label: 'Submit social verification',
            done: verified,
            href: '/agents',
            icon: Shield,
          },
        ]
      : []),
    {
      id: 'deal',
      label: 'Create or join your first deal',
      done: hasDeal,
      href: '/deals',
      icon: Briefcase,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
        <h4>ONBOARDING CHECKLIST</h4>
        <span className="badge badge-yellow">{pct}% complete</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: '1rem' }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {steps.map(({ id, label, done, href, icon: Icon }) => (
          <div
            key={id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem',
              background: done ? 'rgba(0,255,136,0.05)' : 'var(--bg-secondary)',
              border: `1px solid ${done ? 'var(--accent-green)' : 'var(--border-dim)'}`,
            }}
          >
            {done ? (
              <CheckCircle size={18} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
            ) : (
              <Circle size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            )}
            <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: done ? 600 : 400 }}>
              {label}
            </span>
            {!done && href && (
              <Link href={href} className="btn btn-sm btn-ghost">
                Go →
              </Link>
            )}
            <Icon size={14} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
