import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePairingStore } from './usePairingStore';
import { createBoard } from '../../../test/factories';

// Mock Supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })
      ),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('usePairingStore', () => {
  beforeEach(() => {
    // Reset store
    usePairingStore.setState({
      people: [],
      boards: [],
      isLoading: false,
      isSaving: false,
      isRecommending: false,
      error: null,
      previousBoards: null,
    });
  });

  it('should initialize with empty state', () => {
    const state = usePairingStore.getState();
    expect(state.people).toEqual([]);
    expect(state.boards).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should setBoards correctly', () => {
    const mockBoards = [createBoard({ id: 'b1', name: 'Board 1' })];
    const { setBoards } = usePairingStore.getState();

    setBoards(mockBoards);
    expect(usePairingStore.getState().boards).toEqual(mockBoards);
  });

  it('should handle undo', () => {
    const initialBoards = [createBoard({ id: 'b1', name: 'Board 1' })];
    usePairingStore.setState({ boards: initialBoards });

    const newBoards = [createBoard({ id: 'b1', name: 'Board 1 Updated' })];
    const { setBoards, undo } = usePairingStore.getState();

    // Set boards with undoable = true
    setBoards(newBoards, true);
    expect(usePairingStore.getState().boards).toEqual(newBoards);

    // Undo
    undo();
    expect(usePairingStore.getState().boards).toEqual(initialBoards);
  });
});
