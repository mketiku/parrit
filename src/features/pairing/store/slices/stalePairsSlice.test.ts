/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createStalePairsSlice } from './stalePairsSlice';
import type { StalePairsSlice } from './stalePairsSlice';
import { supabase } from '../../../../lib/supabase';
import { useWorkspacePrefsStore } from '../../../../store/useWorkspacePrefsStore';

vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../../../../store/useWorkspacePrefsStore', () => ({
  useWorkspacePrefsStore: {
    getState: vi.fn(() => ({ stalePairThreshold: 3 })),
  },
}));

function setupSupabaseMock(result: { data: any; error: any }) {
  const mockLimit = vi.fn().mockResolvedValue(result);
  const mockOrder = vi.fn(() => ({ limit: mockLimit }));
  const mockSelect = vi.fn(() => ({ order: mockOrder }));
  (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
    select: mockSelect,
  });
  return { mockLimit, mockOrder, mockSelect };
}

function makeStore() {
  return create<StalePairsSlice>()((...a) =>
    createStalePairsSlice(...(a as any))
  );
}

describe('stalePairsSlice', () => {
  let useStore: ReturnType<typeof makeStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    (
      useWorkspacePrefsStore.getState as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      stalePairThreshold: 3,
    });
    useStore = makeStore();
  });

  describe('loadStalePairs', () => {
    it('sets pairRecency to {} and isStaleLoading to false when data is empty', async () => {
      setupSupabaseMock({ data: [], error: null });

      await useStore.getState().loadStalePairs();

      const state = useStore.getState();
      expect(state.pairRecency).toEqual({});
      expect(state.isStaleLoading).toBe(false);
    });

    it('counts 1 for a pair in a single session on the same board', async () => {
      setupSupabaseMock({
        data: [
          {
            person_id: 'alice',
            board_id: 'b1',
            session_id: 's1',
            created_at: '2026-03-21T10:00:00Z',
          },
          {
            person_id: 'bob',
            board_id: 'b1',
            session_id: 's1',
            created_at: '2026-03-21T10:00:00Z',
          },
        ],
        error: null,
      });

      await useStore.getState().loadStalePairs();

      expect(useStore.getState().pairRecency['alice:bob']).toBe(1);
    });

    it('counts 2 for a pair appearing in 2 consecutive sessions', async () => {
      // Data is ordered DESC: s1 is most recent, s2 is older
      setupSupabaseMock({
        data: [
          {
            person_id: 'alice',
            board_id: 'b1',
            session_id: 's1',
            created_at: '2026-03-21T10:00:00Z',
          },
          {
            person_id: 'bob',
            board_id: 'b1',
            session_id: 's1',
            created_at: '2026-03-21T10:00:00Z',
          },
          {
            person_id: 'alice',
            board_id: 'b1',
            session_id: 's2',
            created_at: '2026-03-20T10:00:00Z',
          },
          {
            person_id: 'bob',
            board_id: 'b1',
            session_id: 's2',
            created_at: '2026-03-20T10:00:00Z',
          },
        ],
        error: null,
      });

      await useStore.getState().loadStalePairs();

      expect(useStore.getState().pairRecency['alice:bob']).toBe(2);
    });

    it('stops the streak when a session in the middle is missing the pair', async () => {
      // s1 (most recent): alice+bob together
      // s2: alice+bob NOT together (alice on b1, bob on separate board b2)
      // s3: alice+bob together again
      setupSupabaseMock({
        data: [
          {
            person_id: 'alice',
            board_id: 'b1',
            session_id: 's1',
            created_at: '2026-03-21T10:00:00Z',
          },
          {
            person_id: 'bob',
            board_id: 'b1',
            session_id: 's1',
            created_at: '2026-03-21T10:00:00Z',
          },
          {
            person_id: 'alice',
            board_id: 'b1',
            session_id: 's2',
            created_at: '2026-03-20T10:00:00Z',
          },
          {
            person_id: 'bob',
            board_id: 'b2',
            session_id: 's2',
            created_at: '2026-03-20T10:00:00Z',
          },
          {
            person_id: 'alice',
            board_id: 'b1',
            session_id: 's3',
            created_at: '2026-03-19T10:00:00Z',
          },
          {
            person_id: 'bob',
            board_id: 'b1',
            session_id: 's3',
            created_at: '2026-03-19T10:00:00Z',
          },
        ],
        error: null,
      });

      await useStore.getState().loadStalePairs();

      expect(useStore.getState().pairRecency['alice:bob']).toBe(1);
    });

    it('sets isStaleLoading to false and keeps pairRecency empty on Supabase error', async () => {
      setupSupabaseMock({ data: null, error: { message: 'err' } });

      await useStore.getState().loadStalePairs();

      const state = useStore.getState();
      expect(state.isStaleLoading).toBe(false);
      expect(state.pairRecency).toEqual({});
    });

    it('returns early without calling Supabase when isStaleLoading is already true', async () => {
      useStore.setState({ isStaleLoading: true });

      await useStore.getState().loadStalePairs();

      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('isRecentPair', () => {
    it('returns false when consecutive count is below threshold', () => {
      useStore.setState({ pairRecency: { 'alice:bob': 2 } });
      (
        useWorkspacePrefsStore.getState as ReturnType<typeof vi.fn>
      ).mockReturnValue({
        stalePairThreshold: 3,
      });

      expect(useStore.getState().isRecentPair('alice', 'bob')).toBe(false);
    });

    it('returns true when consecutive count meets threshold', () => {
      useStore.setState({ pairRecency: { 'alice:bob': 3 } });
      (
        useWorkspacePrefsStore.getState as ReturnType<typeof vi.fn>
      ).mockReturnValue({
        stalePairThreshold: 3,
      });

      expect(useStore.getState().isRecentPair('alice', 'bob')).toBe(true);
    });

    it('produces the same result regardless of argument order', () => {
      useStore.setState({ pairRecency: { 'alice:bob': 4 } });
      (
        useWorkspacePrefsStore.getState as ReturnType<typeof vi.fn>
      ).mockReturnValue({
        stalePairThreshold: 3,
      });

      expect(useStore.getState().isRecentPair('bob', 'alice')).toBe(true);
      expect(useStore.getState().isRecentPair('alice', 'bob')).toBe(true);
    });
  });
});
