import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePairingStore } from './usePairingStore';

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
    });
  });

  it('should initialize with empty state', () => {
    const state = usePairingStore.getState();
    expect(state.people).toEqual([]);
    expect(state.boards).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should setBoards correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockBoards: any[] = [
      { id: 'b1', name: 'Board 1', assignedPersonIds: [] },
    ];
    const { setBoards } = usePairingStore.getState();

    setBoards(mockBoards);
    expect(usePairingStore.getState().boards).toEqual(mockBoards);
  });

  it('should handle undo', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initialBoards: any[] = [
      { id: 'b1', name: 'Board 1', assignedPersonIds: [] },
    ];
    usePairingStore.setState({ boards: initialBoards });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newBoards: any[] = [
      { id: 'b1', name: 'Updated Board', assignedPersonIds: [] },
    ];
    const { setBoards, undo } = usePairingStore.getState();

    setBoards(newBoards, true); // undoable=true
    expect(usePairingStore.getState().boards).toEqual(newBoards);
    expect(usePairingStore.getState().previousBoards).toEqual(initialBoards);

    undo();
    expect(usePairingStore.getState().boards).toEqual(initialBoards);
    expect(usePairingStore.getState().previousBoards).toBeNull();
  });
});
