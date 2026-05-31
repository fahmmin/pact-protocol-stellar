'use client';

import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { CONTRACTS, STELLAR_EXPERT_URL } from '@/lib/constants';
import { Zap, Users, Briefcase, TrendingUp, ExternalLink, ArrowRight, Activity } from 'lucide-react';

const marqueeItems = [
  'AGENT REGISTRY', 'DEAL VAULT', 'PACT TRADE', 'CAMPAIGN ORACLE',
  'VALIDATION REGISTRY', 'SOROBAN TESTNET', 'TRUSTLESS DEALS',
  'AI NEGOTIATION', 'ON-CHAIN SETTLEMENT', 'PREDICTION MARKETS',
];

const contracts = [
  { label: 'Agent Registry', addr: CONTRACTS.AGENT_REGISTRY, color: 'var(--accent-yellow)' },
  { label: 'Validation Registry', addr: CONTRACTS.VALIDATION_REGISTRY, color: 'var(--accent-blue)' },
  { label: 'Campaign Oracle', addr: CONTRACTS.CAMPAIGN_ORACLE, color: 'var(--accent-purple)' },
  { label: 'Deal Vault', addr: CONTRACTS.DEAL_VAULT, color: 'var(--accent-green)' },
  { label: 'PactMarket', addr: CONTRACTS.PACT_MARKET, color: 'var(--accent-pink)' },
];

