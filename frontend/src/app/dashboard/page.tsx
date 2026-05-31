'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import DealCard from '@/components/DealCard';
import VerificationBadge from '@/components/VerificationBadge';
import {
  getDeal,
  getAgentProfile,
  Deal,
} from '@/lib/contracts';
import { getVerificationStatus } from '@/lib/agentApi';
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  Clock,
  Loader,
  Zap,
} from 'lucide-react';

const MAX_DEAL_SCAN = 30;

type DealBucket = 'action' | 'active' | 'oracle' | 'settled';

function bucketDeal(deal: Deal, wallet: string, agentId: number): DealBucket | null {
  const isCreator = deal.creator_wallet === wallet || deal.creator_agent_id === agentId;
  const isBrand = deal.brand_wallet === wallet || deal.brand_agent_id === agentId;
  if (!isCreator && !isBrand) return null;

  if (deal.status === 3 || deal.status === 4 || deal.status === 5) return 'settled';
  if (deal.status === 2) return 'oracle';
  if (deal.status === 1) return 'active';
  if (deal.status === 0) return 'action';
  return null;
}

function actionLabel(deal: Deal, wallet: string): string {
  if (deal.status === 0) return 'Deposit stakes';
  if (deal.status === 1 && deal.creator_wallet === wallet) return 'Submit delivery';
  if (deal.status === 1) return 'Awaiting creator delivery';
  if (deal.status === 2) return 'Awaiting oracle settlement';
  return '';
}

export default function DashboardPage() {
  const { isWalletConnected, walletAddress, agentId, agentType } = useAppStore();
  const [profile, setProfile] = useState<{ verified: boolean; handle: string } | null>(null);
  const [verificationPending, setVerificationPending] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agentId) return;
    getAgentProfile(agentId).then((p) => setProfile({ verified: p.verified, handle: p.handle }));
    getVerificationStatus(agentId)
      .then((r) => setVerificationPending(r.latest_request?.status === 'pending'))
      .catch(() => {});
  }, [agentId]);

  useEffect(() => {
    if (!walletAddress) return;
    async function loadDeals() {
      setLoading(true);
      const found: Deal[] = [];
      await Promise.allSettled(
        Array.from({ length: MAX_DEAL_SCAN }, (_, i) => i + 1).map(async (id) => {
          try {
            const d = await getDeal(id);
            if (
              d.creator_wallet === walletAddress ||
              d.brand_wallet === walletAddress ||
              (agentId && (d.creator_agent_id === agentId || d.brand_agent_id === agentId))
            ) {
              found.push(d);
            }
          } catch {
            /* deal does not exist */
          }
        })
      );
      setDeals(found);
      setLoading(false);
    }
    loadDeals();
  }, [walletAddress, agentId]);

  const buckets = useMemo(() => {
    const action: Deal[] = [];
    const active: Deal[] = [];
    const oracle: Deal[] = [];
    const settled: Deal[] = [];
    if (!walletAddress) return { action, active, oracle, settled };

    for (const d of deals) {
      const b = bucketDeal(d, walletAddress, agentId ?? 0);
      if (b === 'action') action.push(d);
      else if (b === 'active') active.push(d);
      else if (b === 'oracle') oracle.push(d);
      else if (b === 'settled') settled.push(d);
    }
    return { action, active, oracle, settled };
  }, [deals, walletAddress, agentId]);

  const roleLabel = agentType === 'Brand' ? 'BRAND' : agentType === 'Creator' ? 'CREATOR' : 'USER';
  const roleColor =
    agentType === 'Brand' ? 'var(--accent-blue)' : 'var(--accent-pink)';

  if (!isWalletConnected) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <Zap size={48} style={{ color: 'var(--accent-yellow)', margin: '0 auto 1rem' }} />
        <h2>Connect your wallet</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Connect Freighter to see your creator or brand dashboard.
        </p>
        <Link href="/" className="btn">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div className="section-eyebrow">{roleLabel} DASHBOARD</div>
      <div className="flex items-center gap-2" style={{ marginBottom: '2rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>
          TODAY&apos;S <span style={{ color: roleColor }}>ACTIONS</span>
        </h1>
        {profile && (
          <VerificationBadge
            verified={profile.verified}
            pending={verificationPending && !profile.verified}
          />
        )}
      </div>

      <OnboardingChecklist
        walletConnected={isWalletConnected}
        agentRegistered={!!agentId}
        verified={profile?.verified ?? false}
        hasDeal={deals.length > 0}
        agentType={agentType}
      />

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Loader size={16} className="spinner" /> Loading your deals…
        </div>
      ) : (
        <>
          {buckets.action.length > 0 && (
            <section style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} style={{ color: 'var(--accent-pink)' }} />
                NEEDS MY ACTION ({buckets.action.length})
              </h3>
              <div className="grid-2">
                {buckets.action.map((d) => (
                  <div key={d.deal_id}>
                    <DealCard deal={d} highlightWallet={walletAddress!} />
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-yellow)', marginTop: '0.25rem', fontWeight: 700 }}>
                      → {actionLabel(d, walletAddress!)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {buckets.active.length > 0 && (
            <section style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={18} /> ACTIVE DEALS ({buckets.active.length})
              </h3>
              <div className="grid-2">
                {buckets.active.map((d) => (
                  <DealCard key={d.deal_id} deal={d} highlightWallet={walletAddress!} />
                ))}
              </div>
            </section>
          )}

          {buckets.oracle.length > 0 && (
            <section style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} style={{ color: 'var(--accent-blue)' }} />
                PENDING ORACLE REVIEW ({buckets.oracle.length})
              </h3>
              <div className="grid-2">
                {buckets.oracle.map((d) => (
                  <DealCard key={d.deal_id} deal={d} highlightWallet={walletAddress!} />
                ))}
              </div>
            </section>
          )}

          {buckets.settled.length > 0 && (
            <section style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} style={{ color: 'var(--accent-green)' }} />
                SETTLED ({buckets.settled.length})
              </h3>
              <div className="grid-2">
                {buckets.settled.map((d) => (
                  <DealCard key={d.deal_id} deal={d} highlightWallet={walletAddress!} />
                ))}
              </div>
            </section>
          )}

          {deals.length === 0 && !loading && (
            <div className="card card-dim" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ marginBottom: '1rem' }}>No deals yet. Create or join a campaign deal.</p>
              <Link href="/deals" className="btn">
                Browse Deals
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
