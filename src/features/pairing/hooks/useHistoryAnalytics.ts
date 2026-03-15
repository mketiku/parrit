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

export function useHistoryAnalytics(people: Person[]) {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllHistory = useCallback(async () => {
    if (!user) return;
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory((data as unknown as HistoryRecord[]) || []);
    } catch (err) {
      console.error('Error fetching full history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllHistory();
  }, [fetchAllHistory]);

  const peopleKey = useMemo(
    () => people.map((p) => `${p.id}:${p.name}:${p.avatarColorHex}`).join(','),
    [people]
  );

  const stablePeople = useMemo(() => people, [peopleKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const analytics = useMemo(() => {
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
    const pairs: Record<string, Record<string, HistoryRecord[]>> = {}; // session -> board -> records

    history.forEach((row) => {
      if (!pairs[row.session_id]) pairs[row.session_id] = {};
      // Use board_id if available, fallback to board_name if the board was deleted
      const groupingKey = row.board_id || row.board_name || 'unknown_board';
      if (!pairs[row.session_id][groupingKey])
        pairs[row.session_id][groupingKey] = [];
      pairs[row.session_id][groupingKey].push(row);
    });

    // Process pairs
    Object.keys(pairs).forEach((sessionId) => {
      const boards = pairs[sessionId];
      Object.keys(boards).forEach((boardId) => {
        const peopleRecordsOnBoard = boards[boardId];

        peopleRecordsOnBoard.forEach((record) => {
          const pId = record.person_id;
          if (!personStats[pId]) {
            // Person might have been deleted but exists in history
            return;
          }

          const others = peopleRecordsOnBoard.filter(
            (o) => o.person_id !== pId
          );
          personStats[pId].totalPairings += 1;

          others.forEach((otherRecord) => {
            const otherId = otherRecord.person_id;
            const otherName =
              otherRecord.person_name ||
              otherRecord.people?.name ||
              'Unknown (Removed)';

            // If the other person is still active in the store
            if (personStats[otherId]) {
              // Update partner counts
              if (!personStats[pId].partnerCounts[otherId]) {
                personStats[pId].partnerCounts[otherId] = {
                  count: 0,
                  name: personStats[otherId].name,
                };
              }
              personStats[pId].partnerCounts[otherId].count += 1;

              // Update matrix
              if (!matrix[pId]) matrix[pId] = {};
              matrix[pId][otherId] = (matrix[pId][otherId] || 0) + 1;
            } else {
              // The partner was deleted. We still want to track the explicit count but we can use a synthetic ID
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

          // Update timeline
          const firstRow = history.find((r) => r.session_id === sessionId);
          if (firstRow) {
            personStats[pId].timeline.push({
              date: firstRow.created_at,
              partnerName:
                others
                  .map(
                    (o) =>
                      o.person_name || o.people?.name || 'Unknown (Removed)'
                  )
                  .join(', ') || 'Solo',
            });
          }
        });
      });
    });

    const sessionCount = Object.keys(pairs).length;

    return {
      personStats,
      sessionCount,
      matrix: {
        personIds: stablePeople.map((p) => p.id),
        personNames,
        counts: matrix,
      },
    };
  }, [history, stablePeople]);

  return { ...analytics, isLoading, refreshHistory: fetchAllHistory };
}
