// Contract addresses shown on the landing page footer
export const CONTRACTS = {
  AGENT_REGISTRY: process.env.NEXT_PUBLIC_AGENT_REGISTRY!,
  VALIDATION_REGISTRY: process.env.NEXT_PUBLIC_VALIDATION_REGISTRY!,
  CAMPAIGN_ORACLE: process.env.NEXT_PUBLIC_CAMPAIGN_ORACLE!,
  DEAL_VAULT: process.env.NEXT_PUBLIC_DEAL_VAULT!,
  PACT_MARKET: process.env.NEXT_PUBLIC_PACT_MARKET!,
  USDC: process.env.NEXT_PUBLIC_USDC!,
} as const;

export const STELLAR_EXPERT_URL = 'https://stellar.expert/explorer/testnet';
