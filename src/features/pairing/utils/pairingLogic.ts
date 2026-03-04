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

  // 0. Prepare history: avoid mutating input and inject current board state
  // Inject current board state into history so that we ALWAYS penalize the currently paired people
  // from pairing again, even if the user hasn't clicked "Save Session" yet!
  const currentSessionTime = new Date().toISOString();
  const augmentedHistory: HistoryRow[] = [...history];

  boards.forEach((b) => {
    (b.assignedPersonIds || []).forEach((pId) => {
      augmentedHistory.push({
        session_id: 'current-unsaved-session',
        board_id: b.id,
        person_id: pId,
        created_at: currentSessionTime,
      });
    });
  });

  // 1. Build recency map: lastPairedAt[p1][p2] = ISO timestamp
  const lastPairedAt: Record<string, Record<string, string>> = {};

  // Group history by session + board to identify historical pairs
  const sessionMap: Record<string, Record<string, string[]>> = {};
  const sessionTimeMap: Record<string, string> = {};

  augmentedHistory.forEach((row) => {
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
  // We want the sessions ordered newest to oldest to count the current consecutive streak.
  const orderedSessionIds = Array.from(
    new Set(augmentedHistory.map((h) => h.session_id))
  ).sort((a, b) => {
    const timeA = sessionTimeMap[a] || '0000-01-01';
    const timeB = sessionTimeMap[b] || '0000-01-01';
    return timeB.localeCompare(timeA); // Newest first
  });

  const getConsecutiveCount = (personId: string, boardId: string) => {
    let count = 0;
    for (const sessionId of orderedSessionIds) {
      const wasOnBoard = (sessionMap[sessionId]?.[boardId] || []).includes(
        personId
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

  const newBoards: PairingBoard[] = boards.map((b) => {
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
  // First, if any active boards are completely empty, fill them with 1 person to have a baseline to pair against.
  for (const board of activeBoards) {
    if (board.assignedPersonIds!.length === 0 && unassigned.length > 0) {
      board.assignedPersonIds!.push(unassigned.pop()!.id);
    }
  }

  // Next, globally evaluate the best (Board, Candidate) pairs.
  while (unassigned.length > 0) {
    const eligibleBoards = activeBoards.filter(
      (b) => b.assignedPersonIds!.length < 2
    );
    if (eligibleBoards.length === 0) break; // All active boards have at least 2 people

    let bestBoard: PairingBoard | null = null;
    let bestCandidateIndex = -1;
    let oldestTime = '9999-12-31';

    for (const board of eligibleBoards) {
      // Guaranteed to be at least length 1 because we seeded empty boards above.
      // E.g. p1 is the kept person.
      const p1Id = board.assignedPersonIds![0];

      for (let cIdx = 0; cIdx < unassigned.length; cIdx++) {
        const candidate = unassigned[cIdx];
        const lastTime = lastPairedAt[p1Id]?.[candidate.id] || '0000-01-01';

        // Randomize tie-breakers if time represents the identical oldest paired time
        if (
          lastTime < oldestTime ||
          (lastTime === oldestTime && Math.random() > 0.5)
        ) {
          oldestTime = lastTime;
          bestBoard = board;
          bestCandidateIndex = cIdx;
        }
      }
    }

    if (bestBoard && bestCandidateIndex !== -1) {
      const p2 = unassigned.splice(bestCandidateIndex, 1)[0];
      bestBoard.assignedPersonIds!.push(p2.id);
    } else {
      break;
    }
  }

  // Phase B: Overflow (distribute remaining people to least-filled boards)
  while (unassigned.length > 0) {
    const pNext = unassigned.pop()!;
    activeBoards.sort(
      (a, b) =>
        (a.assignedPersonIds?.length || 0) - (b.assignedPersonIds?.length || 0)
    );
    activeBoards[0].assignedPersonIds!.push(pNext.id);
  }

  return newBoards;
}
