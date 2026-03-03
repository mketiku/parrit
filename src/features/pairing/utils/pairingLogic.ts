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
  const exemptOrLockedPersonIds = new Set<string>();
  boards
    .filter((b) => b.isExempt || b.isLocked)
    .forEach((b) => {
      (b.assignedPersonIds || []).forEach((id) =>
        exemptOrLockedPersonIds.add(id)
      );
    });

  // Calculate continuity for active boards
  const orderedSessionIds = Array.from(
    new Set(history.map((h) => h.session_id))
  );

  const getConsecutiveCount = (personId: string, boardId: string) => {
    let count = 0;
    for (const sessionId of orderedSessionIds) {
      const wasOnBoard = history.some(
        (h) =>
          h.session_id === sessionId &&
          h.board_id === boardId &&
          h.person_id === personId
      );
      if (wasOnBoard) count++;
      else break;
    }
    return count;
  };

  const boardKeepMap = new Map<string, string>(); // boardId -> personId kept
  const unassigned: Person[] = [];

  const activeBoardsOriginal = boards.filter((b) => !b.isExempt && !b.isLocked);

  activeBoardsOriginal.forEach((board) => {
    const assignedIds = (board.assignedPersonIds || []).filter(
      (id) => !exemptOrLockedPersonIds.has(id)
    );

    if (assignedIds.length === 0) return;

    // Find the newest person (lowest count)
    let keptId = assignedIds[0];
    let minCount = Infinity;

    assignedIds.forEach((id) => {
      const count = getConsecutiveCount(id, board.id);
      if (count < minCount) {
        minCount = count;
        keptId = id;
      } else if (count === minCount) {
        // Tie-breaker: random
        if (Math.random() > 0.5) keptId = id;
      }
    });

    boardKeepMap.set(board.id, keptId);
  });

  // Collect unassigned people
  people.forEach((p) => {
    if (exemptOrLockedPersonIds.has(p.id)) return;

    // If they aren't on any board, or they are on an active board but NOT the kept person
    let isKept = false;
    activeBoardsOriginal.forEach((b) => {
      if (
        boardKeepMap.get(b.id) === p.id &&
        (b.assignedPersonIds || []).includes(p.id)
      ) {
        isKept = true;
      }
    });

    if (!isKept) {
      unassigned.push(p);
    }
  });

  unassigned.sort(() => Math.random() - 0.5); // Randomize pool

  const newBoards = boards.map((b) => {
    const assigned =
      b.isExempt || b.isLocked ? [...(b.assignedPersonIds || [])] : [];
    if (!b.isExempt && !b.isLocked && boardKeepMap.has(b.id)) {
      assigned.push(boardKeepMap.get(b.id)!);
    }
    return {
      ...b,
      assignedPersonIds: assigned,
    };
  });

  const activeBoards = newBoards.filter((b) => !b.isExempt && !b.isLocked);
  if (activeBoards.length === 0) return boards;

  // 3. Smart Assignment Logic (Least Recent Pair First)

  // Phase A: Create Core Pairs (Up to 2 people per board)
  for (const board of activeBoards) {
    if (unassigned.length === 0) break;

    let p1Id: string;

    if (board.assignedPersonIds.length === 0) {
      // Board is empty. Pop 1 person and then find best partner.
      const p1 = unassigned.pop()!;
      board.assignedPersonIds.push(p1.id);
      p1Id = p1.id;
    } else {
      // Board already has the kept person
      p1Id = board.assignedPersonIds[0];
    }

    if (board.assignedPersonIds.length < 2 && unassigned.length > 0) {
      // Find the best partner for p1Id
      let bestP2Index = -1;
      let oldestTime = '9999-12-31';

      unassigned.forEach((candidate, idx) => {
        const lastTime = lastPairedAt[p1Id]?.[candidate.id] || '0000-01-01';
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
    activeBoards.sort(
      (a, b) =>
        (a.assignedPersonIds?.length || 0) - (b.assignedPersonIds?.length || 0)
    );
    activeBoards[0].assignedPersonIds.push(pNext.id);
  }

  return newBoards;
}
