import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';

export const runtime = 'edge';
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function TwitterImage() {
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
        <div style={{ fontSize: 28, fontWeight: 700 }}>{SITE_NAME}</div>
        <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1 }}>
          Trustless creator–brand deals on Stellar
        </div>
        <div style={{ fontSize: 24, color: '#94a3b8' }}>{SITE_TAGLINE}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
