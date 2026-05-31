'use client';

import { AgentProfile, ReputationScore } from '@/lib/contracts';
import {
  TIER_LABELS,
  TIER_COLORS,
  STELLAR_EXPERT_URL,
  USDC_DECIMALS,
} from '@/lib/constants';
import { shortAddr, formatUsdc } from '@/lib/stellar';
import { ExternalLink, Star } from 'lucide-react';
import VerificationBadge from '@/components/VerificationBadge';

interface Props {
  id: number;
  profile: AgentProfile;
  score: ReputationScore;
  isCurrentUser?: boolean;
}

export default function AgentCard({ id, profile, score, isCurrentUser }: Props) {
  const tierKey = String(score.tier ?? 0);
  const tierLabel = TIER_LABELS[tierKey] || 'Bronze';
  const tierClass = TIER_COLORS[tierKey] || 'badge-gray';

  const successRate =
    score.total_deals > 0
      ? Math.round((score.successful_deals / score.total_deals) * 100)
      : 0;

  const agentTypeColor =
    profile.agent_type === 'Creator' ? 'var(--accent-pink)' : 'var(--accent-blue)';

  return (
    <div
      className={`card ${isCurrentUser ? '' : 'card-dim'}`}
      style={isCurrentUser ? {} : { borderColor: 'var(--border-dim)', boxShadow: 'none' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
            }}
          >
            #{id}
          </span>
          <span
            className="badge"
            style={{
              color: agentTypeColor,
              borderColor: agentTypeColor,
              fontSize: '0.65rem',
            }}
          >
            {profile.agent_type}
          </span>
        </div>
        <div className="flex items-center gap-1" style={{ flexWrap: 'wrap' }}>
          {profile.agent_type === 'Creator' && (
            <VerificationBadge verified={profile.verified} size="sm" />
          )}
          <span className={`badge ${tierClass}`}>
            <Star size={9} />
            {tierLabel}
          </span>
          {isCurrentUser && (
            <span className="badge badge-green">YOU</span>
          )}
        </div>
      </div>

      {/* Handle */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.15rem' }}>
          {profile.handle}
        </div>
        {profile.platform && profile.platform !== 'brand' && (
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {profile.platform}
            {profile.follower_count > 0 && (
              <> · {Number(profile.follower_count).toLocaleString()} followers</>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.75rem',
          padding: '0.75rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-dim)',
          marginBottom: '0.75rem',
        }}
      >
        <div className="stat-block" style={{ gap: '0.15rem' }}>
          <span className="stat-label">Deals</span>
          <span className="stat-value" style={{ fontSize: '1.2rem' }}>
            {score.total_deals}
          </span>
        </div>
        <div className="stat-block" style={{ gap: '0.15rem' }}>
          <span className="stat-label">Success</span>
          <span className="stat-value" style={{ fontSize: '1.2rem' }}>
            {successRate}%
          </span>
        </div>
        <div className="stat-block" style={{ gap: '0.15rem' }}>
          <span className="stat-label">Volume</span>
          <span className="stat-value" style={{ fontSize: '1.2rem' }}>
            ${formatUsdc(score.total_volume_usdc)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            marginBottom: '0.3rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          <span>Success Rate</span>
          <span>{successRate}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${successRate}%` }} />
        </div>
      </div>

      {/* Wallet address */}
      <a
        href={`${STELLAR_EXPERT_URL}/account/${profile.wallet}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          textDecoration: 'none',
        }}
      >
        <span className="address-short">{shortAddr(profile.wallet)}</span>
        <ExternalLink size={10} style={{ color: 'var(--text-muted)' }} />
      </a>
    </div>
  );
}
