'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Shield, Check, X, Loader } from 'lucide-react';
import { reviewVerification } from '@/lib/agentApi';
import { buildSetCreatorVerified } from '@/lib/contracts';
import { signWithFreighter } from '@/lib/freighter';

interface VerificationRequest {
  id: number;
  agent_id: number;
  wallet: string;
  platform: string;
  handle: string;
  proof_url: string;
  notes: string | null;
  status: string;
  created_at: number;
}

const BASE = process.env.NEXT_PUBLIC_AGENT_RUNTIME_URL || 'http://localhost:8000';

export default function AdminReviewPage() {
  const { walletAddress, setTxStatus, submitTx } = useAppStore();
  const [apiKey, setApiKey] = useState('');
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>({});

  async function loadRequests() {
    if (!apiKey) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/verification/requests?status=pending`, {
        headers: { 'X-API-Key': apiKey },
      });
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  async function review(id: number, approved: boolean) {
    const agentId = requests.find((r) => r.id === id)?.agent_id;
    const result = await reviewVerification(
      id,
      apiKey,
      approved,
      notes[id] || (approved ? 'Approved' : 'Rejected')
    );

    if (approved && result.on_chain_action?.required && walletAddress && agentId) {
      try {
        setTxStatus('building');
        const xdr = await buildSetCreatorVerified(walletAddress, agentId, true);
        setTxStatus('signing');
        const signed = await signWithFreighter(xdr);
        await submitTx(signed);
      } catch (err: unknown) {
        alert(
          `Review saved off-chain. On-chain verify failed: ${err instanceof Error ? err.message : 'unknown'}`
        );
      }
    }

    await loadRequests();
  }

  useEffect(() => {
    if (apiKey) loadRequests();
  }, [apiKey]);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div className="section-eyebrow">ORACLE OPS</div>
      <h1 style={{ marginBottom: '2rem' }}>
        VERIFICATION <span style={{ color: 'var(--accent-blue)' }}>REVIEW QUEUE</span>
      </h1>

      <div className="card" style={{ marginBottom: '2rem', maxWidth: 480 }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Oracle API Key</label>
        <input
          className="input"
          type="password"
          placeholder="ORACLE_API_KEY"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{ marginTop: '0.5rem' }}
        />
        <button className="btn btn-sm" style={{ marginTop: '0.75rem' }} onClick={loadRequests}>
          Load Pending
        </button>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Connect oracle wallet (Freighter) before approving — triggers set_creator_verified on-chain.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Loader size={16} className="spinner" /> Loading…
        </div>
      ) : requests.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No pending verification requests.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 800 }}>
                  <Shield size={14} style={{ display: 'inline' }} /> Agent #{r.agent_id} — {r.handle}
                </span>
                <span className="badge badge-yellow">{r.status}</span>
              </div>
              <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                <strong>Platform:</strong> {r.platform} · <strong>Wallet:</strong> {r.wallet.slice(0, 12)}…
              </div>
              <a href={r.proof_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-yellow)', fontSize: '0.85rem' }}>
                View proof →
              </a>
              <input
                className="input"
                placeholder="Reviewer notes"
                value={notes[r.id] || ''}
                onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                style={{ marginTop: '0.75rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-sm" onClick={() => review(r.id, true)}>
                  <Check size={12} /> Approve + verify on-chain
                </button>
                <button className="btn btn-sm btn-pink" onClick={() => review(r.id, false)}>
                  <X size={12} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
