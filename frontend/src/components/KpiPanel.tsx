'use client';

import { Activity, TrendingUp, Eye, Heart, Clock } from 'lucide-react';
import type { DailyMetricCheck } from '@/lib/agentApi';

interface Props {
  dealId: number;
  deadline: Date | null;
  dealStatus: number;
  dailyChecks: DailyMetricCheck[];
  oracleEngagementBps?: number | null;
}

export default function KpiPanel({
  dealId,
  deadline,
  dealStatus,
  dailyChecks,
  oracleEngagementBps,
}: Props) {
  const latest = dailyChecks[0];
  const now = new Date();
  const hoursLeft = deadline
    ? Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 3600000))
    : null;

  let readiness: 'not_ready' | 'under_review' | 'ready' = 'not_ready';
  if (dealStatus === 2) readiness = 'under_review';
  if (dealStatus >= 3) readiness = 'ready';

  const readinessLabel = {
    not_ready: { text: 'Not Ready', class: 'badge-gray' },
    under_review: { text: 'Under Oracle Review', class: 'badge-yellow' },
    ready: { text: 'Settlement Complete', class: 'badge-green' },
  }[readiness];

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
        <h4>DAILY KPI — DEAL #{dealId}</h4>
        <span className={`badge ${readinessLabel.class}`}>{readinessLabel.text}</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        {hoursLeft !== null && (
          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)' }}>
            <Clock size={14} style={{ color: 'var(--accent-yellow)', marginBottom: '0.25rem' }} />
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Deadline</div>
            <div style={{ fontWeight: 800 }}>{hoursLeft}h left</div>
          </div>
        )}
        {oracleEngagementBps != null && (
          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)' }}>
            <TrendingUp size={14} style={{ color: 'var(--accent-green)', marginBottom: '0.25rem' }} />
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Oracle engagement</div>
            <div style={{ fontWeight: 800 }}>{(oracleEngagementBps / 100).toFixed(1)}%</div>
          </div>
        )}
        {latest && (
          <>
            <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)' }}>
              <Activity size={14} style={{ marginBottom: '0.25rem' }} />
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Latest check</div>
              <div style={{ fontWeight: 800 }}>{(latest.engagement_bps / 100).toFixed(1)}%</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)' }}>
              <Heart size={14} style={{ marginBottom: '0.25rem' }} />
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Likes</div>
              <div style={{ fontWeight: 800 }}>{latest.likes.toLocaleString()}</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)' }}>
              <Eye size={14} style={{ marginBottom: '0.25rem' }} />
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Views</div>
              <div style={{ fontWeight: 800 }}>{latest.views.toLocaleString()}</div>
            </div>
          </>
        )}
      </div>

      {dailyChecks.length === 0 && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          No daily checks recorded yet. Oracle scheduler runs KPI reviews automatically.
        </p>
      )}

      {dailyChecks.length > 1 && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {dailyChecks.length} historical checks on file
        </div>
      )}
    </div>
  );
}
