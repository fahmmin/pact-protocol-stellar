import {
  rpc as SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
  Address,
  scValToNative,
  xdr,
  Contract,
  Keypair,
} from '@stellar/stellar-sdk';
import { NETWORK, USDC_DECIMALS } from './constants';

// Singleton RPC server instance
let _rpc: SorobanRpc.Server | null = null;

export function getRpc(): SorobanRpc.Server {
  if (!_rpc) {
    _rpc = new SorobanRpc.Server(NETWORK.RPC_URL, { allowHttp: false });
  }
  return _rpc;
}

export function getNetworkPassphrase(): string {
  return NETWORK.PASSPHRASE;
}

// Convert USDC raw int128 to human-readable
export function formatUsdc(raw: bigint | number): string {
  const num = typeof raw === 'bigint' ? Number(raw) : raw;
  return (num / Math.pow(10, USDC_DECIMALS)).toFixed(2);
}

// Parse USDC human-readable string to raw int128
export function parseUsdc(human: string): bigint {
  return BigInt(Math.round(parseFloat(human) * Math.pow(10, USDC_DECIMALS)));
}

// Shorten a Stellar address for display
export function shortAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// Build a Soroban transaction for simulation or submission
export async function buildTx(
  publicKey: string,
  contractId: string,
  method: string,
  args: xdr.ScVal[] = []
): Promise<string> {
  const rpc = getRpc();
  let account;
  try {
    account = await rpc.getAccount(publicKey);
  } catch {
    throw new Error(
      'Account not found on testnet. Fund your wallet with Friendbot before submitting transactions.'
    );
  }

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK.PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await withTimeout(
    rpc.simulateTransaction(tx),
    30000,
    `Simulation timed out while building ${method}.`
  );
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    const events =
      'events' in simResult && Array.isArray(simResult.events)
        ? simResult.events
            .map((e) => ('message' in e && typeof e.message === 'string' ? e.message : ''))
            .filter(Boolean)
            .join('; ')
        : '';
    throw new Error(
      `Simulation failed: ${simResult.error ?? 'unknown'}${events ? ` (${events})` : ''}`
    );
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toXDR();
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Submit a signed XDR transaction and poll for result
export async function submitAndWait(signedXdr: string): Promise<string> {
  const rpc = getRpc();
  const result = await rpc.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, NETWORK.PASSPHRASE)
  );

  if (result.status === 'ERROR') {
    throw new Error(`Send failed: ${result.errorResult?.toXDR()}`);
  }

  const hash = result.hash;
  // Poll until confirmed
  let attempts = 0;
  while (attempts < 30) {
    await new Promise((r) => setTimeout(r, 2000));
    const txResult = await rpc.getTransaction(hash);
    if (txResult.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      return hash;
    }
    if (txResult.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction failed: ${hash}`);
    }
    attempts++;
  }
  throw new Error(`Transaction timed out after 60s: ${hash}`);
}

// Read-only: simulate a contract call and return the result value
export async function readContract<T>(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = [],
  decode?: (val: xdr.ScVal) => T
): Promise<T> {
  const rpc = getRpc();
  const dummyKeypair = Keypair.random();
  const dummyAccount = {
    accountId: () => dummyKeypair.publicKey(),
    sequenceNumber: () => '0',
    incrementSequenceNumber: () => {},
  };

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(dummyAccount as any, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK.PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Read failed: ${sim.error}`);
  }
  if (!sim.result) throw new Error('No result from simulation');

  const retval = sim.result.retval;
  if (decode) {
    return decode(retval);
  }
  return scValToNative(retval) as T;
}

// Helper: convert u32 to ScVal
export function u32Val(n: number): xdr.ScVal {
  return xdr.ScVal.scvU32(n);
}

// Helper: convert string Address to ScVal
export function addressVal(addr: string): xdr.ScVal {
  return Address.fromString(addr).toScVal();
}

// Helper: string to ScVal Symbol (for enum arms)
export function symbolVal(s: string): xdr.ScVal {
  return xdr.ScVal.scvSymbol(s);
}

// Helper: string to ScVal String
export function stringVal(env: string, s: string): xdr.ScVal {
  return nativeToScVal(s, { type: 'string' });
}

// Helper: i128 to ScVal
export function i128Val(n: bigint): xdr.ScVal {
  return nativeToScVal(n, { type: 'i128' }) as xdr.ScVal;
}

// Helper: u64 to ScVal
export function u64Val(n: bigint): xdr.ScVal {
  return xdr.ScVal.scvU64(new xdr.Uint64(n));
}

// Helper: bool to ScVal
export function boolVal(b: boolean): xdr.ScVal {
  return xdr.ScVal.scvBool(b);
}

// Generate a new keypair (for test setup)
export function generateKeypair(): { publicKey: string; secretKey: string } {
  const kp = Keypair.random();
  return { publicKey: kp.publicKey(), secretKey: kp.secret() };
}

// Fund an account with Friendbot
export async function fundWithFriendbot(publicKey: string): Promise<void> {
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
  );
  if (!res.ok) throw new Error(`Friendbot failed: ${res.statusText}`);
}
