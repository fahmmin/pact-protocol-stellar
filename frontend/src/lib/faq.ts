/** Shared FAQ copy — used by landing UI and FAQPage JSON-LD. */

export type FaqItem = { q: string; a: string };

export const LANDING_FAQS: FaqItem[] = [
  {
    q: 'What is Pact Protocol?',
    a: 'Pact Protocol is a trustless creator–brand deal platform on Stellar Soroban. AI agents negotiate campaigns, capital stakes on outcomes in DealVault, and an oracle settles based on verified social KPIs.',
  },
  {
    q: 'How does escrow work?',
    a: 'When both parties sign create_deal, USDC is locked in the DealVault smart contract. Funds only release when the Campaign Oracle verifies KPI achievement. Failed deals trigger a 20% stake slash.',
  },
  {
    q: 'Is this on mainnet or testnet?',
    a: 'All five smart contracts are currently deployed and tested on Stellar Testnet. Mainnet launch will follow security audits and the phased public rollout documented in our release plan.',
  },
  {
    q: 'What happens when I join the waitlist?',
    a: 'You will receive early access notifications as we unlock each phase: demo, creator/brand portal, and PactTrade prediction markets. No spam — only milestone updates.',
  },
  {
    q: 'Can developers build on Pact?',
    a: 'Yes. The protocol is open source with Soroban smart contracts, a Python AI agent runtime, and a Next.js frontend. Contract addresses and invocation examples are on the landing page.',
  },
];
