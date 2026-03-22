/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createTemplateSlice } from './templateSlice';
import { createBaseSlice } from './baseSlice';
import type { BaseSlice } from './baseSlice';
import type { TemplateSlice } from './templateSlice';
import type { PairingBoard, Person } from '../../types';

// Use vi.hoisted so these variables are available inside vi.mock factories
const { mockFrom, mockAddToast } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockAddToast: vi.fn(),
}));

// Mock supabase
vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: mockFrom,
  },
}));

// Mock useToastStore
vi.mock('../../../../store/useToastStore', () => ({
  useToastStore: {
    getState: () => ({ addToast: mockAddToast }),
  },
}));

import { supabase } from '../../../../lib/supabase';

// Minimal test store type
type TestStore = BaseSlice &
  TemplateSlice & { boards: PairingBoard[]; people: Person[] };

function makeStore(initialBoards: PairingBoard[] = []) {
  return create<TestStore>()((...a) => ({
    ...(createBaseSlice as any)(...a),
    ...(createTemplateSlice as any)(...a),
    boards: initialBoards,
    people: [],
  }));
}

const boardA: PairingBoard = {
  id: 'board-1',
  name: 'Track A',
  isExempt: false,
  isLocked: false,
  sortOrder: 0,
  goals: ['goal-1'],
  assignedPersonIds: [],
};

const boardB: PairingBoard = {
  id: 'board-2',
  name: 'Track B',
  isExempt: true,
  isLocked: false,
  sortOrder: 1,
  goals: [],
  assignedPersonIds: [],
};

// Helper to build a chainable supabase query mock
function makeChain(result: object) {
  const chain: any = {};
  ['select', 'eq', 'single', 'insert', 'delete'].forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  // The terminal call returns the result as a resolved promise
  // We override the last method in each chain to resolve with the result.
  // Since the source calls .single() or .select() last, we make those return the result.
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.select = vi.fn(() => Promise.resolve(result));
  // For delete chains, .eq() is terminal
  chain.eq = vi.fn(() => Promise.resolve(result));
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  (supabase.auth.getUser as any).mockResolvedValue({
    data: { user: { id: 'user-123' } },
  });
});

// ---------------------------------------------------------------------------
// saveCurrentAsTemplate
// ---------------------------------------------------------------------------

