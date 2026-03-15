import type { StateCreator } from 'zustand';
import { supabase } from '../../../../lib/supabase';
import { useWorkspacePrefsStore } from '../../../../store/useWorkspacePrefsStore';
import type { PairingStore } from '../usePairingStore';

export interface StalePairsSlice {
  pairRecency: Record<string, number>;
  isStaleLoading: boolean;
  loadStalePairs: () => Promise<void>;
  isRecentPair: (p1: string, p2: string) => boolean;
}

export const createStalePairsSlice: StateCreator<
  PairingStore,
  [],
  [],
  StalePairsSlice
> = (set, get) => ({
  pairRecency: {},
  isStaleLoading: false,

  loadStalePairs: async () => {
    const { isStaleLoading } = get();
    if (isStaleLoading) return;

    set({ isStaleLoading: true });
    try {
      const { data, error } = await supabase
        .from('pairing_history')
        .select('person_id, board_id, session_id, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error || !data) {
        set({ isStaleLoading: false });
        return;
      }

      const sessionOrder: string[] = [];
      const sessionBoards: Record<string, Record<string, string[]>> = {};

      const buildPairKey = (id1: string, id2: string) =>
        [id1, id2].sort().join(':');

      (
        data as {
          person_id: string;
          board_id: string;
          session_id: string;
          created_at: string;
        }[]
      ).forEach((row) => {
        if (!sessionBoards[row.session_id]) {
          sessionBoards[row.session_id] = {};
          sessionOrder.push(row.session_id);
        }
        if (!sessionBoards[row.session_id][row.board_id]) {
          sessionBoards[row.session_id][row.board_id] = [];
        }
        sessionBoards[row.session_id][row.board_id].push(row.person_id);
      });

      const consecutive: Record<string, number> = {};
      const pairsFoundInMostRecent = new Set<string>();

      if (sessionOrder.length > 0) {
        const newestBoards = sessionBoards[sessionOrder[0]];
        Object.values(newestBoards).forEach((pIds) => {
          for (let i = 0; i < pIds.length; i++) {
            for (let j = i + 1; j < pIds.length; j++) {
              pairsFoundInMostRecent.add(buildPairKey(pIds[i], pIds[j]));
            }
          }
        });
      }

      pairsFoundInMostRecent.forEach((pairKey) => {
        let count = 0;
        for (let idx = 0; idx < sessionOrder.length; idx++) {
          const boards = sessionBoards[sessionOrder[idx]];
          let foundInThisSession = false;

          for (const pIds of Object.values(boards)) {
            if (pIds.length >= 2) {
              for (let i = 0; i < pIds.length; i++) {
                for (let j = i + 1; j < pIds.length; j++) {
                  if (buildPairKey(pIds[i], pIds[j]) === pairKey) {
                    foundInThisSession = true;
                    break;
                  }
                }
                if (foundInThisSession) break;
              }
            }
            if (foundInThisSession) break;
          }

          if (foundInThisSession) {
            count++;
          } else {
            break;
          }
        }
        consecutive[pairKey] = count;
      });

      set({ pairRecency: consecutive, isStaleLoading: false });
    } catch (err) {
      console.error('Error loading stale pairs:', err);
      set({ isStaleLoading: false });
    }
  },

  isRecentPair: (p1: string, p2: string): boolean => {
    const { pairRecency } = get();
    // Move dependency on prefs outside to avoid listener overlap
    const threshold = useWorkspacePrefsStore.getState().stalePairThreshold || 3;

    const key = [p1, p2].sort().join(':');
    const consecutiveCount = pairRecency[key] || 0;
    return consecutiveCount >= threshold;
  },
});
