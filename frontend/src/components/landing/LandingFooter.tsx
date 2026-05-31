import { CONTRACTS, STELLAR_EXPERT_URL } from '@/lib/constants';
import { ExternalLink } from 'lucide-react';

const contracts = [
  { label: 'Deal Vault', addr: CONTRACTS.DEAL_VAULT },
  { label: 'Campaign Oracle', addr: CONTRACTS.CAMPAIGN_ORACLE },
  { label: 'Agent Registry', addr: CONTRACTS.AGENT_REGISTRY },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-landing-border bg-landing-surface px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div id="contracts" className="mb-10 rounded-2xl border border-landing-border bg-landing-bg p-6">
          <p className="mb-1 text-sm font-medium text-landing-text">Verified on Stellar Testnet</p>
          <p className="mb-4 text-xs text-landing-muted">
            Smart contracts powering escrow and settlement — inspect any address on Stellar Expert.
          </p>
          <div className="space-y-2">
            {contracts.map(({ label, addr }) => (
              <div
                key={label}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="text-landing-muted">{label}</span>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs text-landing-nav">{addr || '—'}</code>
                  {addr && (
                    <a
                      href={`${STELLAR_EXPERT_URL}/contract/${addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-landing-muted transition hover:text-landing-accent"
                      aria-label={`View ${label} on Stellar Expert`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-landing-muted">
          <p>© {new Date().getFullYear()} Pact Protocol</p>
          <div className="flex gap-4">
            <a
              href="https://github.com/fahmmin/pact-protocol-stellar"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-landing-text"
            >
              GitHub
            </a>
            <a
              href={STELLAR_EXPERT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-landing-text"
            >
              Stellar Expert
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
