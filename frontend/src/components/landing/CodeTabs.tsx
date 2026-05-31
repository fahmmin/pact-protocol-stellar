'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const snippets = {
  cli: `# Create a deal on Stellar Testnet
stellar contract invoke \\
  --id $DEAL_VAULT_CONTRACT_ID \\
  --source brand \\
  --network testnet \\
  -- create_deal \\
  --creator GCREATOR... \\
  --brand GBRAND... \\
  --amount 500000000 \\
  --kpi_threshold 50000 \\
  --deadline 1746057600`,
  rust: `// DealVault — both parties must sign
pub fn create_deal(
    env: Env,
    creator: Address,
    brand: Address,
    amount: i128,
    kpi_threshold: u64,
    deadline: u64,
) -> u64 {
    creator.require_auth();
    brand.require_auth();
    // Escrow USDC, return deal_id
}`,
  ts: `// Frontend — invoke via Soroban SDK
const tx = await dealVault.createDeal({
  creator: creatorAddress,
  brand: brandAddress,
  amount: 500_000000n, // 500 USDC
  kpiThreshold: 50_000n,
  deadline: BigInt(deadlineTs),
});`,
};

type Tab = keyof typeof snippets;

export default function CodeTabs() {
  const [tab, setTab] = useState<Tab>('cli');
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(snippets[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <p className="landing-section-label mb-2">[ 02 / 04 ] · Developer First</p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Start building on{' '}
            <span className="text-landing-stellar">Soroban today</span>
          </h2>
        </div>

        <div className="landing-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4">
            <div className="flex">
              {(['cli', 'rust', 'ts'] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-4 py-3 font-mono text-xs uppercase tracking-wider transition ${
                    tab === t
                      ? 'border-b-2 border-landing-accent text-white'
                      : 'text-landing-muted hover:text-white'
                  }`}
                >
                  {t === 'cli' ? 'Stellar CLI' : t === 'rust' ? 'Rust' : 'TypeScript'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-landing-muted transition hover:text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="overflow-x-auto p-6 font-mono text-sm leading-relaxed text-landing-muted">
            <code>{snippets[tab]}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
