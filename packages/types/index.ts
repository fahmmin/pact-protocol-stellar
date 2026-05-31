/** Shared type constants for Pact Protocol Stellar (frontend). */

export const REPUTATION_TIERS = ['Bronze', 'Silver', 'Gold', 'Diamond'] as const;
export type ReputationTier = (typeof REPUTATION_TIERS)[number];

export const USDC_DECIMALS = 6;
export const STROOPS_PER_USDC = 1_000_000n;

export function stroopsToUsdc(stroops: bigint | number): number {
  const n = typeof stroops === 'bigint' ? stroops : BigInt(stroops);
  return Number(n) / Number(STROOPS_PER_USDC);
}

export function usdcToStroops(usdc: number): bigint {
  return BigInt(Math.round(usdc * Number(STROOPS_PER_USDC)));
}

export type DealStatus =
  | 'Pending'
  | 'Active'
  | 'Settled'
  | 'Cancelled'
  | 'Disputed';

export type AgentType = 'Creator' | 'Brand';
