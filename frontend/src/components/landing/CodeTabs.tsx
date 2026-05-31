'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

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

const outputs = {
  cli: `$ stellar contract invoke ...
✓ Transaction successful
Deal ID: 42
Status: Active
Escrow: 500 USDC locked`,
  rust: `// Compiled & deployed to Soroban
Contract: DealVault
Network: Stellar Testnet
Method: create_deal
Auth: creator ✓ brand ✓`,
  ts: `// Response
{
  dealId: 42,
  status: "Active",
  escrow: "500 USDC",
  txHash: "abc123..."
}`,
};

type Tab = keyof typeof snippets;

const tabLabels: Record<Tab, string> = {
  cli: 'Stellar CLI',
  rust: 'Rust',
  ts: 'TypeScript',
};

export default function CodeTabs() {
  const [tab, setTab] = useState<Tab>('cli');
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(snippets[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const codeLines = snippets[tab].split('\n');

  return (
    <section className="px-4 pb-24">
      <div className="mx-auto max-w-6xl">
        <div className="landing-card overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center justify-between border-b border-landing-border bg-landing-bg/50 px-3 py-2">
            <div className="flex gap-1">
              {(['cli', 'rust', 'ts'] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    tab === t
                      ? 'landing-tab-active text-landing-text'
                      : 'text-landing-muted hover:text-landing-text'
                  }`}
                >
                  {tabLabels[t]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-landing-muted transition hover:bg-landing-surface hover:text-landing-text"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy code'}
            </button>
          </div>

          {/* Split pane */}
          <div className="grid md:grid-cols-2">
            <div className="border-b border-landing-border md:border-b-0 md:border-r">
              <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed">
                {codeLines.map((line, i) => (
                  <div key={i} className="flex">
                    <span className="mr-4 w-5 shrink-0 select-none text-right text-landing-muted/50">
                      {i + 1}
                    </span>
                    <code className="text-landing-text">{line}</code>
                  </div>
                ))}
              </pre>
            </div>
            <div className="relative bg-landing-bg/30">
              <span className="absolute right-4 top-4 font-mono text-[10px] text-landing-muted">
                [ .OUT ]
              </span>
              <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-landing-muted">
                {outputs[tab].split('\n').map((line, i) => (
                  <div key={i} className="flex">
                    <span className="mr-4 w-5 shrink-0 select-none text-right text-landing-muted/50">
                      {i + 1}
                    </span>
                    <span>{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
