import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/store/useAuthStore';
import type { Person } from '../types';

interface HistoryRecord {
  person_id: string;
  board_id: string;
  session_id: string;
  person_name?: string | null;
  board_name?: string | null;
  created_at: string;
  people: { name: string; avatar_color_hex: string };
}

export interface PersonStats {
  id: string;
  name: string;
  avatarColor: string;
  totalPairings: number;
  partnerCounts: Record<string, { count: number; name: string }>;
  timeline: { date: string; partnerName: string | null }[];
}

export interface PairingMatrix {
  personIds: string[];
  personNames: Record<string, string>;
  counts: Record<string, Record<string, number>>;
}

export function useHistoryAnalytics(people: Person[], enabled: boolean = true) {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllHistory = useCallback(async () => {
    if (!user || !enabled) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('pairing_history')
        .select(
          `
          person_id,
          board_id,
          session_id,
          person_name,
          board_name,
          created_at,
          people (name, avatar_color_hex)
        `
        )
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setHistory((data as unknown as HistoryRecord[]) || []);
    } catch (err) {
      console.error('Error fetching full history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, enabled]);

  useEffect(() => {
    if (enabled) {
      fetchAllHistory();
    }
  }, [fetchAllHistory, enabled]);

  const peopleKey = useMemo(
    () => people.map((p) => `${p.id}:${p.name}:${p.avatarColorHex}`).join(','),
    [people]
  );

  const stablePeople = useMemo(() => people, [peopleKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const analytics = useMemo(() => {
    if (!history.length || !enabled) {
      return {
        personStats: {},
        sessionCount: 0,
        matrix: {
          personIds: stablePeople.map((p) => p.id),
          personNames: {},
          counts: {},
        },
      };
    }

    const personStats: Record<string, PersonStats> = {};
    const matrix: Record<string, Record<string, number>> = {};
    const personNames: Record<string, string> = {};

    // Initialize stats for current people
    stablePeople.forEach((p) => {
      personStats[p.id] = {
        id: p.id,
        name: p.name,
        avatarColor: p.avatarColorHex,
        totalPairings: 0,
        partnerCounts: {},
        timeline: [],
      };
      matrix[p.id] = {};
      personNames[p.id] = p.name;
    });

    // Group by session + board
    const pairs: Record<string, Record<string, HistoryRecord[]>> = {};

    history.forEach((row) => {
      if (!pairs[row.session_id]) pairs[row.session_id] = {};
      const groupingKey = row.board_id || row.board_name || 'unknown_board';
      if (!pairs[row.session_id][groupingKey])
        pairs[row.session_id][groupingKey] = [];
      pairs[row.session_id][groupingKey].push(row);
    });

    // Process sessions
    Object.keys(pairs).forEach((sessionId) => {
      const boards = pairs[sessionId];
      Object.keys(boards).forEach((boardId) => {
        const peopleRecordsOnBoard = boards[boardId];

        peopleRecordsOnBoard.forEach((record) => {
          const pId = record.person_id;
          if (!pId || !personStats[pId]) return;

          const others = peopleRecordsOnBoard.filter(
            (o) => o.person_id !== pId
          );
          personStats[pId].totalPairings += 1;

          others.forEach((otherRecord) => {
            const otherId = otherRecord.person_id;
            const otherName =
              otherRecord.person_name || otherRecord.people?.name || 'Unknown';

            if (otherId && personStats[otherId]) {
              if (!personStats[pId].partnerCounts[otherId]) {
                personStats[pId].partnerCounts[otherId] = {
                  count: 0,
                  name: personStats[otherId].name,
                };
              }
              personStats[pId].partnerCounts[otherId].count += 1;
              matrix[pId][otherId] = (matrix[pId][otherId] || 0) + 1;
            } else {
              const synthId = `deleted-${otherName}`;
              if (!personStats[pId].partnerCounts[synthId]) {
                personStats[pId].partnerCounts[synthId] = {
                  count: 0,
                  name: `${otherName} (Removed)`,
                };
              }
              personStats[pId].partnerCounts[synthId].count += 1;
            }
          });

          // Optimized timeline update: Use the record's date directly
          personStats[pId].timeline.push({
            date: record.created_at,
            partnerName:
              others
                .map((o) => o.person_name || o.people?.name || 'Unknown')
                .join(', ') || 'Solo',
          });
        });
      });
    });

    return {
      personStats,
      sessionCount: Object.keys(pairs).length,
      matrix: {
        personIds: stablePeople.map((p) => p.id),
        personNames,
        counts: matrix,
      },
    };
  }, [history, stablePeople, enabled]);

  return { ...analytics, isLoading, refreshHistory: fetchAllHistory };
}
