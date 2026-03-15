import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
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
      isLocked: false,
      sortOrder: 0,
      goals: [],
      assignedPersonIds: [],
    },
    {
      id: 'b2',
      name: 'Board 2',
      isExempt: false,
      isLocked: false,
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
        isLocked: false,
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

describe('Pairing Algorithm — Property-Based Tests', () => {
  // Arbitraries
  const personArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    avatarColorHex: fc.constant('#000'),
  });

  const boardArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    isExempt: fc.boolean(),
    isLocked: fc.constant(false),
    sortOrder: fc.nat(),
    goals: fc.constant([] as string[]),
    assignedPersonIds: fc.constant([] as string[]),
  });

  it('should never assign a person to more than one active board', () => {
    fc.assert(
      fc.property(
        fc.array(personArb, { minLength: 2, maxLength: 8 }),
        fc.array(
          boardArb.map((b) => ({ ...b, isExempt: false, isLocked: false })),
          { minLength: 1, maxLength: 4 }
        ),
        (people, boards) => {
          // Ensure unique IDs
          const uniquePeople = people.filter(
            (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
          );
          const uniqueBoards = boards.filter(
            (b, i, arr) => arr.findIndex((x) => x.id === b.id) === i
          );
          if (uniquePeople.length < 2 || uniqueBoards.length < 1) return true;

          const result = calculateRecommendations(
            uniquePeople,
            uniqueBoards,
            []
          );
          const assignedIds = result.flatMap((b) => b.assignedPersonIds ?? []);
          const uniqueAssigned = new Set(assignedIds);
          // No person should appear twice
          return assignedIds.length === uniqueAssigned.size;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should assign every person to exactly one location', () => {
    fc.assert(
      fc.property(
        fc.array(personArb, { minLength: 2, maxLength: 8 }),
        fc.array(
          boardArb.map((b) => ({ ...b, isExempt: false, isLocked: false })),
          { minLength: 1, maxLength: 4 }
        ),
        (people, boards) => {
          const uniquePeople = people.filter(
            (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
          );
          const uniqueBoards = boards.filter(
            (b, i, arr) => arr.findIndex((x) => x.id === b.id) === i
          );
          if (uniquePeople.length < 2 || uniqueBoards.length < 1) return true;

          const result = calculateRecommendations(
            uniquePeople,
            uniqueBoards,
            []
          );
          const assignedIds = new Set(
            result.flatMap((b) => b.assignedPersonIds ?? [])
          );
          // All people should be assigned
          return uniquePeople.every((p) => assignedIds.has(p.id));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never move people off exempt or locked boards', () => {
    fc.assert(
      fc.property(
        fc.array(personArb, { minLength: 2, maxLength: 8 }),
        fc.array(boardArb, { minLength: 2, maxLength: 5 }),
        (people, boards) => {
          const uniquePeople = people.filter(
            (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
          );
          const uniqueBoards = boards.filter(
            (b, i, arr) => arr.findIndex((x) => x.id === b.id) === i
          );
          if (uniquePeople.length < 2 || uniqueBoards.length < 1) return true;

          // Assign some people to exempt/locked boards
          const boardsWithAssignments = uniqueBoards.map((b, i) => ({
            ...b,
            assignedPersonIds:
              i < uniquePeople.length
                ? [uniquePeople[i % uniquePeople.length].id]
                : [],
          }));

          const result = calculateRecommendations(
            uniquePeople,
            boardsWithAssignments,
            []
          );

          // For each exempt or locked board, their assignments must remain unchanged
          for (const original of boardsWithAssignments.filter(
            (b) => b.isExempt || b.isLocked
          )) {
            const updated = result.find((b) => b.id === original.id);
            if (!updated) return false;
            const origIds = new Set(original.assignedPersonIds);
            const updIds = new Set(updated.assignedPersonIds ?? []);
            for (const id of origIds) {
              if (!updIds.has(id)) return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('result boards should have the same IDs as input boards', () => {
    fc.assert(
      fc.property(
        fc.array(personArb, { minLength: 2, maxLength: 6 }),
        fc.array(boardArb, { minLength: 1, maxLength: 4 }),
        (people, boards) => {
          const uniquePeople = people.filter(
            (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
          );
          const uniqueBoards = boards.filter(
            (b, i, arr) => arr.findIndex((x) => x.id === b.id) === i
          );
          if (uniquePeople.length < 2 || uniqueBoards.length < 1) return true;

          const result = calculateRecommendations(
            uniquePeople,
            uniqueBoards,
            []
          );
          const inputIds = new Set(uniqueBoards.map((b) => b.id));
          const outputIds = new Set(result.map((b) => b.id));
          return (
            inputIds.size === outputIds.size &&
            [...inputIds].every((id) => outputIds.has(id))
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
