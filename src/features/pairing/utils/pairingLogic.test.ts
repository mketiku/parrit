import { describe, it, expect } from 'vitest';
import { calculateRecommendations } from './pairingLogic';
import type { Person, PairingBoard } from '../types';

describe('Pairing Recommendation Algorithm', () => {
  const people: Person[] = [
    { id: '1', name: 'Alice', avatarColorHex: '#000' },
    { id: '2', name: 'Bob', avatarColorHex: '#000' },
    { id: '3', name: 'Charlie', avatarColorHex: '#000' },
    { id: '4', name: 'Dave', avatarColorHex: '#000' },
    { id: '5', name: 'Eve', avatarColorHex: '#000' },
  ];

  const boards: PairingBoard[] = [
    {
      id: 'b1',
      name: 'Board 1',
      isExempt: false,
      sortOrder: 0,
      goals: [],
      assignedPersonIds: [],
    },
    {
      id: 'b2',
      name: 'Board 2',
      isExempt: false,
      sortOrder: 1,
      goals: [],
      assignedPersonIds: [],
    },
  ];

  it('should assign all people across available boards', () => {
    const result = calculateRecommendations(people, boards, []);

    const b1 = result.find((b) => b.id === 'b1')!;
    const b2 = result.find((b) => b.id === 'b2')!;

    const TOTAL_PEOPLE = people.length;
    expect(
      (b1.assignedPersonIds || []).length + (b2.assignedPersonIds || []).length
    ).toBe(TOTAL_PEOPLE);
    // With 5 people and 2 boards, one should have 3 and one should have 2
    expect([2, 3]).toContain((b1.assignedPersonIds || []).length);
    expect([2, 3]).toContain((b2.assignedPersonIds || []).length);
  });

  it('should respect exempt boards (leave people there and not assign others)', () => {
    const boardsWithExempt: PairingBoard[] = [
      ...boards,
      {
        id: 'away',
        name: 'Away',
        isExempt: true,
        sortOrder: 2,
        goals: [],
        assignedPersonIds: ['5'],
      },
    ];

    const result = calculateRecommendations(people, boardsWithExempt, []);

    const awayBoard = result.find((b) => b.id === 'away')!;
    expect(awayBoard.assignedPersonIds).toEqual(['5']);

    const activeIds = result
      .filter((b) => !b.isExempt)
      .flatMap((b) => b.assignedPersonIds);

    expect(activeIds).not.toContain('5');
    expect(activeIds.length).toBe(4);
  });

  it('should prioritize pairing people who have not paired recently', () => {
    const history = [
      // Session 1: 1 and 2 paired
      {
        session_id: 's1',
        board_id: 'b1',
        person_id: '1',
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        session_id: 's1',
        board_id: 'b1',
        person_id: '2',
        created_at: '2024-01-01T10:00:00Z',
      },
      // Session 1: 3 and 4 paired
      {
        session_id: 's1',
        board_id: 'b2',
        person_id: '3',
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        session_id: 's1',
        board_id: 'b2',
        person_id: '4',
        created_at: '2024-01-01T10:00:00Z',
      },
    ];

    // If we have people [1, 2, 3, 4] and we need to pair them.
    // 1 has paired with 2.
    // 1 has NOT paired with 3 or 4.
    // So 1 should be paired with 3 or 4.

    // We run it many times to avoid accidental random success (though the logic is deterministic once p1 is picked)
    for (let k = 0; k < 10; k++) {
      const result = calculateRecommendations(
        people.slice(0, 4),
        boards,
        history
      );
      const b1 = result.find((b) => b.id === 'b1')!;
      const b2 = result.find((b) => b.id === 'b2')!;

      // Assert that (1,2) are not together if possible
      const p1 = b1.assignedPersonIds || [];
      const p2 = b2.assignedPersonIds || [];
      const pairedWith1 = p1.includes('1') ? p1 : p2;
      expect(pairedWith1).not.toContain('2');
    }
  });
});
