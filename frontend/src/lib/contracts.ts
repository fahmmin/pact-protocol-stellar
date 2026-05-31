'use client';

import {
  buildTx,
  readContract,
  submitAndWait,
  u32Val,
  addressVal,
  i128Val,
  u64Val,
  boolVal,
  symbolVal,
} from './stellar';
import { CONTRACTS } from './constants';
import { nativeToScVal, xdr } from '@stellar/stellar-sdk';
import {
  decodeAgentProfile,
  decodeBool,
  decodeOracleResult,
  decodeReputationScore,
  decodeU32,
  type OracleResult,
} from './sorobanDecode';

// ────────────────────────────────────────────────────────────
// Types matching Soroban contract structs
// ────────────────────────────────────────────────────────────

export interface AgentProfile {
  wallet: string;
  agent_type: 'Creator' | 'Brand';
  handle: string;
  platform: string;
  metadata_uri: string;
  follower_count: bigint;
  verified: boolean;
  minted_at: bigint;
}

export interface ReputationScore {
  total_deals: number;
  successful_deals: number;
  avg_engagement_bps: number;
  total_volume_usdc: bigint;
  total_staked: bigint;
  last_updated: bigint;
  tier: number; // 0=Bronze 1=Silver 2=Gold 3=Diamond
}

export interface Deal {
  deal_id: number;
  creator_agent_id: number;
  brand_agent_id: number;
  payment_usdc: bigint;
  creator_stake: bigint;
  brand_stake: bigint;
  deadline: bigint;
  status: number; // 0=Pending 1=Active 2=Delivered 3=Settled 4=Cancelled 5=Slashed
  deal_intent_hash: Uint8Array;
  creator_wallet: string;
  brand_wallet: string;
}

export interface Market {
  deal_id: number;
  yes_reserve: bigint;
  no_reserve: bigint;
  total_liquidity: bigint;
  settled: boolean;
  outcome: boolean;
  created_at: bigint;
}

// ────────────────────────────────────────────────────────────
// Agent Registry
// ────────────────────────────────────────────────────────────

export async function getAgentProfile(id: number): Promise<AgentProfile> {
  return readContract(
    CONTRACTS.AGENT_REGISTRY,
    'get_profile',
    [u32Val(id)],
    decodeAgentProfile
  );
}

export async function getReputationScore(id: number): Promise<ReputationScore> {
  return readContract(
    CONTRACTS.AGENT_REGISTRY,
    'get_score',
    [u32Val(id)],
    decodeReputationScore
  );
}

export async function getAgentId(wallet: string): Promise<number> {
  return readContract(
    CONTRACTS.AGENT_REGISTRY,
    'get_agent_id',
    [addressVal(wallet)],
    decodeU32
  );
}

export async function getAgentCount(): Promise<number> {
  return readContract(
    CONTRACTS.AGENT_REGISTRY,
    'agent_count',
    [],
    decodeU32
  );
}

export async function buildMintCreator(
  publicKey: string,
  handle: string,
  platform: string,
  metadataUri: string,
  followerCount: number
): Promise<string> {
  return buildTx(publicKey, CONTRACTS.AGENT_REGISTRY, 'mint_creator', [
    addressVal(publicKey),
    nativeToScVal(handle, { type: 'string' }),
    nativeToScVal(platform, { type: 'string' }),
    nativeToScVal(metadataUri, { type: 'string' }),
    nativeToScVal(followerCount, { type: 'u64' }),
  ]);
}

export async function buildMintBrand(
  publicKey: string,
  brandName: string,
  metadataUri: string
): Promise<string> {
  return buildTx(publicKey, CONTRACTS.AGENT_REGISTRY, 'mint_brand', [
    addressVal(publicKey),
    nativeToScVal(brandName, { type: 'string' }),
    nativeToScVal(metadataUri, { type: 'string' }),
  ]);
}

export async function buildUpdateCreator(
  publicKey: string,
  agentId: number,
  handle: string,
  platform: string,
  metadataUri: string,
  followerCount: number
): Promise<string> {
  return buildTx(publicKey, CONTRACTS.AGENT_REGISTRY, 'update_creator_profile', [
    u32Val(agentId),
    addressVal(publicKey),
    nativeToScVal(handle, { type: 'string' }),
    nativeToScVal(platform, { type: 'string' }),
    nativeToScVal(metadataUri, { type: 'string' }),
    nativeToScVal(followerCount, { type: 'u64' }),
  ]);
}

export async function buildUpdateBrand(
  publicKey: string,
  agentId: number,
  brandName: string,
  metadataUri: string
): Promise<string> {
  return buildTx(publicKey, CONTRACTS.AGENT_REGISTRY, 'update_brand_profile', [
    u32Val(agentId),
    addressVal(publicKey),
    nativeToScVal(brandName, { type: 'string' }),
    nativeToScVal(metadataUri, { type: 'string' }),
  ]);
}

// ────────────────────────────────────────────────────────────
// Deal Vault
// ────────────────────────────────────────────────────────────

export async function getDeal(dealId: number): Promise<Deal> {
  return readContract<Deal>(
    CONTRACTS.DEAL_VAULT,
    'get_deal',
    [u32Val(dealId)]
  );
}

