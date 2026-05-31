'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import TxStatus from '@/components/TxStatus';
import DealCard from '@/components/DealCard';
import {
  getDeal,
  buildCreateDeal,
  buildPostDealIntent,
  getAgentProfile,
  Deal,
} from '@/lib/contracts';
import {
  startNegotiationSession,
  advanceNegotiationRound,
  approveNegotiationTerms,
  type NegotiationSession,
} from '@/lib/agentApi';
import { signWithFreighter } from '@/lib/freighter';
import { parseUsdc } from '@/lib/stellar';
import { Briefcase, Plus, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

function DealsPageContent() {
  const searchParams = useSearchParams();
  const { isWalletConnected, walletAddress, tx, setTxStatus, submitTx } = useAppStore();

  const [tab, setTab] = useState<'list' | 'create'>('list');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);

  const [creatorId, setCreatorId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [payment, setPayment] = useState('');
  const [creatorStake, setCreatorStake] = useState('');
  const [brandStake, setBrandStake] = useState('');
  const [creatorWallet, setCreatorWallet] = useState('');
  const [brandWallet, setBrandWallet] = useState('');
  const [daysFromNow, setDaysFromNow] = useState('30');
  const [kpiThreshold, setKpiThreshold] = useState('500');
  const [matchProposalId, setMatchProposalId] = useState<number | null>(null);

  const [session, setSession] = useState<NegotiationSession | null>(null);
  const [negotiating, setNegotiating] = useState(false);
  const [termsApproved, setTermsApproved] = useState(false);
  const [creatorApproved, setCreatorApproved] = useState(false);
  const [brandApproved, setBrandApproved] = useState(false);
  const [verificationWarning, setVerificationWarning] = useState<string | null>(null);

  useEffect(() => {
    const c = searchParams.get('creator');
    const b = searchParams.get('brand');
    const m = searchParams.get('match');
    if (c) setCreatorId(c);
    if (b) setBrandId(b);
    if (m) setMatchProposalId(parseInt(m, 10));
    if (c || b) setTab('create');
  }, [searchParams]);

  useEffect(() => {
    if (walletAddress) setCreatorWallet(walletAddress);
  }, [walletAddress]);

  useEffect(() => {
    loadDeals();
  }, []);

  async function loadDeals() {
    setLoading(true);
    const found: Deal[] = [];
    await Promise.allSettled(
      Array.from({ length: 20 }, (_, i) => i + 1).map(async (id) => {
        try {
          const deal = await getDeal(id);
          found.push(deal);
        } catch {}
      })
    );
    found.sort((a, b) => b.deal_id - a.deal_id);
    setDeals(found);
    setLoading(false);
  }

  async function handleStartNegotiation() {
    if (!creatorId || !brandId || !payment || !creatorStake || !brandStake) {
      alert('Fill creator, brand, payment, and stakes first');
      return;
    }
    setNegotiating(true);
    setTermsApproved(false);
    setCreatorApproved(false);
    setBrandApproved(false);
    try {
      const deadlineSec = Math.floor(Date.now() / 1000) + parseInt(daysFromNow || '30') * 86400;
      const result = await startNegotiationSession({
        creator_id: creatorId,
        brand_id: brandId,
        payment_stroops: Number(parseUsdc(payment)),
        creator_stake_stroops: Number(parseUsdc(creatorStake)),
        brand_stake_stroops: Number(parseUsdc(brandStake)),
        deadline_ts: deadlineSec,
        kpi_threshold_bps: parseInt(kpiThreshold || '500', 10),
        match_proposal_id: matchProposalId ?? undefined,
      });
      if (result.status === 'error') {
        alert('Negotiation failed to start');
        return;
      }
      setSession(result.session);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Negotiation failed');
    } finally {
      setNegotiating(false);
    }
  }

  async function handleNextRound() {
    if (!session) return;
    setNegotiating(true);
    try {
      const result = await advanceNegotiationRound(session.id);
      setSession(result.session);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Round failed');
    } finally {
      setNegotiating(false);
    }
  }

  async function handleApproveTerms(party: 'creator' | 'brand') {
    if (!session || !walletAddress) return;
    try {
      const result = await approveNegotiationTerms(session.id, party, true);
      setSession(result.session);
      if (party === 'creator') setCreatorApproved(true);
      if (party === 'brand') setBrandApproved(true);
      if (result.session.status === 'approved') {
        setTermsApproved(true);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Approval failed');
    }
  }

  async function handlePostDealIntent() {
    if (!session || !walletAddress || !termsApproved) return;
    setTxStatus('building');
    try {
      const xdr = await buildPostDealIntent(walletAddress, 0, session.deal_intent_hash);
      setTxStatus('signing');
      const signed = await signWithFreighter(xdr);
      await submitTx(signed);
    } catch (err: unknown) {
      if (tx.status !== 'error') {
        setTxStatus('error', { error: err instanceof Error ? err.message : 'Failed' });
      }
    }
  }

  useEffect(() => {
    if (!creatorId) {
      setVerificationWarning(null);
      return;
    }
    getAgentProfile(parseInt(creatorId, 10))
      .then((p) => {
        if (p.agent_type === 'Creator' && !p.verified && payment) {
          const amt = parseUsdc(payment);
          if (amt > 5_000_000n) {
            setVerificationWarning(
              'Creator is unverified — max deal payment is $5 USDC until oracle verification.'
            );
          } else {
            setVerificationWarning(null);
          }
        } else {
          setVerificationWarning(null);
        }
      })
      .catch(() => setVerificationWarning(null));
  }, [creatorId, payment]);

  async function handleCreateDeal() {
    if (!isWalletConnected || !walletAddress) return;
    if (!termsApproved || !session) {
      alert('Complete AI negotiation and both-party term approval first');
      return;
    }
    if (!creatorId || !brandId || !payment || !creatorStake || !brandStake || !creatorWallet || !brandWallet) {
      alert('Please fill all required fields');
      return;
    }
    if (verificationWarning) {
      alert(verificationWarning);
      return;
    }

    setTxStatus('building');
    try {
      const deadlineSec = BigInt(Math.floor(Date.now() / 1000) + parseInt(daysFromNow) * 86400);

      const xdr = await buildCreateDeal(
        walletAddress,
        parseInt(creatorId),
        parseInt(brandId),
        parseUsdc(payment),
        parseUsdc(creatorStake),
        parseUsdc(brandStake),
        deadlineSec,
        creatorWallet,
        brandWallet,
        session.deal_intent_hash
      );

      setTxStatus('signing');
      const signedXdr = await signWithFreighter(xdr);
      await submitTx(signedXdr);
      await loadDeals();
      setTab('list');
    } catch (err: unknown) {
      if (tx.status !== 'error') {
        setTxStatus('error', { error: err instanceof Error ? err.message : 'Failed' });
      }
    }
  }

  const canCreateDeal = termsApproved && session?.status === 'approved';

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div className="section-eyebrow">DEAL VAULT</div>
      <div className="section-header">
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
          ACTIVE<br />
          <span style={{ color: 'var(--accent-yellow)' }}>DEALS</span>
        </h1>
        <button className="btn btn-ghost btn-sm" onClick={loadDeals} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <TxStatus />

      <div className="tabs">
        <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
          <Briefcase size={12} style={{ display: 'inline', marginRight: '4px' }} />
          All Deals ({deals.length})
        </button>
        <button className={`tab ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
          <Plus size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Create Deal
        </button>
      </div>

      {tab === 'list' && (
        <div>
          {loading ? (
            <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              Scanning deal vault (IDs 1–20)…
            </div>
          ) : deals.length === 0 ? (
            <div className="card card-dim" style={{ textAlign: 'center', padding: '3rem', borderStyle: 'dashed' }}>
              <Briefcase size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No Deals Yet</h3>
              <button className="btn" onClick={() => setTab('create')}>
                Create First Deal →
              </button>
            </div>
          ) : (
            <div className="grid-2">
              {deals.map((deal) => (
                <DealCard
                  key={deal.deal_id}
                  deal={deal}
                  highlight={
                    deal.creator_wallet === walletAddress || deal.brand_wallet === walletAddress
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'create' && (
        <div style={{ maxWidth: '640px' }}>
          {!isWalletConnected ? (
            <div className="card card-dim" style={{ textAlign: 'center', padding: '2rem', borderStyle: 'dashed' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Connect your wallet to create a deal.</p>
            </div>
          ) : (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>CREATE DEAL</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div className="input-group">
                    <label>Creator Agent ID</label>
                    <input className="input" type="number" min="1" value={creatorId} onChange={(e) => setCreatorId(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Brand Agent ID</label>
                    <input className="input" type="number" min="1" value={brandId} onChange={(e) => setBrandId(e.target.value)} />
                  </div>
                </div>

                <div className="input-group">
                  <label>Creator Wallet</label>
                  <input className="input" value={creatorWallet} onChange={(e) => setCreatorWallet(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Brand Wallet</label>
                  <input className="input" value={brandWallet} onChange={(e) => setBrandWallet(e.target.value)} />
                </div>

                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)', padding: '1rem' }}>
                  <div className="input-group">
                    <label>Payment (USDC)</label>
                    <input className="input" type="number" step="0.01" value={payment} onChange={(e) => setPayment(e.target.value)} />
                  </div>
                  <div className="grid-2" style={{ gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div className="input-group">
                      <label>Creator Stake</label>
                      <input className="input" type="number" step="0.01" value={creatorStake} onChange={(e) => setCreatorStake(e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label>Brand Stake</label>
                      <input className="input" type="number" step="0.01" value={brandStake} onChange={(e) => setBrandStake(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid-2" style={{ gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div className="input-group">
                      <label>Deadline (days)</label>
                      <input className="input" type="number" value={daysFromNow} onChange={(e) => setDaysFromNow(e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label>KPI threshold (bps)</label>
                      <input className="input" type="number" value={kpiThreshold} onChange={(e) => setKpiThreshold(e.target.value)} />
                    </div>
                  </div>
                </div>

                <button type="button" className="btn btn-ghost btn-sm" onClick={handleStartNegotiation} disabled={negotiating}>
                  {negotiating ? 'Starting…' : '1. Start AI negotiation session'}
                </button>

                {session && (
                  <div className="card card-dim" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      Session #{session.id} · {session.status} · round {session.rounds}/{session.max_rounds}
                    </div>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>{session.terms_summary}</p>
                    {session.rounds_history?.map((r) => (
                      <div key={r.round_num} style={{ fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                        <strong>{r.persona}</strong>: {r.message}
                      </div>
                    ))}
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', wordBreak: 'break-all', marginTop: '0.5rem' }}>
                      intent: {session.deal_intent_hash}
                    </div>
                    {session.status === 'negotiating' && (
                      <button className="btn btn-sm btn-ghost" style={{ marginTop: '0.75rem' }} onClick={handleNextRound} disabled={negotiating}>
                        Next negotiation round
                      </button>
                    )}
                  </div>
                )}

                {session && (
                  <div style={{ border: '1px solid var(--border-dim)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>2. Human approval (both parties)</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-sm" onClick={() => handleApproveTerms('creator')} disabled={creatorApproved}>
                        {creatorApproved ? '✓ Creator approved' : 'Creator approve terms'}
                      </button>
                      <button className="btn btn-sm" onClick={() => handleApproveTerms('brand')} disabled={brandApproved}>
                        {brandApproved ? '✓ Brand approved' : 'Brand approve terms'}
                      </button>
                    </div>
                    {termsApproved && (
                      <div style={{ marginTop: '0.75rem', color: 'var(--accent-green)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={14} /> Both parties approved — ready for on-chain steps
                      </div>
                    )}
                  </div>
                )}

                {termsApproved && session && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handlePostDealIntent}>
                    3. Post DealIntent artifact (optional audit trail)
                  </button>
                )}

                {verificationWarning && (
                  <div style={{ padding: '0.75rem', border: '1px solid var(--accent-pink)', color: 'var(--accent-pink)', fontSize: '0.8rem' }}>
                    {verificationWarning}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255, 230, 0, 0.05)', border: '1px solid rgba(255, 230, 0, 0.2)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <AlertCircle size={14} style={{ color: 'var(--accent-yellow)', flexShrink: 0 }} />
                  <span>Both wallets must sign create_deal and deposit_stakes. Oracle settles after KPI review.</span>
                </div>

                <button
                  className="btn"
                  onClick={handleCreateDeal}
                  disabled={!canCreateDeal || tx.status === 'pending' || tx.status === 'building' || tx.status === 'signing'}
                >
                  {canCreateDeal ? '4. CREATE DEAL ON-CHAIN' : 'Approve terms to enable create deal'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '3rem' }}>Loading…</div>}>
      <DealsPageContent />
    </Suspense>
  );
}
