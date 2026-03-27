// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildUpdatedTimestamp,
  groupDetailsByBoard,
  groupSessionsByMonth,
  mapLegacyHistoryRows,
  mapSnapshotDetails,
  type DbHistoryRow,
  type HistoryDetail,
  type HistorySession,
} from './historyScreen.helpers';
import type { PairingBoard, Person } from '../types';

describe('historyScreen helpers', () => {
  it('builds an ISO timestamp from date and time fields', () => {
    expect(buildUpdatedTimestamp('2026-03-27', '14:30')).toBe(
      new Date('2026-03-27T14:30:00').toISOString()
    );
  });

  it('maps snapshot details with fallbacks', () => {
    expect(
      mapSnapshotDetails([
        {
          id: 'board-1',
          name: '',
          goals: [],
          people: [{ id: 'person-1', name: '', avatar_color: '' }],
        },
      ])
    ).toEqual([
      {
        board_name: 'Unknown Board',
        person_name: 'Unknown Person',
        avatar_color: '#94a3b8',
      },
    ]);
  });

  it('maps legacy history rows using row data, joined data, and store fallbacks', () => {
    const rows: DbHistoryRow[] = [
      {
        person_id: 'person-1',
        board_id: 'board-1',
        person_name: null,
        board_name: null,
        people: null,
        pairing_boards: null,
      },
    ];
    const storeBoards: PairingBoard[] = [
      {
        id: 'board-1',
        name: 'Core',
        isExempt: false,
        isLocked: false,
        sortOrder: 0,
        goals: [],
        assignedPersonIds: [],
      },
    ];
    const storePeople: Person[] = [
      { id: 'person-1', name: 'Alice', avatarColorHex: '#111111' },
    ];

    expect(mapLegacyHistoryRows(rows, storeBoards, storePeople)).toEqual([
      {
        board_name: 'Core',
        person_name: 'Alice',
        avatar_color: '#111111',
      },
    ]);
  });

  it('groups details by board and sessions by month', () => {
    const details: HistoryDetail[] = [
      { board_name: 'Core', person_name: 'Alice', avatar_color: '#111111' },
      { board_name: 'Core', person_name: 'Bob', avatar_color: '#222222' },
    ];
    const sessions: HistorySession[] = [
      { id: '1', session_date: '2026-03-01', created_at: '' },
      { id: '2', session_date: '2026-02-28', created_at: '' },
    ];

    expect(groupDetailsByBoard(details)).toEqual({
      Core: details,
    });
    expect(Object.keys(groupSessionsByMonth(sessions))).toEqual([
      'March 2026',
      'February 2026',
    ]);
  });
});
