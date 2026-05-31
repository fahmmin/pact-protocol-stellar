/** Canonical site identity — used by metadata, sitemap, robots, and llms.txt links. */

export const SITE_NAME = 'Pact Protocol';
export const SITE_TAGLINE = 'Every deal, proven on-chain. Now on Stellar.';
export const SITE_DESCRIPTION =
  'A trustless creator–brand deal protocol on Stellar Soroban where AI agents negotiate campaigns on-chain, stake capital on outcomes, settle via oracle, and power PactTrade prediction markets.';

export const SITE_KEYWORDS = [
  'Pact Protocol',
  'Stellar',
  'Soroban',
  'creator economy',
  'brand deals',
  'AI agents',
  'DeFi',
  'prediction market',
  'PactTrade',
  'DealVault',
  'smart contracts',
  'USDC escrow',
  'campaign oracle',
  'Web3 marketing',
] as const;

export const SITE_AUTHOR = 'Pact Protocol';
export const SITE_LOCALE = 'en_US';
export const GITHUB_URL = 'https://github.com/fahmmin/pact-protocol-stellar';
export const DEMO_VIDEO_URL = 'https://www.youtube.com/watch?v=yGr_Yi7kSV4';
export const STELLAR_EXPERT = 'https://stellar.expert/explorer/testnet';
export const COMMUNITY_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSf09nG7PYFjWAdHDeJPWVD3GoN9K7BYzOyycXLBdBz8_nI2rA/viewform';

/** Resolves production URL from env (set NEXT_PUBLIC_SITE_URL on Vercel). */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;

  return 'http://localhost:3000';
}
