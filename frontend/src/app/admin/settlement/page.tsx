'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import TxStatus from '@/components/TxStatus';
import { submitSettlementReview } from '@/lib/agentApi';
import { buildPostOracleResult, buildSettleDeal } from '@/lib/contracts';
import { signWithFreighter } from '@/lib/freighter';
import { Gauge, CheckCircle2 } from 'lucide-react';

export default function AdminSettlementPage() {
  const { walletAddress, setTxStatus, submitTx } = useAppStore();
  const [apiKey, setApiKey] = useState('');
  const [dealId, setDealId] = useState('');
  const [engagementBps, setEngagementBps] = useState('500');
  const [likes, setLikes] = useState('0');
  const [views, setViews] = useState('0');
  const [success, setSuccess] = useState(true);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleApproveSettlement() {
    if (!apiKey || !dealId || !walletAddress) {
      alert('Set oracle API key, deal ID, and connect oracle wallet');
      return;
    }
    setBusy(true);
    try {
      await submitSettlementReview(apiKey, {
        deal_id: parseInt(dealId, 10),
        engagement_bps: parseInt(engagementBps, 10),
        likes: parseInt(likes, 10),
        views: parseInt(views, 10),
        success,
        reviewer_notes: notes,
      });

      const id = parseInt(dealId, 10);
      const ts = BigInt(Math.floor(Date.now() / 1000));

      setTxStatus('building');
      const postXdr = await buildPostOracleResult(
        walletAddress,
        id,
        parseInt(engagementBps, 10),
        ts,
        success
      );
      setTxStatus('signing');
      let signed = await signWithFreighter(postXdr);
      await submitTx(signed);

      setTxStatus('building');
      const settleXdr = await buildSettleDeal(walletAddress, id);
      setTxStatus('signing');
      signed = await signWithFreighter(settleXdr);
      await submitTx(signed);

      alert('Settlement review recorded and on-chain settlement submitted.');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Settlement failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div className="section-eyebrow">ORACLE OPS</div>
      <h1 style={{ marginBottom: '1rem' }}>
        KPI <span style={{ color: 'var(--accent-purple)' }}>SETTLEMENT</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: 560 }}>
        Phase 1: oracle operator reviews metrics, then signs post_result + settle with the oracle wallet.
      </p>

      <TxStatus />

      <div className="card" style={{ maxWidth: 520 }}>
        <div className="input-group" style={{ marginBottom: '0.75rem' }}>
          <label>Oracle API Key</label>
          <input className="input" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        </div>
        <div className="input-group" style={{ marginBottom: '0.75rem' }}>
          <label>Deal ID</label>
          <input className="input" type="number" value={dealId} onChange={(e) => setDealId(e.target.value)} />
        </div>
        <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="input-group">
            <label>Engagement (bps)</label>
            <input className="input" type="number" value={engagementBps} onChange={(e) => setEngagementBps(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Views</label>
            <input className="input" type="number" value={views} onChange={(e) => setViews(e.target.value)} />
          </div>
        </div>
        <div className="input-group" style={{ marginBottom: '0.75rem' }}>
          <label>Likes</label>
          <input className="input" type="number" value={likes} onChange={(e) => setLikes(e.target.value)} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={success} onChange={(e) => setSuccess(e.target.checked)} />
          Campaign succeeded (KPI met)
        </label>
        <div className="input-group" style={{ marginBottom: '1rem' }}>
          <label>Reviewer notes</label>
          <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button className="btn" onClick={handleApproveSettlement} disabled={busy}>
          <Gauge size={14} style={{ display: 'inline', marginRight: 6 }} />
          {busy ? 'Processing…' : 'Approve settlement + sign on-chain'}
        </button>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', gap: 6 }}>
          <CheckCircle2 size={12} /> Requires oracle Freighter wallet (bootcamp_admin on testnet)
        </p>
      </div>
    </div>
  );
}
