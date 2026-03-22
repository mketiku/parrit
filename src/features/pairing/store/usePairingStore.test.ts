/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePairingStore } from './usePairingStore';
import { createBoard, createPerson } from '../../../test/factories';
import { supabase } from '../../../lib/supabase';

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
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
  },
}));

// Mock Toast store
vi.mock('../../../../store/useToastStore', () => ({
  useToastStore: {
    getState: () => ({
      addToast: vi.fn(),
    }),
  },
}));

describe('usePairingStore - Slices Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  describe('BoardsSlice', () => {
    it('should add a board and update state', async () => {
      const mockBoardRow = {
        id: 'new-b',
        name: 'New Board',
        user_id: 'test-user',
        sort_order: 0,
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockBoardRow, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const { addBoard } = usePairingStore.getState();
      await addBoard('New Board');

      expect(usePairingStore.getState().boards).toHaveLength(1);
      expect(usePairingStore.getState().boards[0].name).toBe('New Board');
      expect(supabase.from).toHaveBeenCalledWith('pairing_boards');
    });

    it('should remove a board and update state', async () => {
      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const board = createBoard({ id: 'b1', name: 'Delete Me' });
      usePairingStore.setState({ boards: [board] });

      const { removeBoard } = usePairingStore.getState();
      await removeBoard('b1');

      expect(usePairingStore.getState().boards).toHaveLength(0);
      expect(supabase.from).toHaveBeenCalledWith('pairing_boards');
    });

    it('should handle optimistic updates for board properties', async () => {
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const board = createBoard({ id: 'b1', name: 'Old Name' });
      usePairingStore.setState({ boards: [board] });

      const { updateBoard } = usePairingStore.getState();
      const updatePromise = updateBoard('b1', { name: 'New Name' });

      // Check optimistic state
      expect(usePairingStore.getState().boards[0].name).toBe('New Name');

      await updatePromise;
      expect(supabase.from).toHaveBeenCalledWith('pairing_boards');
    });
  });

  describe('PeopleSlice', () => {
    it('should add a person and assign a color', async () => {
      const mockPersonRow = {
        id: 'p1',
        name: 'Alice',
        avatar_color_hex: '#123456',
        user_id: 'test-user',
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPersonRow, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const { addPerson } = usePairingStore.getState();
      await addPerson('Alice');

      expect(usePairingStore.getState().people).toHaveLength(1);
      expect(usePairingStore.getState().people[0].name).toBe('Alice');
    });

    it('should remove a person and cleanup board assignments', async () => {
      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });

      const person = createPerson({ id: 'p1', name: 'Alice' });
      const board = createBoard({ id: 'b1', assignedPersonIds: ['p1'] });
      usePairingStore.setState({ people: [person], boards: [board] });

      const { removePerson } = usePairingStore.getState();
      await removePerson('p1');

      expect(usePairingStore.getState().people).toHaveLength(0);
      expect(usePairingStore.getState().boards[0].assignedPersonIds).toEqual(
        []
      );
    });
  });

  describe('AlgorithmSlice', () => {
    it('should set isRecommending during calculation', async () => {
      // Setup some people to trigger the algorithm
      usePairingStore.setState({
        people: [createPerson({ id: 'p1' }), createPerson({ id: 'p2' })],
        boards: [createBoard({ id: 'b1' })],
      });

      const mockQueryResult = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQueryResult);

      const { recommendPairs } = usePairingStore.getState();
      const promise = recommendPairs();

      expect(usePairingStore.getState().isRecommending).toBe(true);
      await promise;
      expect(usePairingStore.getState().isRecommending).toBe(false);
    });
  });
});