export async function buildCreateDeal(
  publicKey: string,
  creatorId: number,
  brandId: number,
  paymentUsdc: bigint,
  creatorStake: bigint,
  brandStake: bigint,
  deadline: bigint,
  creatorWallet: string,
  brandWallet: string,
  dealIntentHashHex?: string
): Promise<string> {
  let intentHash: Uint8Array;
  if (dealIntentHashHex) {
    const hex = dealIntentHashHex.replace(/^0x/, '');
    intentHash = new Uint8Array(
      hex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? []
    );
    if (intentHash.length !== 32) {
      const padded = new Uint8Array(32);
      padded.set(intentHash.slice(0, 32));
      intentHash = padded;
    }
  } else {
    intentHash = new Uint8Array(32).fill(1);
  }

  return buildTx(publicKey, CONTRACTS.DEAL_VAULT, 'create_deal', [
    u32Val(creatorId),
    u32Val(brandId),
    i128Val(paymentUsdc),
    i128Val(creatorStake),
    i128Val(brandStake),
    u64Val(deadline),
    addressVal(creatorWallet),
    addressVal(brandWallet),
    xdr.ScVal.scvBytes(Buffer.from(intentHash)),
  ]);
}

export async function buildDepositStakes(
  publicKey: string,
  dealId: number
): Promise<string> {
  return buildTx(publicKey, CONTRACTS.DEAL_VAULT, 'deposit_stakes', [
    u32Val(dealId),
  ]);
}

export async function buildSubmitDelivery(
  publicKey: string,
  dealId: number
): Promise<string> {
  return buildTx(publicKey, CONTRACTS.DEAL_VAULT, 'submit_delivery', [
    u32Val(dealId),
  ]);
}

export async function buildSettleDeal(
  publicKey: string,
  dealId: number
): Promise<string> {
  return buildTx(publicKey, CONTRACTS.DEAL_VAULT, 'settle', [u32Val(dealId)]);
}

// ────────────────────────────────────────────────────────────
// Agent Registry (oracle)
// ────────────────────────────────────────────────────────────

export async function buildSetCreatorVerified(
  publicKey: string,
  agentId: number,
  verified: boolean
): Promise<string> {
  return buildTx(publicKey, CONTRACTS.AGENT_REGISTRY, 'set_creator_verified', [
    u32Val(agentId),
    boolVal(verified),
  ]);
}

// ────────────────────────────────────────────────────────────
// Validation Registry
// ────────────────────────────────────────────────────────────

export async function buildPostDealIntent(
  publicKey: string,
  dealId: number,
  dataHashHex: string
): Promise<string> {
  const hex = dataHashHex.replace(/^0x/, '');
  const dataHash = new Uint8Array(
    hex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? new Array(32).fill(0)
  );
  const padded = new Uint8Array(32);
  padded.set(dataHash.slice(0, 32));
  const signature = new Uint8Array(64).fill(0);

  return buildTx(publicKey, CONTRACTS.VALIDATION_REGISTRY, 'post_artifact', [
    u32Val(dealId),
    symbolVal('DealIntent'),
    xdr.ScVal.scvBytes(Buffer.from(padded)),
    addressVal(publicKey),
    xdr.ScVal.scvBytes(Buffer.from(signature)),
  ]);
}

// ────────────────────────────────────────────────────────────
// Campaign Oracle
// ────────────────────────────────────────────────────────────

export type { OracleResult };

export async function getOracleResult(dealId: number): Promise<OracleResult> {
  return readContract(
    CONTRACTS.CAMPAIGN_ORACLE,
    'get_result',
    [u32Val(dealId)],
    decodeOracleResult
  );
}

export async function hasOracleResult(dealId: number): Promise<boolean> {
  return readContract(
    CONTRACTS.CAMPAIGN_ORACLE,
    'has_result',
    [u32Val(dealId)],
    decodeBool
  );
}

export async function buildPostOracleResult(
  publicKey: string,
  dealId: number,
  engagementBps: number,
  postTimestamp: bigint,
  success: boolean
): Promise<string> {
  return buildTx(publicKey, CONTRACTS.CAMPAIGN_ORACLE, 'post_result', [
    u32Val(dealId),
    u32Val(engagementBps),
    u64Val(postTimestamp),
    boolVal(success),
  ]);
}

// ────────────────────────────────────────────────────────────
// Pact Market
// ────────────────────────────────────────────────────────────

export async function getMarket(dealId: number): Promise<Market> {
  return readContract<Market>(
    CONTRACTS.PACT_MARKET,
    'get_market',
    [u32Val(dealId)]
  );
}

export async function getYesPrice(dealId: number): Promise<number> {
  return readContract<number>(
    CONTRACTS.PACT_MARKET,
    'get_yes_price',
    [u32Val(dealId)]
  );
}

export async function buildBuyTokens(
  publicKey: string,
  dealId: number,
  isYes: boolean,
  usdcIn: bigint
): Promise<string> {
  return buildTx(publicKey, CONTRACTS.PACT_MARKET, 'buy', [
    addressVal(publicKey),
    u32Val(dealId),
    boolVal(isYes),
    i128Val(usdcIn),
  ]);
}

export async function buildRedeem(
  publicKey: string,
  dealId: number
): Promise<string> {
  return buildTx(publicKey, CONTRACTS.PACT_MARKET, 'redeem', [
    addressVal(publicKey),
    u32Val(dealId),
  ]);
}
