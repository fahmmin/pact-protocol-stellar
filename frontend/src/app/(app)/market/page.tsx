'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import TxStatus from '@/components/TxStatus';
import MarketRow from '@/components/MarketRow';
import { getMarket, getYesPrice, buildBuyTokens, buildRedeem, Market } from '@/lib/contracts';
import { parseUsdc } from '@/lib/stellar';
import { signWithFreighter } from '@/lib/freighter';
import { TrendingUp, RefreshCw, AlertCircle, Info } from 'lucide-react';

interface MarketData {
  dealId: number;
  market: Market;
  yesPrice: number;
}

export default function MarketPage() {
  const { isWalletConnected, walletAddress, tx, setTxStatus, submitTx } = useAppStore();

  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(false);

  // Buy modal state
  const [buyModal, setBuyModal] = useState<{ dealId: number; isYes: boolean } | null>(null);
  const [buyAmount, setBuyAmount] = useState('10');

  async function loadMarkets() {
    setLoading(true);
    const found: MarketData[] = [];
    await Promise.allSettled(
      Array.from({ length: 20 }, (_, i) => i + 1).map(async (id) => {
        try {
          const [market, price] = await Promise.all([getMarket(id), getYesPrice(id)]);
          found.push({ dealId: id, market, yesPrice: price });
        } catch {}
      })
    );
    found.sort((a, b) => b.dealId - a.dealId);
    setMarkets(found);
    setLoading(false);
  }

  useEffect(() => { loadMarkets(); }, []);

  async function handleBuy(dealId: number, isYes: boolean) {
    setBuyModal({ dealId, isYes });
  }

  async function confirmBuy() {
    if (!buyModal || !walletAddress) return;
    const { dealId, isYes } = buyModal;
    setTxStatus('building');
    try {
      const usdcIn = parseUsdc(buyAmount);
      const xdr = await buildBuyTokens(walletAddress, dealId, isYes, usdcIn);
      setTxStatus('signing');
      const signedXdr = await signWithFreighter(xdr);
      await submitTx(signedXdr);
      setBuyModal(null);
      await loadMarkets();
    } catch (err: any) {
      if (tx.status !== 'error') setTxStatus('error', { error: err.message });
    }
  }

  async function handleRedeem(dealId: number) {
    if (!walletAddress) return;
    setTxStatus('building');
    try {
      const xdr = await buildRedeem(walletAddress, dealId);
      setTxStatus('signing');
      const signedXdr = await signWithFreighter(xdr);
      await submitTx(signedXdr);
      await loadMarkets();
    } catch (err: any) {
      if (tx.status !== 'error') setTxStatus('error', { error: err.message });
    }
  }

  const liveMarkets = markets.filter((m) => !m.market.settled);
  const settledMarkets = markets.filter((m) => m.market.settled);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div className="section-eyebrow">PACTTRADE</div>
      <div className="section-header">
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
          PREDICTION<br />
          <span style={{ color: 'var(--accent-yellow)' }}>MARKETS</span>
        </h1>
        <button
          className="btn btn-ghost btn-sm"
          onClick={loadMarkets}
          disabled={loading}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <TxStatus />

      {/* How it works banner */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          padding: '1rem',
          background: 'rgba(0, 212, 255, 0.05)',
          border: '1px solid rgba(0, 212, 255, 0.15)',
          marginBottom: '2rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}
      >
        <Info size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '1px' }} />
        <div>
          <strong style={{ color: 'var(--accent-blue)' }}>HOW PACTTRADE WORKS:</strong>{' '}
          Trade YES/NO tokens on deal campaign success. Prices move via AMM. 0.5% fee.
          Oracle settles markets after campaign verification. Winners redeem for proportional liquidity share.
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          Fetching markets from Soroban RPC…
        </div>
      ) : markets.length === 0 ? (
        <div className="card card-dim" style={{ textAlign: 'center', padding: '3rem', borderStyle: 'dashed' }}>
          <TrendingUp size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No Markets Yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Prediction markets open when deals are created. Try creating a deal first.
          </p>
        </div>
      ) : (
        <div>
          {liveMarkets.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--accent-green)',
                }}
              >
                <span className="pulse-dot" />
                LIVE MARKETS ({liveMarkets.length})
              </div>
              <div className="grid-2">
                {liveMarkets.map(({ dealId, market, yesPrice }) => (
                  <MarketRow
                    key={dealId}
                    dealId={dealId}
                    market={market}
                    yesPrice={yesPrice}
                    onBuy={handleBuy}
                    onRedeem={handleRedeem}
                    disabled={!isWalletConnected || tx.status === 'pending' || tx.status === 'building'}
                  />
                ))}
              </div>
            </div>
          )}

          {settledMarkets.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                }}
              >
                SETTLED MARKETS ({settledMarkets.length})
              </div>
              <div className="grid-2">
                {settledMarkets.map(({ dealId, market, yesPrice }) => (
                  <MarketRow
                    key={dealId}
                    dealId={dealId}
                    market={market}
                    yesPrice={yesPrice}
                    onBuy={handleBuy}
                    onRedeem={handleRedeem}
                    disabled={!isWalletConnected || tx.status === 'pending' || tx.status === 'building'}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Buy Modal */}
      {buyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setBuyModal(null); }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '400px',
              borderColor: buyModal.isYes ? 'var(--accent-green)' : 'var(--accent-pink)',
              boxShadow: buyModal.isYes ? 'var(--shadow-blue)' : 'var(--shadow-pink)',
            }}
          >
            <h3 style={{ marginBottom: '0.25rem' }}>
              BUY {buyModal.isYes ? 'YES' : 'NO'} TOKENS
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)' }}>
              Deal #{buyModal.dealId} · {buyModal.isYes ? 'Campaign succeeds' : 'Campaign fails'}
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label>Amount (USDC)</label>
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                autoFocus
              />
              <span className="hint" style={{ color: 'var(--text-secondary)' }}>
                0.5% fee applied. Get testnet USDC from{' '}
                <a
                  href="https://laboratory.stellar.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-yellow)' }}
                >
                  Stellar Lab
                </a>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setBuyModal(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className={`btn btn-sm ${buyModal.isYes ? '' : 'btn-pink'}`}
                style={buyModal.isYes ? { flex: 1, background: 'var(--accent-green)', borderColor: 'var(--accent-green)', color: '#000' } : { flex: 1 }}
                onClick={confirmBuy}
                disabled={tx.status === 'pending' || tx.status === 'building' || tx.status === 'signing'}
              >
                {tx.status !== 'idle' && tx.status !== 'success' && tx.status !== 'error' ? 'Processing…' : `Confirm Buy`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
