import type { StateCreator } from 'zustand';
import type { PairingBoard } from '../../types';
import type { PairingStore } from '../usePairingStore';

export interface BaseSlice {
  isLoading: boolean;
  isSaving: boolean;
  isRecommending: boolean;
  error: string | null;
  previousBoards: PairingBoard[] | null;
  _delay: (ms: number) => Promise<void>;
  _loading?: boolean;
}

export const createBaseSlice: StateCreator<
  PairingStore,
  [],
  [],
  BaseSlice
> = () => ({
  isLoading: false,
  isSaving: false,
  isRecommending: false,
  error: null,
  previousBoards: null,
  _delay: (ms: number) => new Promise((res) => setTimeout(res, ms)),
});
