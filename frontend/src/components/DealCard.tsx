'use client';

import Link from 'next/link';
import { Deal } from '@/lib/contracts';
import {
  DEAL_STATUS_LABELS,
  DEAL_STATUS_COLORS,
  STELLAR_EXPERT_URL,
} from '@/lib/constants';
import { formatUsdc, shortAddr } from '@/lib/stellar';
import { ExternalLink, Clock, DollarSign, Shield } from 'lucide-react';

interface Props {
  deal: Deal;
  highlight?: boolean;
  highlightWallet?: string;
}

export default function DealCard({ deal, highlight, highlightWallet }: Props) {
  const isParty =
    highlight ||
    (highlightWallet &&
      (deal.creator_wallet === highlightWallet || deal.brand_wallet === highlightWallet));
  const statusLabel = DEAL_STATUS_LABELS[deal.status] ?? 'Unknown';
  const statusClass = DEAL_STATUS_COLORS[deal.status] ?? 'badge-gray';

  const deadline = new Date(Number(deal.deadline) * 1000);
  const isExpired = deadline < new Date();
  const deadlineStr = deadline.toLocaleDateString();

  return (
    <div className={`card ${isParty ? '' : 'card-dim'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
          }}
        >
          DEAL #{deal.deal_id}
        </span>
        <span className={`badge ${statusClass}`}>{statusLabel}</span>
      </div>

      {/* Parties */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            Creator
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            Agent #{deal.creator_agent_id}
          </div>
          <div className="address" style={{ fontSize: '0.68rem' }}>
            {shortAddr(deal.creator_wallet)}
          </div>
        </div>

        <div style={{ color: 'var(--accent-yellow)', fontWeight: 800, fontSize: '1.2rem' }}>
          ⇄
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            Brand
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            Agent #{deal.brand_agent_id}
          </div>
          <div className="address" style={{ fontSize: '0.68rem' }}>
            {shortAddr(deal.brand_wallet)}
          </div>
        </div>
      </div>

      {/* Financials */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.5rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-dim)',
          padding: '0.6rem',
          marginBottom: '0.75rem',
          fontSize: '0.8rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Payment
          </div>
          <div style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
            ${formatUsdc(deal.payment_usdc)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            C.Stake
          </div>
          <div style={{ color: 'var(--accent-yellow)', fontWeight: 700 }}>
            ${formatUsdc(deal.creator_stake)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            B.Stake
          </div>
          <div style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>
            ${formatUsdc(deal.brand_stake)}
          </div>
        </div>
      </div>

      {/* Deadline + actions */}
      <div className="flex items-center justify-between">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.72rem',
            color: isExpired ? 'var(--accent-pink)' : 'var(--text-muted)',
          }}
        >
          <Clock size={11} />
          {isExpired ? 'Expired ' : 'Due '}{deadlineStr}
        </div>
        <Link href={`/deals/${deal.deal_id}`} className="btn btn-sm btn-outline">
          View →
        </Link>
      </div>
    </div>
  );
}
