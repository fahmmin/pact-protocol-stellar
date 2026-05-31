'use client';

import { create } from 'zustand';
import { submitAndWait } from '@/lib/stellar';

export type TxStatus = 'idle' | 'building' | 'signing' | 'pending' | 'success' | 'error';

export interface TxState {
  status: TxStatus;
  hash: string | null;
  error: string | null;
  message: string | null;
}

interface AppStore {
  // Wallet
  walletAddress: string | null;
  isWalletConnected: boolean;
  setWallet: (address: string | null) => void;

  // Agent
  agentId: number | null;
  agentType: 'Creator' | 'Brand' | null;
  setAgent: (id: number | null, type: 'Creator' | 'Brand' | null) => void;

  // Transaction
  tx: TxState;
  setTxStatus: (status: TxStatus, extra?: { hash?: string; error?: string; message?: string }) => void;
  resetTx: () => void;

  // Submit a signed XDR and track it
  submitTx: (signedXdr: string) => Promise<string>;
}

const initialTx: TxState = {
  status: 'idle',
  hash: null,
  error: null,
  message: null,
};

function loadPersistedWallet(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('pact_wallet') || null;
  } catch {
    return null;
  }
}

const persistedWallet = loadPersistedWallet();

export const useAppStore = create<AppStore>((set, get) => ({
  walletAddress: persistedWallet,
  isWalletConnected: !!persistedWallet,
  setWallet: (address) => {
    if (typeof window !== 'undefined') {
      try {
        if (address) localStorage.setItem('pact_wallet', address);
        else localStorage.removeItem('pact_wallet');
      } catch {
        /* ignore */
      }
    }
    set({ walletAddress: address, isWalletConnected: !!address });
  },

  agentId: null,
  agentType: null,
  setAgent: (id, type) => set({ agentId: id, agentType: type }),

  tx: initialTx,
  setTxStatus: (status, extra = {}) =>
    set({
      tx: {
        status,
        hash: extra.hash ?? null,
        error: extra.error ?? null,
        message: extra.message ?? null,
      },
    }),
  resetTx: () => set({ tx: initialTx }),

  submitTx: async (signedXdr: string) => {
    set({ tx: { status: 'pending', hash: null, error: null, message: 'Broadcasting...' } });
    try {
      const hash = await submitAndWait(signedXdr);
      set({ tx: { status: 'success', hash, error: null, message: 'Confirmed on-chain!' } });
      return hash;
    } catch (err: any) {
      const msg = err?.message || 'Unknown error';
      set({ tx: { status: 'error', hash: null, error: msg, message: null } });
      throw err;
    }
  },
}));
