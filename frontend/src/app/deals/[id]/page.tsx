'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import TxStatus from '@/components/TxStatus';
import DealGuidelines from '@/components/DealGuidelines';
import KpiPanel from '@/components/KpiPanel';
import {
  getDeal,
  getAgentProfile,
  buildDepositStakes,
  buildSubmitDelivery,
  hasOracleResult,
  getOracleResult,
  Deal,
  AgentProfile,
} from '@/lib/contracts';
import { getDealMetrics } from '@/lib/agentApi';
import {
  DEAL_STATUS_LABELS,
  DEAL_STATUS_COLORS,
  STELLAR_EXPERT_URL,
} from '@/lib/constants';
import { formatUsdc, shortAddr } from '@/lib/stellar';
import { signWithFreighter } from '@/lib/freighter';
import { ArrowLeft, ExternalLink, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function DealDetailPage() {
  const params = useParams();
  const dealId = parseInt(params.id as string);

  const { isWalletConnected, walletAddress, tx, setTxStatus, submitTx } = useAppStore();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<AgentProfile | null>(null);
  const [brandProfile, setBrandProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oracleEngagement, setOracleEngagement] = useState<number | null>(null);
  const [dealMetrics, setDealMetrics] = useState<{
    daily_checks: import('@/lib/agentApi').DailyMetricCheck[];
    compliance_actions: import('@/lib/agentApi').ComplianceAction[];
  } | null>(null);

  async function loadDeal() {
    setLoading(true);
    setError(null);
    try {
      const d = await getDeal(dealId);
      setDeal(d);
      await Promise.allSettled([
        getAgentProfile(d.creator_agent_id).then(setCreatorProfile).catch(() => {}),
        getAgentProfile(d.brand_agent_id).then(setBrandProfile).catch(() => {}),
        hasOracleResult(dealId).then(async (has) => {
          if (has) {
            const r = await getOracleResult(dealId);
            setOracleEngagement(r.engagement_bps);
          }
        }),
        getDealMetrics(dealId).then(setDealMetrics).catch(() => setDealMetrics(null)),
      ]);
    } catch (err: any) {
      setError(`Deal #${dealId} not found on-chain.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDeal(); }, [dealId]);

  async function signAndSubmit(buildFn: () => Promise<string>, label: string) {
    if (!walletAddress) return;
    setTxStatus('building', { message: `Building ${label}…` });
    try {
      const xdr = await buildFn();
      setTxStatus('signing', { message: `Sign the ${label} transaction in Freighter` });
      const signedXdr = await signWithFreighter(xdr);
      await submitTx(signedXdr);
      await loadDeal();
    } catch (err: any) {
      if (tx.status !== 'error') setTxStatus('error', { error: err.message });
    }
  }

  const isCreator = walletAddress && deal && deal.creator_wallet === walletAddress;
  const isBrand = walletAddress && deal && deal.brand_wallet === walletAddress;
  const isParty = isCreator || isBrand;

  const statusLabel = deal ? (DEAL_STATUS_LABELS[deal.status] ?? 'Unknown') : '';
  const statusClass = deal ? (DEAL_STATUS_COLORS[deal.status] ?? 'badge-gray') : '';

  const deadline = deal ? new Date(Number(deal.deadline) * 1000) : null;
  const isExpired = deadline && deadline < new Date();

  // Timeline steps
  const steps = [
    { label: 'Created', done: true },
    { label: 'Stakes Deposited', done: deal ? deal.status >= 1 : false },
    { label: 'Delivered', done: deal ? deal.status >= 2 : false },
    { label: 'Settled', done: deal ? deal.status >= 3 : false },
  ];

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <Link href="/deals" className="btn btn-ghost btn-sm" style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={13} /> Back to Deals
      </Link>

      <TxStatus />

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          <Loader size={16} className="spinner" /> Loading deal…
        </div>
      ) : error ? (
        <div className="card card-pink" style={{ padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={32} style={{ color: 'var(--accent-pink)', margin: '0 auto 1rem' }} />
          <p>{error}</p>
        </div>
      ) : deal && (
        <div>
          {/* Header */}
          <div className="section-eyebrow">DEAL VAULT</div>
          <div className="flex items-center gap-2" style={{ marginBottom: '2rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)' }}>
              DEAL <span style={{ color: 'var(--accent-yellow)' }}>#{deal.deal_id}</span>
            </h1>
            <span className={`badge ${statusClass}`} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>
              {statusLabel}
            </span>
            {isParty && <span className="badge badge-green">YOU ARE A PARTY</span>}
          </div>

          <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'start' }}>
            {/* Left: Details */}
            <div>
              {/* Parties */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>PARTIES</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Creator</div>
                    <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>
                      {creatorProfile?.handle || `Agent #${deal.creator_agent_id}`}
                    </div>
                    <a
                      href={`${STELLAR_EXPERT_URL}/account/${deal.creator_wallet}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="address"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--accent-yellow)' }}
                    >
                      {shortAddr(deal.creator_wallet)}
                      <ExternalLink size={10} />
                    </a>
                    {isCreator && <div style={{ marginTop: '0.3rem' }}><span className="badge badge-yellow" style={{ fontSize: '0.6rem' }}>YOU</span></div>}
                  </div>

                  <div style={{ color: 'var(--accent-yellow)', fontWeight: 800, fontSize: '1.4rem' }}>⇄</div>

                  <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Brand</div>
                    <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>
                      {brandProfile?.handle || `Agent #${deal.brand_agent_id}`}
                    </div>
                    <a
                      href={`${STELLAR_EXPERT_URL}/account/${deal.brand_wallet}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="address"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--accent-yellow)' }}
                    >
                      {shortAddr(deal.brand_wallet)}
                      <ExternalLink size={10} />
                    </a>
                    {isBrand && <div style={{ marginTop: '0.3rem' }}><span className="badge badge-blue" style={{ fontSize: '0.6rem' }}>YOU</span></div>}
                  </div>
                </div>
              </div>

              {/* Financials */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>FINANCIALS (USDC)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { label: 'Payment to Creator', value: `$${formatUsdc(deal.payment_usdc)}`, color: 'var(--accent-green)' },
                    { label: 'Creator Stake', value: `$${formatUsdc(deal.creator_stake)}`, color: 'var(--accent-yellow)' },
                    { label: 'Brand Stake', value: `$${formatUsdc(deal.brand_stake)}`, color: 'var(--accent-blue)' },
                    {
                      label: 'Total Locked',
                      value: `$${formatUsdc(deal.payment_usdc + deal.creator_stake + deal.brand_stake)}`,
                      color: 'var(--text-primary)',
                      bold: true,
                    },
                  ].map(({ label, value, color, bold }) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--bg-secondary)',
                        fontSize: '0.85rem',
                        borderBottom: '1px solid var(--border-dim)',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ color, fontWeight: bold ? 800 : 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deadline */}
              <div
                className="card card-dim"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderColor: isExpired ? 'var(--accent-pink)' : 'var(--border-dim)',
                }}
              >
                <Clock size={16} style={{ color: isExpired ? 'var(--accent-pink)' : 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {isExpired ? 'Expired' : 'Deadline'}
                  </div>
                  <div style={{ fontWeight: 700, color: isExpired ? 'var(--accent-pink)' : 'var(--text-primary)' }}>
                    {deadline?.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Timeline + Actions */}
            <div>
              <KpiPanel
                dealId={deal.deal_id}
                deadline={deadline}
                dealStatus={deal.status}
                dailyChecks={dealMetrics?.daily_checks ?? []}
                oracleEngagementBps={oracleEngagement}
              />

              <DealGuidelines
                dealStatus={deal.status}
                complianceActions={dealMetrics?.compliance_actions ?? []}
              />

              {/* Timeline */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1.25rem' }}>DEAL LIFECYCLE</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {steps.map(({ label, done }, i) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            border: `2px solid ${done ? 'var(--accent-green)' : 'var(--border-dim)'}`,
                            background: done ? 'var(--accent-green)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {done && <CheckCircle size={14} style={{ color: '#000' }} />}
                        </div>
                        {i < steps.length - 1 && (
                          <div
                            style={{
                              width: '2px',
                              height: '32px',
                              background: done && steps[i + 1]?.done ? 'var(--accent-green)' : 'var(--border-dim)',
                            }}
                          />
                        )}
                      </div>
                      <div style={{ paddingTop: '2px', paddingBottom: i < steps.length - 1 ? '1.5rem' : 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {isWalletConnected && (
                <div className="card">
                  <h4 style={{ marginBottom: '1rem' }}>ACTIONS</h4>

                  {deal.status === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Deal is pending. Both parties must deposit their stakes to activate it.
                      </p>
                      <button
                        className="btn"
                        disabled={!isParty || tx.status === 'pending' || tx.status === 'building'}
                        onClick={() => signAndSubmit(
                          () => buildDepositStakes(walletAddress!, deal.deal_id),
                          'Deposit Stakes'
                        )}
                      >
                        DEPOSIT STAKES
                      </button>
                    </div>
                  )}

                  {deal.status === 1 && isCreator && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Deal is active. Submit delivery to mark content as delivered.
                      </p>
                      <button
                        className="btn btn-pink"
                        disabled={tx.status === 'pending' || tx.status === 'building'}
                        onClick={() => signAndSubmit(
                          () => buildSubmitDelivery(walletAddress!, deal.deal_id),
                          'Submit Delivery'
                        )}
                      >
                        SUBMIT DELIVERY
                      </button>
                    </div>
                  )}

                  {deal.status === 2 && (
                    <div
                      style={{
                        padding: '0.75rem',
                        background: 'rgba(0, 212, 255, 0.05)',
                        border: '1px solid rgba(0, 212, 255, 0.2)',
                        fontSize: '0.8rem',
                        color: 'var(--accent-blue)',
                      }}
                    >
                      ⏳ Delivered. Awaiting oracle settlement. The Campaign Oracle will verify and settle this deal.
                    </div>
                  )}

                  {deal.status === 3 && (
                    <div
                      style={{
                        padding: '0.75rem',
                        background: 'rgba(0, 255, 136, 0.05)',
                        border: '1px solid rgba(0, 255, 136, 0.2)',
                        fontSize: '0.8rem',
                        color: 'var(--accent-green)',
                      }}
                    >
                      ✅ Deal settled successfully. All funds distributed.
                    </div>
                  )}

                  {!isParty && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      You are not a party to this deal.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
