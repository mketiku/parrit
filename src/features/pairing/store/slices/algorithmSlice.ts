import type { StateCreator } from 'zustand';
import { supabase } from '../../../../lib/supabase';
import { useToastStore } from '../../../../store/useToastStore';
import { calculateRecommendations } from '../../utils/pairingLogic';
import type { HistoryRow } from './helpers';
import type { PairingStore } from '../usePairingStore';

const toast = () => useToastStore.getState();

export interface AlgorithmSlice {
  recommendPairs: () => Promise<void>;
}

export const createAlgorithmSlice: StateCreator<
  PairingStore,
  [],
  [],
  AlgorithmSlice
> = (set, get) => ({
  recommendPairs: async () => {
    const { people, boards } = get();
    if (people.length < 2) return;

    set({ isRecommending: true });

    // Only add delay in local dev; production network latency is enough delay
    if (import.meta.env.DEV && !import.meta.env.VITEST) {
      await get()._delay(800);
    }

    try {
      // 1. Fetch recent history
      const { data: history, error: historyErr } = await supabase
        .from('pairing_history')
        .select('person_id, board_id, session_id, created_at')
        .order('created_at', { ascending: false })
        .limit(400);

      if (historyErr) throw historyErr;

      // 2. Run the algorithm
      const newBoards = calculateRecommendations(
        people,
        boards,
        (history as unknown as HistoryRow[]) || []
      );

      // 3. Update state and persists
      set({ boards: newBoards });
      await get().persistBoardAssignments(newBoards);

      toast().addToast('Rotation recommended!', 'success');
    } catch (err) {
      console.error('Recommendation Error:', err);
      toast().addToast(
        'RAAA What the heck?! Algorithm failed to load history data. 🦜',
        'error'
      );
    } finally {
      set({ isRecommending: false });
    }
  },
});
