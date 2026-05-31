import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';

export const runtime = 'edge';
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1028 45%, #0f172a 100%)',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #f97316, #eab308)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            P
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {SITE_NAME}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            Trustless creator–brand deals on Stellar
          </div>
          <div style={{ fontSize: 28, color: '#94a3b8', lineHeight: 1.4 }}>{SITE_TAGLINE}</div>
        </div>

        <div style={{ display: 'flex', gap: 12, fontSize: 22, color: '#64748b' }}>
          <span>Soroban</span>
          <span>·</span>
          <span>AI Agents</span>
          <span>·</span>
          <span>DealVault</span>
          <span>·</span>
          <span>PactTrade</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
