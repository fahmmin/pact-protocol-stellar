'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import {
  acceptMatch,
  listMatchProposals,
  proposeMatches,
  rejectMatch,
  searchAgents,
  type IndexedAgent,
  type MatchProposal,
} from '@/lib/agentApi';
import { Sparkles, Users, Check, X, RefreshCw } from 'lucide-react';

export default function MatchesPage() {
  const { agentId } = useAppStore();
  const [creators, setCreators] = useState<IndexedAgent[]>([]);
  const [proposals, setProposals] = useState<MatchProposal[]>([]);
  const [platform, setPlatform] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const brandId = agentId ?? 0;

  async function loadCreators() {
    setLoading(true);
    try {
      const res = await searchAgents({
        agent_type: 'Creator',
        platform: platform || undefined,
        min_followers: minFollowers ? parseInt(minFollowers, 10) : undefined,
        limit: 20,
      });
      setCreators(res.agents);
    } catch {
      setCreators([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadProposals() {
    if (!brandId) return;
    try {
      const res = await listMatchProposals({ brand_agent_id: brandId, status: 'pending' });
      setProposals(res.proposals);
    } catch {
      setProposals([]);
    }
  }

  async function handleProposeMatches() {
    if (!brandId) {
      alert('Connect wallet and register a brand agent first');
      return;
    }
    setGenerating(true);
    try {
      await proposeMatches({
        brand_agent_id: brandId,
        platform: platform || undefined,
        min_followers: minFollowers ? parseInt(minFollowers, 10) : undefined,
        limit: 5,
      });
      await loadProposals();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Matchmaker failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleAccept(id: number) {
    await acceptMatch(id);
    await loadProposals();
  }

  async function handleReject(id: number) {
    await rejectMatch(id);
    await loadProposals();
  }

  useEffect(() => {
    loadCreators();
    loadProposals();
  }, [brandId]);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div className="section-eyebrow">MATCHMAKER AGENT</div>
      <h1 style={{ marginBottom: '0.5rem' }}>
        CREATOR <span style={{ color: 'var(--accent-yellow)' }}>DISCOVERY</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: 560 }}>
        AI matchmaker ranks creators from indexed on-chain profiles. Accept a match to start
        dual-agent negotiation on the Deals page.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem', maxWidth: 640 }}>
        <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="input-group">
            <label>Platform filter</label>
            <input
              className="input"
              placeholder="youtube, instagram, x…"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Min followers</label>
            <input
              className="input"
              type="number"
              placeholder="1000"
              value={minFollowers}
              onChange={(e) => setMinFollowers(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-ghost" onClick={loadCreators} disabled={loading}>
            <RefreshCw size={12} /> Browse creators
          </button>
          <button className="btn btn-sm" onClick={handleProposeMatches} disabled={generating || !brandId}>
            <Sparkles size={12} /> {generating ? 'Matching…' : 'Run matchmaker'}
          </button>
        </div>
      </div>

      {proposals.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Pending match proposals</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {proposals.map((p) => (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>
                    Creator #{p.creator_agent_id} · score {p.score}
                  </strong>
                  <span className="badge badge-yellow">{p.status}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {p.rationale}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-sm" onClick={() => handleAccept(p.id)}>
                    <Check size={12} /> Accept match
                  </button>
                  <button className="btn btn-sm btn-pink" onClick={() => handleReject(p.id)}>
                    <X size={12} /> Reject
                  </button>
                  <Link
                    className="btn btn-sm btn-ghost"
                    href={`/deals?creator=${p.creator_agent_id}&brand=${p.brand_agent_id}&match=${p.id}`}
                  >
                    Negotiate →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 style={{ marginBottom: '1rem' }}>
          <Users size={16} style={{ display: 'inline', marginRight: 6 }} />
          Indexed creators
        </h3>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
        ) : creators.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>
            No indexed creators yet. Run indexer sync from admin or register agents on-chain.
          </p>
        ) : (
          <div className="grid-2">
            {creators.map((c) => (
              <div key={c.agent_id} className="card card-dim">
                <strong>#{c.agent_id} {c.handle}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  {c.platform} · {c.follower_count.toLocaleString()} followers
                  {c.verified ? ' · verified' : ''}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Tier {c.tier} · {c.avg_engagement_bps} bps avg engagement
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
