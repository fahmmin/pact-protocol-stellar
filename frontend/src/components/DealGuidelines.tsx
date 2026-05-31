'use client';

import { CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import type { ComplianceAction } from '@/lib/agentApi';

const ARTIFACT_STEPS = [
  { key: 'DealIntent', label: 'Deal intent agreed', owner: 'Both' },
  { key: 'RiskCheckpoint', label: 'Brand guidelines posted', owner: 'Brand' },
  { key: 'ContentSubmission', label: 'Content delivered', owner: 'Creator' },
  { key: 'SettlementAttestation', label: 'Oracle settlement', owner: 'Oracle' },
] as const;

interface Props {
  dealStatus: number;
  complianceActions: ComplianceAction[];
}

export default function DealGuidelines({ dealStatus, complianceActions }: Props) {
  const stepDone = (idx: number) => {
    if (idx === 0) return dealStatus >= 0;
    if (idx === 1) return dealStatus >= 1;
    if (idx === 2) return dealStatus >= 2;
    if (idx === 3) return dealStatus >= 3;
    return false;
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ marginBottom: '1rem' }}>GUIDELINE & COMPLIANCE</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {ARTIFACT_STEPS.map((step, i) => {
          const done = stepDone(i);
          return (
            <div
              key={step.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--bg-secondary)',
                border: `1px solid ${done ? 'var(--accent-green)' : 'var(--border-dim)'}`,
              }}
            >
              {done ? (
                <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
              ) : (
                <Circle size={16} style={{ color: 'var(--text-muted)' }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{step.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Responsible: {step.owner}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {complianceActions.length > 0 && (
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Compliance log
          </div>
          {complianceActions.slice(0, 5).map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.4rem 0',
                fontSize: '0.78rem',
                borderBottom: '1px solid var(--border-dim)',
              }}
            >
              <AlertTriangle
                size={14}
                style={{
                  color:
                    a.level === 'escalation'
                      ? 'var(--accent-pink)'
                      : 'var(--accent-yellow)',
                  flexShrink: 0,
                }}
              />
              <span>
                <strong>{a.level}</strong> — {a.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