describe('templateSlice - saveCurrentAsTemplate', () => {
  it('happy path: inserts template with correct shape and shows success toast', async () => {
    const insertMock = vi.fn(() => Promise.resolve({ error: null }));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'pairing_templates') {
        return { insert: insertMock };
      }
      return {};
    });

    const store = makeStore([boardA, boardB]);
    await store.getState().saveCurrentAsTemplate('My Template');

    expect(insertMock).toHaveBeenCalledOnce();
    expect(insertMock).toHaveBeenCalledWith({
      user_id: 'user-123',
      name: 'My Template',
      boards: [
        {
          name: 'Track A',
          goals: ['goal-1'],
          isExempt: false,
          isLocked: false,
        },
        { name: 'Track B', goals: [], isExempt: true, isLocked: false },
      ],
    });
    expect(mockAddToast).toHaveBeenCalledWith(
      'Template "My Template" saved!',
      'success'
    );
  });

  it('insert error: shows error toast when insert returns an error', async () => {
    const insertMock = vi.fn(() =>
      Promise.resolve({ error: { message: 'DB write failed' } })
    );
    mockFrom.mockImplementation((table: string) => {
      if (table === 'pairing_templates') {
        return { insert: insertMock };
      }
      return {};
    });

    const store = makeStore([boardA]);
    await store.getState().saveCurrentAsTemplate('My Template');

    expect(mockAddToast).toHaveBeenCalledWith(
      'Failed to save template.',
      'error'
    );
    expect(mockAddToast).not.toHaveBeenCalledWith(
      expect.stringContaining('saved!'),
      'success'
    );
  });

  it('no user: returns without calling insert when there is no authenticated user', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

    const insertMock = vi.fn();
    mockFrom.mockImplementation(() => ({ insert: insertMock }));

    const store = makeStore([boardA]);
    await store.getState().saveCurrentAsTemplate('My Template');

    expect(insertMock).not.toHaveBeenCalled();
    expect(mockAddToast).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// applyTemplate
// ---------------------------------------------------------------------------

describe('templateSlice - applyTemplate', () => {
  it('happy path: fetches template, deletes current boards, inserts new boards, updates state, shows success toast', async () => {
    const createdBoardRows = [
      {
        id: 'new-board-1',
        name: 'Track A',
        is_exempt: false,
        is_locked: false,
        sort_order: 0,
        goals: ['goal-1'],
        meeting_link: null,
        assigned_person_ids: [],
        user_id: 'user-123',
        created_at: '',
      },
      {
        id: 'new-board-2',
        name: 'Track B',
        is_exempt: true,
        is_locked: false,
        sort_order: 1,
        goals: [],
        meeting_link: null,
        assigned_person_ids: [],
        user_id: 'user-123',
        created_at: '',
      },
    ];

    const templateData = {
      id: 'template-1',
      name: 'My Template',
      boards: [
        { name: 'Track A', goals: ['goal-1'], isExempt: false },
        { name: 'Track B', goals: [], isExempt: true },
      ],
    };

    const deleteEqMock = vi.fn(() => Promise.resolve({ error: null }));
    const deleteMock = vi.fn(() => ({ eq: deleteEqMock }));

    const insertSelectMock = vi.fn(() =>
      Promise.resolve({ data: createdBoardRows, error: null })
    );
    const insertMock = vi.fn(() => ({ select: insertSelectMock }));

    const singleMock = vi.fn(() =>
      Promise.resolve({ data: templateData, error: null })
    );
    const eqMock = vi.fn(() => ({ single: singleMock }));
    const selectMock = vi.fn(() => ({ eq: eqMock }));

    mockFrom.mockImplementation((table: string) => {
      if (table === 'pairing_templates') {
        return { select: selectMock };
      }
      if (table === 'pairing_boards') {
        return { delete: deleteMock, insert: insertMock };
      }
      return {};
    });

    const store = makeStore([boardA, boardB]);
    await store.getState().applyTemplate('template-1');

    // Should have fetched the template by id
    expect(selectMock).toHaveBeenCalledWith('*');
    expect(eqMock).toHaveBeenCalledWith('id', 'template-1');
    expect(singleMock).toHaveBeenCalled();

    // Should have deleted each current board
    expect(deleteMock).toHaveBeenCalledTimes(2);
    expect(deleteEqMock).toHaveBeenCalledWith('id', 'board-1');
    expect(deleteEqMock).toHaveBeenCalledWith('id', 'board-2');

    // Should have inserted new boards
    expect(insertMock).toHaveBeenCalledOnce();

    // State should be updated with mapped boards
    const state = store.getState();
    expect(state.boards).toHaveLength(2);
    expect(state.boards[0]).toMatchObject({
      id: 'new-board-1',
      name: 'Track A',
      isExempt: false,
    });
    expect(state.boards[1]).toMatchObject({
      id: 'new-board-2',
      name: 'Track B',
      isExempt: true,
    });
    expect(state.isLoading).toBe(false);

    expect(mockAddToast).toHaveBeenCalledWith(
      'Applied template "My Template"',
      'success'
    );
  });

  it('fetch error: sets isLoading to false and shows error toast when select returns an error', async () => {
    const singleMock = vi.fn(() =>
      Promise.resolve({ data: null, error: { message: 'not found' } })
    );
    const eqMock = vi.fn(() => ({ single: singleMock }));
    const selectMock = vi.fn(() => ({ eq: eqMock }));

    mockFrom.mockImplementation((table: string) => {
      if (table === 'pairing_templates') {
        return { select: selectMock };
      }
      return {};
    });

    const store = makeStore([boardA]);
    await store.getState().applyTemplate('template-bad');

    expect(store.getState().isLoading).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith(
      'Failed to apply template.',
      'error'
    );
  });

  it('create error: sets isLoading to false and shows error toast when boards insert returns an error', async () => {
    const templateData = {
      id: 'template-1',
      name: 'My Template',
      boards: [{ name: 'Track A', goals: [], isExempt: false }],
    };

    const singleMock = vi.fn(() =>
      Promise.resolve({ data: templateData, error: null })
    );
    const eqMock = vi.fn(() => ({ single: singleMock }));
    const selectMock = vi.fn(() => ({ eq: eqMock }));

    const deleteEqMock = vi.fn(() => Promise.resolve({ error: null }));
    const deleteMock = vi.fn(() => ({ eq: deleteEqMock }));

    const insertSelectMock = vi.fn(() =>
      Promise.resolve({ data: null, error: { message: 'insert fail' } })
    );
    const insertMock = vi.fn(() => ({ select: insertSelectMock }));

    mockFrom.mockImplementation((table: string) => {
      if (table === 'pairing_templates') {
        return { select: selectMock };
      }
      if (table === 'pairing_boards') {
        return { delete: deleteMock, insert: insertMock };
      }
      return {};
    });

    const store = makeStore([boardA]);
    await store.getState().applyTemplate('template-1');

    expect(store.getState().isLoading).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith(
      'Failed to apply template.',
      'error'
    );
  });
});

// ---------------------------------------------------------------------------
// applyBuiltinTemplate
// ---------------------------------------------------------------------------

describe('templateSlice - applyBuiltinTemplate', () => {
  it('happy path: deletes current boards, inserts new boards from passed-in list, updates state, shows success toast', async () => {
    const createdBoardRows = [
      {
        id: 'new-board-1',
        name: 'Alpha',
        is_exempt: false,
        is_locked: false,
        sort_order: 0,
        goals: [],
        meeting_link: null,
        assigned_person_ids: [],
        user_id: 'user-123',
        created_at: '',
      },
      {
        id: 'new-board-2',
        name: 'Beta',
        is_exempt: false,
        is_locked: false,
        sort_order: 1,
        goals: [],
        meeting_link: null,
        assigned_person_ids: [],
        user_id: 'user-123',
        created_at: '',
      },
      {
        id: 'new-board-3',
        name: 'Lobby',
        is_exempt: true,
        is_locked: false,
        sort_order: 2,
        goals: [],
        meeting_link: null,
        assigned_person_ids: [],
        user_id: 'user-123',
        created_at: '',
      },
    ];

    const deleteEqMock = vi.fn(() => Promise.resolve({ error: null }));
    const deleteMock = vi.fn(() => ({ eq: deleteEqMock }));

    const insertSelectMock = vi.fn(() =>
      Promise.resolve({ data: createdBoardRows, error: null })
    );
    const insertMock = vi.fn(() => ({ select: insertSelectMock }));

    mockFrom.mockImplementation((table: string) => {
      if (table === 'pairing_boards') {
        return { delete: deleteMock, insert: insertMock };
      }
      return {};
    });

    const builtinBoards = [
      { name: 'Alpha', isExempt: false },
      { name: 'Beta', isExempt: false },
      { name: 'Lobby', isExempt: true },
    ];

    const store = makeStore([boardA, boardB]);
    await store.getState().applyBuiltinTemplate('3 Track', builtinBoards);

    // Should have deleted each current board
    expect(deleteMock).toHaveBeenCalledTimes(2);
    expect(deleteEqMock).toHaveBeenCalledWith('id', 'board-1');
    expect(deleteEqMock).toHaveBeenCalledWith('id', 'board-2');

    // Should have inserted new boards (no template fetch)
    expect(insertMock).toHaveBeenCalledOnce();
    const insertedRows = insertMock.mock.calls[0][0];
    expect(insertedRows).toHaveLength(3);
    expect(insertedRows[0]).toMatchObject({
      name: 'Alpha',
      is_exempt: false,
      goals: [],
    });
    expect(insertedRows[2]).toMatchObject({ name: 'Lobby', is_exempt: true });

    // State should be updated with mapped boards
    const state = store.getState();
    expect(state.boards).toHaveLength(3);
    expect(state.boards[0]).toMatchObject({ id: 'new-board-1', name: 'Alpha' });
    expect(state.isLoading).toBe(false);

    expect(mockAddToast).toHaveBeenCalledWith(
      'Applied preset "3 Track"',
      'success'
    );
  });

  it('no user: shows error toast when there is no authenticated user', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

    const deleteEqMock = vi.fn(() => Promise.resolve({ error: null }));
    const deleteMock = vi.fn(() => ({ eq: deleteEqMock }));

    mockFrom.mockImplementation((table: string) => {
      if (table === 'pairing_boards') {
        return { delete: deleteMock, insert: vi.fn() };
      }
      return {};
    });

    const store = makeStore([boardA]);
    await store
      .getState()
      .applyBuiltinTemplate('3 Track', [{ name: 'Alpha', isExempt: false }]);

    expect(store.getState().isLoading).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith(
      'Failed to apply preset template.',
      'error'
    );
  });

  it('create error: shows error toast and sets isLoading to false when insert returns an error', async () => {
    const deleteEqMock = vi.fn(() => Promise.resolve({ error: null }));
    const deleteMock = vi.fn(() => ({ eq: deleteEqMock }));

    const insertSelectMock = vi.fn(() =>
      Promise.resolve({ data: null, error: { message: 'insert fail' } })
    );
    const insertMock = vi.fn(() => ({ select: insertSelectMock }));

    mockFrom.mockImplementation((table: string) => {
      if (table === 'pairing_boards') {
        return { delete: deleteMock, insert: insertMock };
      }
      return {};
    });

    const store = makeStore([boardA]);
    await store
      .getState()
      .applyBuiltinTemplate('3 Track', [{ name: 'Alpha', isExempt: false }]);

    expect(store.getState().isLoading).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith(
      'Failed to apply preset template.',
      'error'
    );
  });
});
