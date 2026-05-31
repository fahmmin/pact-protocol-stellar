const items = [
  'Stellar Soroban',
  '5 Smart Contracts',
  'AI Agent Runtime',
  '4.9★ from 29 testers',
  'Testnet Live',
  'Open Source',
];

export default function TrustStrip() {
  return (
    <section className="border-y border-white/[0.06] bg-landing-surface/50 py-6">
      <div className="mx-auto max-w-6xl px-4">
        <p className="mb-4 text-center text-xs uppercase tracking-widest text-landing-muted">
          Trusted by creators, brands, and the Stellar ecosystem
        </p>
        <div className="overflow-hidden">
          <div className="flex animate-marquee gap-12 whitespace-nowrap">
            {[...items, ...items].map((item, i) => (
              <span
                key={`${item}-${i}`}
                className="font-mono text-sm text-white/60"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
