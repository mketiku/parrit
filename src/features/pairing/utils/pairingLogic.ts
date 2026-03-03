import type { Person, PairingBoard } from '../types';

export interface HistoryRow {
  person_id: string;
  board_id: string;
  session_id: string;
  created_at?: string;
}

/**
 * Core pairing recommendation algorithm.
 * Extracted for testability and clarity.
 */
export function calculateRecommendations(
  people: Person[],
  boards: PairingBoard[],
  history: HistoryRow[]
): PairingBoard[] {
  if (people.length < 2) return boards;

  // 1. Build recency map: lastPairedAt[p1][p2] = ISO timestamp
  const lastPairedAt: Record<string, Record<string, string>> = {};

  // Group history by session + board to identify historical pairs
  const sessionMap: Record<string, Record<string, string[]>> = {};
  const sessionTimeMap: Record<string, string> = {};

  history.forEach((row) => {
    if (!sessionMap[row.session_id]) sessionMap[row.session_id] = {};
    if (!sessionMap[row.session_id][row.board_id])
      sessionMap[row.session_id][row.board_id] = [];

    sessionMap[row.session_id][row.board_id].push(row.person_id);
    if (
      row.created_at &&
      (!sessionTimeMap[row.session_id] ||
        row.created_at > sessionTimeMap[row.session_id])
    ) {
      sessionTimeMap[row.session_id] = row.created_at;
    }
  });

  // Calculate most recent pairing time for every combination seen in history
  Object.keys(sessionMap).forEach((sessionId) => {
    const time = sessionTimeMap[sessionId] || '0000-01-01';
    const boardsInSession = sessionMap[sessionId];

    Object.values(boardsInSession).forEach((peopleOnBoard) => {
      for (let i = 0; i < peopleOnBoard.length; i++) {
        for (let j = i + 1; j < peopleOnBoard.length; j++) {
          const p1 = peopleOnBoard[i];
          const p2 = peopleOnBoard[j];

          if (!lastPairedAt[p1]) lastPairedAt[p1] = {};
          if (!lastPairedAt[p2]) lastPairedAt[p2] = {};

          // If we see this pair again in an older session (due to loop order),
          // don't overwrite if we already have a newer timestamp.
          if (!lastPairedAt[p1][p2] || time > lastPairedAt[p1][p2]) {
            lastPairedAt[p1][p2] = time;
            lastPairedAt[p2][p1] = time;
          }
        }
      }
    });
  });

  // 2. Identify who needs assigning
  const exemptPersonIds = new Set<string>();
  boards
    .filter((b) => b.isExempt)
    .forEach((b) => {
      (b.assignedPersonIds || []).forEach((id) => exemptPersonIds.add(id));
    });

  const unassigned = people
    .filter((p) => !exemptPersonIds.has(p.id))
    .sort(() => Math.random() - 0.5); // Randomize initial pool for varied results

  const newBoards = boards.map((b) => ({
    ...b,
    assignedPersonIds: b.isExempt
      ? [...(b.assignedPersonIds || [])]
      : ([] as string[]),
  }));

  const activeBoards = newBoards.filter((b) => !b.isExempt);
  if (activeBoards.length === 0) return boards;

  // 3. Smart Assignment Logic (Least Recent Pair First)

  // Phase A: Create Core Pairs (2 people per board)
  for (const board of activeBoards) {
    if (unassigned.length === 0) break;

    const p1 = unassigned.pop()!;
    board.assignedPersonIds.push(p1.id);

    if (unassigned.length > 0) {
      // Find the best partner for p1
      let bestP2Index = -1;
      let oldestTime = '9999-12-31';

      unassigned.forEach((candidate, idx) => {
        const lastTime = lastPairedAt[p1.id]?.[candidate.id] || '0000-01-01';
        if (lastTime < oldestTime) {
          oldestTime = lastTime;
          bestP2Index = idx;
        }
      });

      if (bestP2Index !== -1) {
        const p2 = unassigned.splice(bestP2Index, 1)[0];
        board.assignedPersonIds.push(p2.id);
      }
    }
  }

  // Phase B: Overflow (distribute remaining people to least-filled boards)
  while (unassigned.length > 0) {
    const pNext = unassigned.pop()!;
    const targetBoard = activeBoards.sort(
      (a, b) =>
        (a.assignedPersonIds?.length || 0) - (b.assignedPersonIds?.length || 0)
    )[0];
    targetBoard.assignedPersonIds.push(pNext.id);
  }

  return newBoards;
}
