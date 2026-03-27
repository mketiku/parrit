// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import { createBaseSlice, type BaseSlice } from './baseSlice';
import { createPeopleSlice, type PeopleSlice } from './peopleSlice';
import type { PairingBoard, Person } from '../../types';
import { supabase } from '../../../../lib/supabase';

const { mockFrom, mockAddToast } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockAddToast: vi.fn(),
}));

vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: mockFrom,
  },
}));

vi.mock('../../../../store/useToastStore', () => ({
  useToastStore: {
    getState: () => ({ addToast: mockAddToast }),
  },
}));

type TestStore = BaseSlice &
  PeopleSlice & {
    boards: PairingBoard[];
    persistBoardAssignments: (boards: PairingBoard[]) => Promise<void>;
  };

function makeStore(
  initialPeople: Person[] = [],
  initialBoards: PairingBoard[] = []
) {
  return create<TestStore>()((...a) => ({
    ...(createBaseSlice as any)(...a),
    ...(createPeopleSlice as any)(...a),
    people: initialPeople,
    boards: initialBoards,
    persistBoardAssignments: vi.fn().mockResolvedValue(undefined),
  }));
}

const personA: Person = {
  id: 'person-a',
  name: 'Alice',
  avatarColorHex: '#111111',
};

const personB: Person = {
  id: 'person-b',
  name: 'Bob',
  avatarColorHex: '#222222',
};

const board: PairingBoard = {
  id: 'board-1',
  name: 'Core',
  isExempt: false,
  isLocked: false,
  sortOrder: 0,
  goals: [],
  assignedPersonIds: ['person-a', 'person-b'],
};

beforeEach(() => {
  vi.clearAllMocks();
  (supabase.auth.getUser as any).mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null,
  });
});

describe('peopleSlice', () => {
  it('returns early when adding a person without an authenticated user', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const insert = vi.fn();
    mockFrom.mockReturnValue({ insert });
    const store = makeStore();

    await store.getState().addPerson('Alice');

    expect(insert).not.toHaveBeenCalled();
    expect(store.getState().people).toEqual([]);
  });

  it('rolls back optimistic person updates when persistence fails', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'bad update' } });
    const update = vi.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ update });
    const store = makeStore([personA]);

    await store.getState().updatePerson('person-a', { name: 'Renamed' });

    expect(store.getState().people[0].name).toBe('Alice');
    expect(mockAddToast).toHaveBeenCalledWith(
      'Failed to update team member.',
      'error'
    );
  });

  it('persists cleaned board assignments after removing a person', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ delete: del });
    const store = makeStore([personA, personB], [board]);
    const persistBoardAssignments = vi.fn().mockResolvedValue(undefined);
    store.setState({ persistBoardAssignments } as Partial<TestStore>);

    await store.getState().removePerson('person-a');

    expect(store.getState().people.map((person) => person.id)).toEqual([
      'person-b',
    ]);
    expect(store.getState().boards[0].assignedPersonIds).toEqual(['person-b']);
    expect(persistBoardAssignments).toHaveBeenCalledWith([
      { ...board, assignedPersonIds: ['person-b'] },
    ]);
  });

  it('restores people and boards when person deletion fails', async () => {
    const eq = vi
      .fn()
      .mockResolvedValue({ error: { message: 'cannot delete person' } });
    const del = vi.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ delete: del });
    const store = makeStore([personA, personB], [board]);

    await store.getState().removePerson('person-a');

    expect(store.getState().people.map((person) => person.id)).toEqual([
      'person-a',
      'person-b',
    ]);
    expect(store.getState().boards[0].assignedPersonIds).toEqual([
      'person-a',
      'person-b',
    ]);
    expect(mockAddToast).toHaveBeenCalledWith(
      'Failed to remove team member.',
      'error'
    );
  });
});
