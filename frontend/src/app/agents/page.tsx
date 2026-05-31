'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import TxStatus from '@/components/TxStatus';
import AgentCard from '@/components/AgentCard';
import {
  getAgentProfile,
  getReputationScore,
  getAgentId,
  getAgentCount,
  buildMintCreator,
  buildMintBrand,
  buildUpdateCreator,
  buildUpdateBrand,
  AgentProfile,
  ReputationScore,
} from '@/lib/contracts';
import { signWithFreighter } from '@/lib/freighter';
import VerificationBadge from '@/components/VerificationBadge';
import {
  submitVerification,
  getVerificationStatus,
  logProfileAudit,
} from '@/lib/agentApi';
import { Users, UserPlus, Star, RefreshCw, Pencil, Shield } from 'lucide-react';

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter', 'twitch', 'x', 'other'];

export default function AgentsPage() {
  const { isWalletConnected, walletAddress, agentId, setAgent, tx, setTxStatus, submitTx } = useAppStore();

  const [tab, setTab] = useState<'my-profile' | 'register' | 'explore'>('my-profile');
  const [agentType, setAgentType] = useState<'Creator' | 'Brand'>('Creator');

  const [handle, setHandle] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [followers, setFollowers] = useState('');
  const [brandName, setBrandName] = useState('');
  const [metaUri, setMetaUri] = useState('ipfs://QmPactProtocol');

  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [score, setScore] = useState<ReputationScore | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [editing, setEditing] = useState(false);

  const [exploreIds, setExploreIds] = useState<number[]>([]);
  const [exploreProfiles, setExploreProfiles] = useState<Record<number, { profile: AgentProfile; score: ReputationScore }>>({});
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [agentCount, setAgentCount] = useState(0);
  const [proofUrl, setProofUrl] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  useEffect(() => {
    if (agentId) loadProfile(agentId);
  }, [agentId]);

  useEffect(() => {
    if (!agentId) return;
    getVerificationStatus(agentId)
      .then((r) => setVerificationPending(r.latest_request?.status === 'pending'))
      .catch(() => {});
  }, [agentId]);

  async function loadProfile(id: number) {
    setLoadingProfile(true);
    try {
      const [p, s] = await Promise.all([getAgentProfile(id), getReputationScore(id)]);
      setProfile(p);
      setScore(s);
      setAgent(id, p.agent_type as 'Creator' | 'Brand');
      setHandle(p.handle);
      setPlatform(p.platform === 'brand' ? 'other' : p.platform);
      setFollowers(String(p.follower_count));
      setBrandName(p.agent_type === 'Brand' ? p.handle : '');
      setMetaUri(p.metadata_uri || 'ipfs://QmPactProtocol');
    } catch (err) {
      console.error('Load profile error:', err);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function loadExplore() {
    setLoadingExplore(true);
    try {
      let count = 0;
      try {
        count = await getAgentCount();
      } catch {
        // Older registry deployments without agent_count — scan a reasonable ID range
        count = 20;
      }
      setAgentCount(count);
      if (count === 0) {
        setExploreIds([]);
        setExploreProfiles({});
        return;
      }
      const ids = Array.from({ length: count }, (_, i) => i + 1);
      const results: Record<number, { profile: AgentProfile; score: ReputationScore }> = {};
      await Promise.allSettled(
        ids.map(async (id) => {
          const [p, s] = await Promise.all([getAgentProfile(id), getReputationScore(id)]);
          results[id] = { profile: p, score: s };
        })
      );
      const found = ids.filter((id) => results[id]);
      setExploreIds(found);
      setExploreProfiles(results);
    } catch (err) {
      console.error('Explore load error:', err);
      setExploreIds([]);
    } finally {
      setLoadingExplore(false);
    }
  }

  useEffect(() => {
    if (tab === 'explore') loadExplore();
  }, [tab]);

  async function handleRegister() {
    if (!isWalletConnected || !walletAddress) return;
    setTxStatus('building');
    try {
      let xdr: string;
      if (agentType === 'Creator') {
        if (!handle || !followers) {
          alert('Fill all fields');
          setTxStatus('idle');
          return;
        }
        const fc = parseInt(followers, 10);
        if (Number.isNaN(fc) || fc < 0) {
          alert('Invalid follower count');
          setTxStatus('idle');
          return;
        }
        xdr = await buildMintCreator(
          walletAddress,
          handle,
          platform,
          metaUri || 'ipfs://QmPactProtocol',
          fc
        );
      } else {
        if (!brandName) {
          alert('Enter brand name');
          setTxStatus('idle');
          return;
        }
        xdr = await buildMintBrand(walletAddress, brandName, metaUri || 'ipfs://QmPactProtocol');
      }

      setTxStatus('signing');
      const signedXdr = await signWithFreighter(xdr);
      await submitTx(signedXdr);

      const id = await getAgentId(walletAddress);
      await loadProfile(id);
      setTab('my-profile');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      setTxStatus('error', { error: msg });
    }
  }

  async function handleUpdateProfile() {
    if (!isWalletConnected || !walletAddress || !agentId || !profile) return;
    setTxStatus('building');
    try {
      let xdr: string;
      if (profile.agent_type === 'Creator') {
        const fc = parseInt(followers, 10);
        if (!handle || Number.isNaN(fc)) {
          alert('Fill all fields');
          setTxStatus('idle');
          return;
        }
        xdr = await buildUpdateCreator(
          walletAddress,
          agentId,
          handle,
          platform,
          metaUri,
          fc
        );
      } else {
        if (!brandName) {
          alert('Enter brand name');
          setTxStatus('idle');
          return;
        }
        xdr = await buildUpdateBrand(walletAddress, agentId, brandName, metaUri);
      }
      if (profile.agent_type === 'Creator' && handle !== profile.handle) {
        await logProfileAudit({
          agent_id: agentId,
          field: 'handle',
          old_value: profile.handle,
          new_value: handle,
        }).catch(() => {});
      }
      setTxStatus('signing');
      const signedXdr = await signWithFreighter(xdr);
      await submitTx(signedXdr);
      await loadProfile(agentId);
      setEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      setTxStatus('error', { error: msg });
    }
  }

  async function refreshProfile() {
    if (walletAddress) {
      try {
        const id = await getAgentId(walletAddress);
        await loadProfile(id);
      } catch {
        setAgent(null, null);
        setProfile(null);
        setScore(null);
      }
    }
  }

  const isOwner =
    profile &&
    walletAddress &&
    profile.wallet.toLowerCase() === walletAddress.toLowerCase();

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div className="section-eyebrow">AGENT REGISTRY</div>
      <div className="section-header">
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
          AGENT<br />
          <span style={{ color: 'var(--accent-yellow)' }}>PROFILES</span>
        </h1>
        <button
          className="btn btn-ghost btn-sm"
          onClick={refreshProfile}
          disabled={!isWalletConnected}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <TxStatus />

      <div className="tabs">
        <button className={`tab ${tab === 'my-profile' ? 'active' : ''}`} onClick={() => setTab('my-profile')}>
          My Profile
        </button>
        <button className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
          Register
        </button>
        <button className={`tab ${tab === 'explore' ? 'active' : ''}`} onClick={() => setTab('explore')}>
          Explore
        </button>
      </div>

      {tab === 'my-profile' && (
        <div>
          {!isWalletConnected ? (
            <div className="card card-dim" style={{ textAlign: 'center', padding: '3rem', borderStyle: 'dashed' }}>
              <Users size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Connect Your Wallet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Connect Freighter to view your agent profile.
              </p>
            </div>
          ) : loadingProfile ? (
            <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              Loading profile…
            </div>
          ) : profile && score && agentId ? (
            <div>
              {!editing ? (
                <>
                  <AgentCard id={agentId} profile={profile} score={score} isCurrentUser />
                  {isOwner && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: '1rem' }}
                      onClick={() => setEditing(true)}
                    >
                      <Pencil size={13} /> Edit Profile
                    </button>
                  )}

                  {profile.agent_type === 'Creator' && !profile.verified && isOwner && (
                    <div className="card" style={{ marginTop: '1.5rem', borderColor: 'var(--accent-blue)' }}>
                      <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield size={16} /> SOCIAL VERIFICATION
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Submit proof of your social account for manual oracle review. Required for high-value deals.
                      </p>
                      {verificationPending ? (
                        <VerificationBadge verified={false} pending />
                      ) : (
                        <>
                          <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                            <label>Profile URL (proof)</label>
                            <input
                              className="input"
                              placeholder="https://instagram.com/yourhandle"
                              value={proofUrl}
                              onChange={(e) => setProofUrl(e.target.value)}
                            />
                          </div>
                          <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                            <label>Notes (optional)</label>
                            <input
                              className="input"
                              placeholder="Additional context for reviewer"
                              value={verificationNotes}
                              onChange={(e) => setVerificationNotes(e.target.value)}
                            />
                          </div>
                          <button
                            className="btn btn-sm"
                            disabled={!proofUrl || submittingVerification}
                            onClick={async () => {
                              if (!walletAddress || !agentId) return;
                              setSubmittingVerification(true);
                              try {
                                await submitVerification({
                                  agent_id: agentId,
                                  wallet: walletAddress,
                                  platform: profile.platform,
                                  handle: profile.handle,
                                  proof_url: proofUrl,
                                  notes: verificationNotes || undefined,
                                });
                                setVerificationPending(true);
                                setProofUrl('');
                              } catch (e: unknown) {
                                alert(e instanceof Error ? e.message : 'Submit failed');
                              } finally {
                                setSubmittingVerification(false);
                              }
                            }}
                          >
                            Submit for Review
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="card" style={{ marginTop: '0.5rem' }}>
                  <h3 style={{ marginBottom: '1rem' }}>EDIT PROFILE (OWNER ONLY)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {profile.agent_type === 'Creator' ? (
                      <>
                        <div className="input-group">
                          <label>Handle</label>
                          <input className="input" value={handle} onChange={(e) => setHandle(e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label>Platform</label>
                          <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                            {PLATFORMS.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Followers</label>
                          <input
                            className="input"
                            type="number"
                            value={followers}
                            onChange={(e) => setFollowers(e.target.value)}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="input-group">
                        <label>Brand Name</label>
                        <input className="input" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
                      </div>
                    )}
                    <div className="input-group">
                      <label>Metadata URI</label>
                      <input className="input" value={metaUri} onChange={(e) => setMetaUri(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn"
                        onClick={handleUpdateProfile}
                        disabled={tx.status === 'pending' || tx.status === 'building' || tx.status === 'signing'}
                      >
                        Save On-Chain
                      </button>
                      <button className="btn btn-ghost" onClick={() => setEditing(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card card-dim" style={{ textAlign: 'center', padding: '3rem', borderStyle: 'dashed' }}>
              <UserPlus size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Not Registered Yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                You don&apos;t have an on-chain agent profile. Register to start making deals.
              </p>
              <button className="btn" onClick={() => setTab('register')}>
                Register Now →
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'register' && (
        <div style={{ maxWidth: '540px' }}>
          {!isWalletConnected ? (
            <div className="card card-dim" style={{ textAlign: 'center', padding: '2rem', borderStyle: 'dashed' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Connect your wallet first.</p>
            </div>
          ) : agentId ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <Star size={32} style={{ color: 'var(--accent-yellow)', margin: '0 auto 1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Already Registered</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                You are Agent #{agentId}. Go to My Profile to view or edit your stats.
              </p>
              <button className="btn" onClick={() => setTab('my-profile')}>
                View Profile →
              </button>
            </div>
          ) : (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>REGISTER AGENT</h3>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '1.5rem' }}>
                {(['Creator', 'Brand'] as const).map((type) => (
                  <button
                    key={type}
                    className={`btn ${agentType === type ? '' : 'btn-ghost'} btn-sm`}
                    style={{ flex: 1 }}
                    onClick={() => setAgentType(type)}
                  >
                    {type === 'Creator' ? '🎨' : '🏢'} {type}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {agentType === 'Creator' ? (
                  <>
                    <div className="input-group">
                      <label>Handle / Username</label>
                      <input
                        className="input"
                        placeholder="@yourcreatorhandle"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label>Platform</label>
                      <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                        {PLATFORMS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Follower Count</label>
                      <input
                        className="input"
                        placeholder="250000"
                        type="number"
                        min="0"
                        value={followers}
                        onChange={(e) => setFollowers(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="input-group">
                    <label>Brand Name</label>
                    <input
                      className="input"
                      placeholder="Acme Corp"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                    />
                  </div>
                )}
                <div className="input-group">
                  <label>Metadata URI (optional)</label>
                  <input
                    className="input"
                    placeholder="ipfs://Qm..."
                    value={metaUri}
                    onChange={(e) => setMetaUri(e.target.value)}
                  />
                </div>
                <button
                  className="btn"
                  onClick={handleRegister}
                  disabled={tx.status === 'pending' || tx.status === 'building' || tx.status === 'signing'}
                  style={{ marginTop: '0.5rem' }}
                >
                  {tx.status === 'building' || tx.status === 'signing' || tx.status === 'pending'
                    ? 'Processing…'
                    : `MINT ${agentType.toUpperCase()} AGENT`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'explore' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {agentCount > 0
                ? `${agentCount} agent${agentCount === 1 ? '' : 's'} on-chain`
                : 'No agents registered yet'}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={loadExplore} disabled={loadingExplore}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
          {loadingExplore ? (
            <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Fetching from Soroban RPC…
            </div>
          ) : exploreIds.length === 0 ? (
            <div className="card card-dim" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>No agents found on testnet yet.</p>
            </div>
          ) : (
            <div className="grid-3">
              {exploreIds.map((id) => {
                const data = exploreProfiles[id];
                return (
                  <AgentCard
                    key={id}
                    id={id}
                    profile={data.profile}
                    score={data.score}
                    isCurrentUser={id === agentId}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
