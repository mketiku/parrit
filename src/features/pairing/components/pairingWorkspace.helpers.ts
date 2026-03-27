import type { PairingBoard } from '../types';

export interface HintVisibilityInput {
  hintGoalsSeen: boolean;
  hintHistorySeen: boolean;
  hintHeatmapSeen: boolean;
  gettingStartedDismissed: boolean;
  hasSessionSaved: boolean;
  hasJustSaved: boolean;
  sessionCount: number;
  boards: PairingBoard[];
}

export interface HintVisibilityState {
  showGoalsHint: boolean;
  showHistoryHint: boolean;
  showHeatmapHint: boolean;
}

export function getHintVisibility({
  hintGoalsSeen,
  hintHistorySeen,
  hintHeatmapSeen,
  gettingStartedDismissed,
  hasSessionSaved,
  hasJustSaved,
  sessionCount,
  boards,
}: HintVisibilityInput): HintVisibilityState {
  const boardsWithNoGoals = boards.filter(
    (board) =>
      !board.isExempt &&
      (board.goals || []).length === 0 &&
      (board.assignedPersonIds || []).length > 0
  );

  const hasAnyGoals = boards.some((board) => (board.goals || []).length > 0);

  const goalsHintEligible =
    !hintGoalsSeen &&
    gettingStartedDismissed &&
    boardsWithNoGoals.length > 0 &&
    !hasAnyGoals;
  const historyHintEligible =
    !hintHistorySeen &&
    gettingStartedDismissed &&
    hasSessionSaved &&
    hasJustSaved;
  const heatmapHintEligible =
    !hintHeatmapSeen && gettingStartedDismissed && sessionCount >= 3;

  return {
    showGoalsHint: goalsHintEligible,
    showHistoryHint: !goalsHintEligible && historyHintEligible,
    showHeatmapHint:
      !goalsHintEligible && !historyHintEligible && heatmapHintEligible,
  };
}

export function applyBulkMove(
  boards: PairingBoard[],
  selectedPersonIds: Set<string>,
  targetBoardId: string
): PairingBoard[] {
  if (selectedPersonIds.size === 0) {
    return boards;
  }

  return boards.map((board) => {
    const newAssigned = (board.assignedPersonIds || []).filter(
      (id) => !selectedPersonIds.has(id)
    );

    if (board.id === targetBoardId && targetBoardId !== 'unpaired') {
      return {
        ...board,
        assignedPersonIds: [...newAssigned, ...Array.from(selectedPersonIds)],
      };
    }

    return {
      ...board,
      assignedPersonIds: newAssigned,
    };
  });
}
