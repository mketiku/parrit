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
        .limit(200);

      if (error || !data) return;

      // Group by session preserving order (descending = newest first)
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

      // Build recency map: pair → most recent session index they appeared together in
      const recency: Record<string, number> = {};
      sessionOrder.forEach((sessionId, sessionIdx) => {
        const boards = sessionBoards[sessionId];
        Object.values(boards).forEach((pIds) => {
          for (let i = 0; i < pIds.length; i++) {
            for (let j = i + 1; j < pIds.length; j++) {
              const key = buildPairKey(pIds[i], pIds[j]);
              if (recency[key] === undefined) {
                // Only record on first (most recent) occurrence
                recency[key] = sessionIdx;
              }
            }
          }
        });
      });

      setPairRecency(recency);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Returns true if p1 and p2 have paired in the last `staleSessions` sessions.
   * (i.e., they are "not fresh" — highlight them to prompt rotation)
   */
  const isRecentPair = (p1: string, p2: string): boolean => {
    const key = buildPairKey(p1, p2);
    const recencyIdx = pairRecency[key];
    return recencyIdx !== undefined && recencyIdx < stalePairThreshold;
  };

  /**
   * Returns the session index the pair last appeared in (0 = most recent), or undefined.
   */
  const getPairRecency = (p1: string, p2: string): number | undefined => {
    const key = buildPairKey(p1, p2);
    return pairRecency[key];
  };

  return { isRecentPair, getPairRecency, isLoading, refresh: load };
}
