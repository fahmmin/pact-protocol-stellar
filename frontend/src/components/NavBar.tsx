'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { shortAddr } from '@/lib/stellar';
import { getAgentId } from '@/lib/contracts';
import { Zap, Users, Briefcase, TrendingUp, ExternalLink, Activity } from 'lucide-react';
import { STELLAR_EXPERT_URL } from '@/lib/constants';

export default function NavBar() {
  const pathname = usePathname();
  const { walletAddress, isWalletConnected, agentId, setAgent } = useAppStore();
  const [connecting, setConnecting] = useState(false);

  async function connectWallet() {
    setConnecting(true);
    try {
      const { isConnected, requestAccess } = await import('@stellar/freighter-api');
      const connected = await isConnected();
      if (!connected) {
        alert('Please install the Freighter wallet extension and switch to Testnet.');
        return;
      }
      const addr = await requestAccess();
      if (!addr) throw new Error('Freighter did not return an address');
      useAppStore.getState().setWallet(addr);

      // Try to load agent profile
      try {
        const id = await getAgentId(addr);
        // We'll determine type on the agents page
        setAgent(id, null);
      } catch {
        // Not registered yet
        setAgent(null, null);
      }
    } catch (err: any) {
      console.error('Connect error:', err);
    } finally {
      setConnecting(false);
    }
  }

  function disconnectWallet() {
    useAppStore.getState().setWallet(null);
    setAgent(null, null);
  }

  const navLinks = [
    { href: '/', label: 'Home', icon: Zap },
    { href: '/dashboard', label: 'Dashboard', icon: Activity },
    { href: '/agents', label: 'Agents', icon: Users },
    { href: '/matches', label: 'Matches', icon: Users },
    { href: '/deals', label: 'Deals', icon: Briefcase },
    { href: '/market', label: 'PactTrade', icon: TrendingUp },
    { href: '/metrics', label: 'Metrics', icon: Activity },
    { href: '/admin/review', label: 'Review', icon: ExternalLink },
    { href: '/admin/settlement', label: 'Settle', icon: ExternalLink },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <Zap size={18} style={{ color: 'var(--accent-yellow)' }} />
          PACT<span>·</span>PROTOCOL
          <span style={{
            fontSize: '0.6rem',
            padding: '0.1rem 0.4rem',
            background: 'var(--accent-yellow)',
            color: '#000',
            marginLeft: '0.25rem',
            fontWeight: 800,
          }}>
            STELLAR
          </span>
        </Link>

        {/* Nav links */}
        <ul className="navbar-links" style={{ display: 'flex', gap: '2px' }}>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`navbar-link ${pathname === href ? 'active' : ''}`}
              >
                <Icon size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isWalletConnected && agentId && (
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--accent-green)',
              fontFamily: 'var(--font-mono)',
              border: '1px solid var(--accent-green)',
              padding: '0.2rem 0.5rem',
            }}>
              AGENT #{agentId}
            </span>
          )}
          {isWalletConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <a
                href={`${STELLAR_EXPERT_URL}/account/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: 'var(--accent-yellow)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span className="pulse-dot" />
                {shortAddr(walletAddress!)}
                <ExternalLink size={10} />
              </a>
              <button
                className="btn btn-ghost btn-sm"
                onClick={disconnectWallet}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              className="btn btn-sm"
              onClick={connectWallet}
              disabled={connecting}
            >
              {connecting ? 'Connecting…' : 'Connect Freighter'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
