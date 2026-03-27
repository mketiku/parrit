// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { applyBulkMove, getHintVisibility } from './pairingWorkspace.helpers';
import type { PairingBoard } from '../types';

const boards: PairingBoard[] = [
  {
    id: 'board-1',
    name: 'Core',
    isExempt: false,
    isLocked: false,
    sortOrder: 0,
    goals: [],
    assignedPersonIds: ['person-1'],
  },
  {
    id: 'board-2',
    name: 'Infra',
    isExempt: false,
    isLocked: false,
    sortOrder: 1,
    goals: ['Ship'],
    assignedPersonIds: ['person-2'],
  },
];

const boardsWithoutGoals = boards.map((board) => ({
  ...board,
  goals: [],
}));

describe('pairingWorkspace helpers', () => {
  it('prioritizes the goals hint over history and heatmap hints', () => {
    expect(
      getHintVisibility({
        hintGoalsSeen: false,
        hintHistorySeen: false,
        hintHeatmapSeen: false,
        gettingStartedDismissed: true,
        hasSessionSaved: true,
        hasJustSaved: true,
        sessionCount: 4,
        boards: boardsWithoutGoals,
      })
    ).toEqual({
      showGoalsHint: true,
      showHistoryHint: false,
      showHeatmapHint: false,
    });
  });

  it('falls through to the history hint after goals are already covered', () => {
    expect(
      getHintVisibility({
        hintGoalsSeen: true,
        hintHistorySeen: false,
        hintHeatmapSeen: false,
        gettingStartedDismissed: true,
        hasSessionSaved: true,
        hasJustSaved: true,
        sessionCount: 4,
        boards,
      })
    ).toEqual({
      showGoalsHint: false,
      showHistoryHint: true,
      showHeatmapHint: false,
    });
  });

  it('moves selected people to a target board and clears them from other boards', () => {
    expect(
      applyBulkMove(boards, new Set(['person-1', 'person-2']), 'board-1')
    ).toEqual([
      {
        ...boards[0],
        assignedPersonIds: ['person-1', 'person-2'],
      },
      {
        ...boards[1],
        assignedPersonIds: [],
      },
    ]);
  });

  it('supports bulk unpairing by removing selected people without reassigning them', () => {
    expect(
      applyBulkMove(boards, new Set(['person-1', 'person-2']), 'unpaired')
    ).toEqual([
      {
        ...boards[0],
        assignedPersonIds: [],
      },
      {
        ...boards[1],
        assignedPersonIds: [],
      },
    ]);
  });
});
