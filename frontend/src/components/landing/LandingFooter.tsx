import { CONTRACTS, STELLAR_EXPERT_URL } from '@/lib/constants';
import { ExternalLink } from 'lucide-react';
import WaitlistForm from './WaitlistForm';

const contracts = [
  { label: 'Agent Registry', addr: CONTRACTS.AGENT_REGISTRY },
  { label: 'Validation Registry', addr: CONTRACTS.VALIDATION_REGISTRY },
  { label: 'Campaign Oracle', addr: CONTRACTS.CAMPAIGN_ORACLE },
  { label: 'Deal Vault', addr: CONTRACTS.DEAL_VAULT },
  { label: 'Pact Market', addr: CONTRACTS.PACT_MARKET },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] px-4 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Contracts */}
        <div id="contracts" className="mb-16">
          <p className="landing-section-label mb-2">Deployed on Stellar Testnet</p>
          <h3 className="mb-6 text-2xl font-bold">On-chain addresses</h3>
          <div className="space-y-2">
            {contracts.map(({ label, addr }) => (
              <div
                key={label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-landing-surface/50 px-4 py-3"
              >
                <span className="text-sm font-medium text-landing-stellar">{label}</span>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs text-landing-muted">{addr || '—'}</code>
                  {addr && (
                    <a
                      href={`${STELLAR_EXPERT_URL}/contract/${addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-landing-muted hover:text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="landing-card mb-12 p-8 text-center">
          <h3 className="mb-2 text-2xl font-bold">Get early access</h3>
          <p className="mb-6 text-landing-muted">
            Join the waitlist to be first when demo, portal, and trading go live.
          </p>
          <div className="mx-auto max-w-lg">
            <WaitlistForm variant="footer" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-xs text-landing-muted">
          <p>© {new Date().getFullYear()} Pact Protocol · Built on Stellar</p>
          <div className="flex gap-4">
            <a
              href="https://github.com/fahmmin/pact-protocol-stellar"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              GitHub
            </a>
            <a
              href={STELLAR_EXPERT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              Stellar Expert
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
