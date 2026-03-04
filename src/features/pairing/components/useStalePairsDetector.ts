import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';

/**
 * Returns a map of `personId1:personId2` → session recency index (lower = more recent).
 * 0 means paired in the most recent session.
 * undefined means never paired (or no history).
 *
 * A pair is considered "stale" if they have paired in the last N sessions.
 */
export function useStalePairsDetector() {
  const { stalePairThreshold } = useWorkspacePrefsStore();
  const [pairRecency, setPairRecency] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const buildPairKey = (id1: string, id2: string) =>
    [id1, id2].sort().join(':');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pairing_history')
        .select('person_id, board_id, session_id, created_at')
        .order('created_at', { ascending: false })
        .limit(500); // Increased limit slightly for better windowing

      if (error || !data) return;

      const sessionOrder: string[] = [];
      const sessionBoards: Record<string, Record<string, string[]>> = {};

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

      // Calculate consecutive sessions for each pair starting from the newest session
      const consecutive: Record<string, number> = {};
      const pairsFoundInMostRecent = new Set<string>();

      // Populate which pairs exist in the VERY most recent session
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

      // Count back from session 0 (newest) until the pairing breaks
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
            // Once they haven't paired for a session, the streak is over
            break;
          }
        }
        consecutive[pairKey] = count;
      });

      setPairRecency(consecutive);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Returns true if p1 and p2 have paired for at least `stalePairThreshold` consecutive sessions.
   * This flags pairs that have been "stuck" together for too long.
   */
  const isRecentPair = (p1: string, p2: string): boolean => {
    const key = buildPairKey(p1, p2);
    const consecutiveCount = pairRecency[key] || 0;
    return consecutiveCount >= stalePairThreshold;
  };

  /**
   * Returns the number of consecutive sessions the pair has been together starting from today.
   */
  const getPairRecency = (p1: string, p2: string): number | undefined => {
    const key = buildPairKey(p1, p2);
    return pairRecency[key];
  };

  return { isRecentPair, getPairRecency, isLoading, refresh: load };
}
