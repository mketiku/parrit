// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import { createBaseSlice, type BaseSlice } from './baseSlice';
import { createBoardsSlice, type BoardsSlice } from './boardsSlice';
import type { PairingBoard } from '../../types';
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

type TestStore = BaseSlice & BoardsSlice & { people: [] };

function makeStore(initialBoards: PairingBoard[] = []) {
  return create<TestStore>()((...a) => ({
    ...(createBaseSlice as any)(...a),
    ...(createBoardsSlice as any)(...a),
    boards: initialBoards,
    people: [],
  }));
}

const boardA: PairingBoard = {
  id: 'board-a',
  name: 'Alpha',
  isExempt: false,
  isLocked: false,
  sortOrder: 0,
  goals: [],
  assignedPersonIds: ['person-1'],
};

const boardB: PairingBoard = {
  id: 'board-b',
  name: 'Bravo',
  isExempt: false,
  isLocked: false,
  sortOrder: 1,
  goals: ['Ship'],
  assignedPersonIds: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  (supabase.auth.getUser as any).mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null,
  });
});

describe('boardsSlice', () => {
  it('persists board assignments with the full upsert payload', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert });
    const store = makeStore([boardA, boardB]);

    await store.getState().persistBoardAssignments([boardA, boardB]);

    expect(mockFrom).toHaveBeenCalledWith('pairing_boards');
    expect(upsert).toHaveBeenCalledWith(
      [
        {
          id: 'board-a',
          user_id: 'user-123',
          name: 'Alpha',
          is_exempt: false,
          is_locked: false,
          sort_order: 0,
          goals: [],
          assigned_person_ids: ['person-1'],
        },
        {
          id: 'board-b',
          user_id: 'user-123',
          name: 'Bravo',
          is_exempt: false,
          is_locked: false,
          sort_order: 1,
          goals: ['Ship'],
          assigned_person_ids: [],
        },
      ],
      { onConflict: 'id' }
    );
  });

  it('stores previous boards and exposes undo through the toast action', () => {
    const persistBoardAssignments = vi.fn().mockResolvedValue(undefined);
    const store = makeStore([boardA]);
    store.setState({ persistBoardAssignments } as Partial<TestStore>);

    store.getState().setBoards([boardB], true);

    expect(store.getState().boards).toEqual([boardB]);
    expect(store.getState().previousBoards).toEqual([boardA]);
    expect(mockAddToast).toHaveBeenCalledWith('Boards updated.', 'info', {
      label: 'Undo',
      onClick: expect.any(Function),
    });

    const undoAction = mockAddToast.mock.calls[0][2].onClick;
    undoAction();

    expect(store.getState().boards).toEqual([boardA]);
    expect(store.getState().previousBoards).toBeNull();
    expect(persistBoardAssignments).toHaveBeenCalledWith([boardB]);
    expect(persistBoardAssignments).toHaveBeenCalledWith([boardA]);
    expect(mockAddToast).toHaveBeenCalledWith('Action undone.', 'success');
  });

  it('rolls back board updates when the database update fails', async () => {
    const eq = vi
      .fn()
      .mockResolvedValue({ error: { message: 'write failed' } });
    const update = vi.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ update });
    const store = makeStore([boardA]);

    await store.getState().updateBoard('board-a', { name: 'Renamed' });

    expect(store.getState().boards[0].name).toBe('Alpha');
    expect(mockAddToast).toHaveBeenCalledWith(
      'Failed to update board: write failed',
      'error'
    );
  });

  it('rolls back reordering when persistence fails', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: 'nope' } });
    mockFrom.mockReturnValue({ upsert });
    const store = makeStore([boardA, boardB]);

    await store.getState().moveBoard('board-a', 'board-b');

    expect(store.getState().boards.map((board) => board.id)).toEqual([
      'board-a',
      'board-b',
    ]);
    expect(mockAddToast).toHaveBeenCalledWith(
      'Failed to reorder boards: nope',
      'error'
    );
  });

  it('rolls back board removal when the delete request fails', async () => {
    const eq = vi
      .fn()
      .mockResolvedValue({ error: { message: 'delete failed' } });
    const del = vi.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ delete: del });
    const store = makeStore([boardA, boardB]);

    await store.getState().removeBoard('board-a');

    expect(store.getState().boards.map((board) => board.id)).toEqual([
      'board-a',
      'board-b',
    ]);
    expect(mockAddToast).toHaveBeenCalledWith(
      '"Alpha" board deleted.',
      'success'
    );
    expect(mockAddToast).toHaveBeenCalledWith(
      'Failed to delete board: delete failed',
      'error'
    );
  });
});
