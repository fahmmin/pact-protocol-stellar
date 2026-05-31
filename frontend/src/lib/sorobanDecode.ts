import { Address, xdr } from '@stellar/stellar-sdk';
import type { AgentProfile, ReputationScore } from './contracts';

/** Soroban enums are u32 discriminants; scValToNative throws "Bad union switch" on them. */
function enumDiscriminant(val: xdr.ScVal): number {
  switch (val.switch().value) {
    case xdr.ScValType.scvU32().value:
      return Number(val.value() ?? 0);
    case xdr.ScValType.scvVec().value: {
      const vec = val.vec();
      if (!vec || vec.length === 0) return 0;
      const head = vec[0];
      if (head.switch().value === xdr.ScValType.scvSymbol().value) {
        const sym = head.sym()?.toString() ?? '';
        if (sym === 'Brand' || sym === 'Silver' || sym === 'Gold' || sym === 'Diamond') {
          return sym === 'Brand' ? 1 : sym === 'Silver' ? 1 : sym === 'Gold' ? 2 : sym === 'Diamond' ? 3 : 0;
        }
        return sym === 'Creator' || sym === 'Bronze' ? 0 : 1;
      }
      if (head.switch().value === xdr.ScValType.scvU32().value) {
        return Number(head.value() ?? 0);
      }
      return 0;
    }
    default:
      throw new Error(`Unsupported enum ScVal type: ${val.switch().name}`);
  }
}

function structMap(val: xdr.ScVal): Map<string, xdr.ScVal> {
  if (val.switch().value !== xdr.ScValType.scvMap().value) {
    throw new Error(`Expected ScMap struct, got ${val.switch().name}`);
  }
  const out = new Map<string, xdr.ScVal>();
  for (const entry of val.map() ?? []) {
    const keyVal = entry.key();
    const key =
      keyVal.switch().value === xdr.ScValType.scvSymbol().value
        ? keyVal.sym()?.toString() ?? ''
        : keyVal.switch().value === xdr.ScValType.scvString().value
          ? keyVal.str()?.toString() ?? ''
          : '';
    out.set(key, entry.val());
  }
  return out;
}

function scStr(val: xdr.ScVal): string {
  if (val.switch().value === xdr.ScValType.scvString().value) {
    return val.str()?.toString() ?? '';
  }
  if (val.switch().value === xdr.ScValType.scvSymbol().value) {
    return val.sym()?.toString() ?? '';
  }
  return '';
}

function scAddr(val: xdr.ScVal): string {
  return Address.fromScVal(val).toString();
}

function scU64(val: xdr.ScVal): bigint {
  if (val.switch().value !== xdr.ScValType.scvU64().value) return 0n;
  return BigInt(val.u64()?.toString() ?? '0');
}

function scI128(val: xdr.ScVal): bigint {
  const parts = val.i128();
  if (!parts) return 0n;
  const hi = BigInt(parts.hi()?.toString() ?? '0');
  const lo = BigInt(parts.lo()?.toString() ?? '0');
  const combined = (hi << 64n) + lo;
  const max = 1n << 127n;
  return combined >= max ? combined - (1n << 128n) : combined;
}

function scU32(val: xdr.ScVal): number {
  if (val.switch().value !== xdr.ScValType.scvU32().value) return 0;
  return Number(val.value() ?? 0);
}

function scBool(val: xdr.ScVal): boolean {
  if (val.switch().value === xdr.ScValType.scvBool().value) {
    return Boolean(val.value());
  }
  return false;
}

export function decodeAgentProfile(val: xdr.ScVal): AgentProfile {
  const m = structMap(val);
  const typeDisc = enumDiscriminant(m.get('agent_type')!);
  return {
    wallet: scAddr(m.get('wallet')!),
    agent_type: typeDisc === 1 ? 'Brand' : 'Creator',
    handle: scStr(m.get('handle')!),
    platform: scStr(m.get('platform')!),
    metadata_uri: scStr(m.get('metadata_uri')!),
    follower_count: scU64(m.get('follower_count')!),
    verified: scBool(m.get('verified')!),
    minted_at: scU64(m.get('minted_at')!),
  };
}

export function decodeReputationScore(val: xdr.ScVal): ReputationScore {
  const m = structMap(val);
  return {
    total_deals: scU32(m.get('total_deals')!),
    successful_deals: scU32(m.get('successful_deals')!),
    avg_engagement_bps: scU32(m.get('avg_engagement_bps')!),
    total_volume_usdc: scI128(m.get('total_volume_usdc')!),
    total_staked: scI128(m.get('total_staked')!),
    last_updated: scU64(m.get('last_updated')!),
    tier: enumDiscriminant(m.get('tier')!),
  };
}

export function decodeU32(val: xdr.ScVal): number {
  if (val.switch().value !== xdr.ScValType.scvU32().value) return 0;
  return Number(val.value() ?? 0);
}

export interface OracleResult {
  deal_id: number;
  engagement_bps: number;
  post_timestamp: bigint;
  settled_at: bigint;
  success: boolean;
}

export function decodeOracleResult(val: xdr.ScVal): OracleResult {
  const m = structMap(val);
  return {
    deal_id: scU32(m.get('deal_id')!),
    engagement_bps: scU32(m.get('engagement_bps')!),
    post_timestamp: scU64(m.get('post_timestamp')!),
    settled_at: scU64(m.get('settled_at')!),
    success: scBool(m.get('success')!),
  };
}

export function decodeBool(val: xdr.ScVal): boolean {
  return scBool(val);
}
