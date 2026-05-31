import NavBar from '@/components/NavBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main>{children}</main>
      <footer
        style={{
          borderTop: '2px solid var(--border-dim)',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        PACT PROTOCOL · STELLAR TESTNET · ALL DEALS PROVEN ON-CHAIN ·{' '}
        <a
          href="https://stellar.expert/explorer/testnet"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent-yellow)', textDecoration: 'none' }}
        >
          STELLAR.EXPERT ↗
        </a>
      </footer>
    </>
  );
}