export default function DashboardPage() {
  const { isWalletConnected, walletAddress, agentId } = useAppStore();

  return (
    <div>
      {/* Marquee ticker */}
      <div className="marquee-track">
        <div className="marquee-inner">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="marquee-item">
              {item}
              {i % marqueeItems.length < marqueeItems.length - 1 && (
                <span className="marquee-dot">◆</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="hero">
        <div className="hero-noise" />
        <div className="container">
          {/* Eyebrow */}
          <div className="section-eyebrow">
            <span className="pulse-dot" style={{ marginRight: '0.5rem' }} />
            LIVE ON STELLAR TESTNET
          </div>

          {/* Main heading with glitch */}
          <h1
            className="glitch"
            data-text="PACT PROTOCOL"
            style={{ marginBottom: '1.5rem', lineHeight: 1 }}
          >
            PACT<br />
            <span style={{ color: 'var(--accent-yellow)' }}>PROTOCOL</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'var(--text-secondary)',
              maxWidth: '640px',
              marginBottom: '2.5rem',
              lineHeight: 1.6,
            }}
          >
            Trustless creator–brand deals negotiated by AI agents,
            staked on outcomes, settled via oracle — with a prediction
            market on top.{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              Every deal, proven on-chain.
            </strong>
          </p>

          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {!isWalletConnected ? (
              <button
                className="btn btn-lg"
                onClick={async () => {
                  const { isConnected, requestAccess } = await import('@stellar/freighter-api');
                  const connected = await isConnected();
                  if (!connected) {
                    alert('Install Freighter wallet and switch to Testnet');
                    return;
                  }
                  const addr = await requestAccess();
                  if (addr) useAppStore.getState().setWallet(addr);
                }}
              >
                <Zap size={16} /> CONNECT WALLET
              </button>
            ) : (
              <>
                <Link href="/dashboard" className="btn btn-lg">
                  <Activity size={16} /> MY DASHBOARD
                </Link>
                <Link href="/agents" className="btn btn-lg btn-outline">
                  <Users size={16} /> {agentId ? `AGENT #${agentId}` : 'REGISTER'}
                </Link>
              </>
            )}
            <Link href="/deals" className="btn btn-lg btn-outline">
              <Briefcase size={16} /> BROWSE DEALS
            </Link>
          </div>
        </div>
      </div>

      {/* Protocol stats */}
      <div style={{ background: 'rgba(16, 16, 16, 0.7)', backdropFilter: 'blur(10px)', borderTop: '2px solid var(--border-dim)', borderBottom: '2px solid var(--border-dim)', padding: '2rem 0' }}>
        <div className="container">
          <div className="grid-4" style={{ gap: '2px' }}>
            {[
              { label: 'Contracts', value: '5', sub: 'Deployed on Soroban', color: 'var(--accent-yellow)' },
              { label: 'Network', value: 'TESTNET', sub: 'Stellar Soroban', color: 'var(--accent-blue)' },
              { label: 'Protocol', value: 'v0.1', sub: 'Pact Protocol', color: 'var(--accent-pink)' },
              { label: 'Status', value: 'LIVE', sub: 'All systems go', color: 'var(--accent-green)' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: '1.5rem',
                  borderLeft: `3px solid ${stat.color}`,
                  background: 'var(--bg-card)',
                }}
              >
                <div className="stat-block">
                  <span className="stat-label">{stat.label}</span>
                  <span className="stat-value" style={{ color: stat.color }}>{stat.value}</span>
                  <span className="stat-sub">{stat.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="container" style={{ padding: '4rem 1.5rem' }}>
        <div className="section-eyebrow">PROTOCOL MODULES</div>
        <h2 style={{ marginBottom: '2rem' }}>
          HOW IT<br />
          <span style={{ color: 'var(--accent-yellow)' }}>WORKS</span>
        </h2>

        <div className="grid-3" style={{ marginBottom: '4rem' }}>
          {[
            {
              icon: Users,
              color: 'var(--accent-yellow)',
              title: 'AGENT REGISTRY',
              desc: 'Mint creator or brand agent profiles on-chain. Reputation scores tracked by oracle after every deal.',
              href: '/agents',
              cta: 'Register Agent',
            },
            {
              icon: Briefcase,
              color: 'var(--accent-pink)',
              title: 'DEAL VAULT',
              desc: 'Both parties stake capital on deal outcomes. 20% slashed on failure. Smart escrow, no intermediaries.',
              href: '/deals',
              cta: 'Browse Deals',
            },
            {
              icon: TrendingUp,
              color: 'var(--accent-blue)',
              title: 'PACT TRADE',
              desc: 'Trade YES/NO tokens on deal outcomes via AMM. 0.5% fee. Settled by oracle.',
              href: '/market',
              cta: 'Open Markets',
            },
          ].map(({ icon: Icon, color, title, desc, href, cta }) => (
            <div
              key={title}
              className="card"
              style={{ borderColor: color, boxShadow: `4px 4px 0px ${color}` }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  padding: '0.6rem',
                  border: `2px solid ${color}`,
                  marginBottom: '1rem',
                  color,
                }}
              >
                <Icon size={22} />
              </div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>{title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                {desc}
              </p>
              <Link
                href={href}
                className="btn btn-sm"
                style={{ background: color, borderColor: color, color: color === 'var(--accent-pink)' || color === 'var(--accent-blue)' ? '#fff' : '#000', boxShadow: `3px 3px 0px ${color}` }}
              >
                {cta} <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>

        {/* Deployed contracts */}
        <div className="section-eyebrow">DEPLOYED CONTRACTS</div>
        <h2 style={{ marginBottom: '1.5rem' }}>
          ON-CHAIN <span style={{ color: 'var(--accent-yellow)' }}>ADDRESSES</span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {contracts.map(({ label, addr, color }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-dim)',
                borderLeft: `3px solid ${color}`,
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color,
                }}
              >
                {label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <code
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    wordBreak: 'break-all',
                  }}
                >
                  {addr}
                </code>
                <a
                  href={`${STELLAR_EXPERT_URL}/contract/${addr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* CTA band */}
        {!isWalletConnected && (
          <div
            className="card"
            style={{
              marginTop: '4rem',
              textAlign: 'center',
              background: 'var(--accent-yellow)',
              borderColor: 'var(--accent-yellow)',
              color: '#000',
              boxShadow: '6px 6px 0px rgba(0,0,0,0.8)',
            }}
          >
            <h2 style={{ marginBottom: '0.75rem', color: '#000' }}>READY TO START?</h2>
            <p style={{ marginBottom: '1.5rem', color: '#333', fontSize: '0.9rem' }}>
              Connect your Freighter wallet and switch to Stellar Testnet to begin.
            </p>
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ background: '#000', borderColor: '#000', color: '#FFE600' }}
            >
              GET FREIGHTER WALLET <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
