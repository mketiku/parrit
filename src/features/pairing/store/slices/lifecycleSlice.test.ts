/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createBaseSlice } from './baseSlice';
import { createLifecycleSlice } from './lifecycleSlice';
import type { BaseSlice } from './baseSlice';
import type { LifecycleSlice } from './lifecycleSlice';

vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('../../../../store/useToastStore', () => ({
  useToastStore: {
    getState: vi.fn(() => ({ addToast: vi.fn() })),
  },
}));

vi.mock('../../../../store/useWorkspacePrefsStore', () => ({
  useWorkspacePrefsStore: {
    getState: vi.fn(() => ({
      setPublicViewEnabled: vi.fn(),
      setOnboardingCompleted: vi.fn(),
      setShareToken: vi.fn(),
    })),
  },
}));

vi.mock('../../../auth/store/useAuthStore', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

// Import after mocks are set up
import { supabase } from '../../../../lib/supabase';
import { useToastStore } from '../../../../store/useToastStore';
import { useWorkspacePrefsStore } from '../../../../store/useWorkspacePrefsStore';
import { useAuthStore } from '../../../auth/store/useAuthStore';

type TestStore = BaseSlice &
  LifecycleSlice & {
    people: any[];
    boards: any[];
    loadStalePairs: () => Promise<void>;
  };

function makeStore() {
  return create<TestStore>()((...a) => ({
    ...createBaseSlice(...(a as any)),
    ...createLifecycleSlice(...(a as any)),
    people: [],
    boards: [],
    loadStalePairs: vi.fn(),
  }));
}

function makeSelectChain(result: any) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    insert: vi.fn().mockReturnThis(),
  };
}

const MOCK_USER = { id: 'user-abc-12345678' };

describe('lifecycleSlice', () => {
  let useStore: ReturnType<typeof makeStore>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset channel mock to return a chainable object after clearAllMocks
    (supabase.channel as any).mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    });

    // Reset toast mock
    (useToastStore.getState as any).mockReturnValue({ addToast: vi.fn() });

    // Reset workspace prefs mock
    (useWorkspacePrefsStore.getState as any).mockReturnValue({
      setPublicViewEnabled: vi.fn(),
      setOnboardingCompleted: vi.fn(),
      setShareToken: vi.fn(),
    });

    useStore = makeStore();
  });

  describe('loadWorkspaceData', () => {
    it('sets isLoading to false and returns early when there is no session', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
      });

      await useStore.getState().loadWorkspaceData();

      const state = useStore.getState();
      expect(state.isLoading).toBe(false);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('sets people and boards in state and calls loadStalePairs on happy path', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: { user: MOCK_USER } },
      });

      const mockPeopleRows = [
        { id: 'p1', name: 'Alice', avatar_color_hex: '#6366f1' },
        { id: 'p2', name: 'Bob', avatar_color_hex: '#ec4899' },
      ];
      const mockBoardRows = [
        {
          id: 'b1',
          name: 'Board 1',
          is_exempt: false,
          is_locked: false,
          sort_order: 0,
          goals: [],
          meeting_link: null,
          assigned_person_ids: [],
        },
      ];

      const peopleChain = makeSelectChain({
        data: mockPeopleRows,
        error: null,
      });
      const boardsChain = makeSelectChain({ data: mockBoardRows, error: null });
      const settingsChain = makeSelectChain({ data: null, error: null });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'people') return peopleChain;
        if (table === 'pairing_boards') return boardsChain;
        if (table === 'workspace_settings') return settingsChain;
      });

      await useStore.getState().loadWorkspaceData();

      const state = useStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.people).toEqual([
        { id: 'p1', name: 'Alice', avatarColorHex: '#6366f1' },
        { id: 'p2', name: 'Bob', avatarColorHex: '#ec4899' },
      ]);
      expect(state.boards).toEqual([
        {
          id: 'b1',
          name: 'Board 1',
          isExempt: false,
          isLocked: false,
          sortOrder: 0,
          goals: [],
          meetingLink: undefined,
          assignedPersonIds: [],
        },
      ]);
      expect(state.loadStalePairs).toHaveBeenCalled();
    });

    it('sets error state and shows toast when people fetch fails', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: { user: MOCK_USER } },
      });

      const mockAddToast = vi.fn();
      (useToastStore.getState as any).mockReturnValue({
        addToast: mockAddToast,
      });

      const peopleChain = makeSelectChain({
        data: null,
        error: { message: 'people fetch failed' },
      });
      const boardsChain = makeSelectChain({ data: [], error: null });
      const settingsChain = makeSelectChain({ data: null, error: null });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'people') return peopleChain;
        if (table === 'pairing_boards') return boardsChain;
        if (table === 'workspace_settings') return settingsChain;
      });

      await useStore.getState().loadWorkspaceData();

      const state = useStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('people fetch failed');
      expect(mockAddToast).toHaveBeenCalledWith(
        'RAAA What the heck?! Failed to load team data. 🦜',
        'error'
      );
      expect(state.people).toEqual([]);
      expect(state.boards).toEqual([]);
    });

    it('sets error state and shows toast when boards fetch fails', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: { user: MOCK_USER } },
      });

      const mockAddToast = vi.fn();
      (useToastStore.getState as any).mockReturnValue({
        addToast: mockAddToast,
      });

      const peopleChain = makeSelectChain({ data: [], error: null });
      const boardsChain = makeSelectChain({
        data: null,
        error: { message: 'boards fetch failed' },
      });
      const settingsChain = makeSelectChain({ data: null, error: null });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'people') return peopleChain;
        if (table === 'pairing_boards') return boardsChain;
        if (table === 'workspace_settings') return settingsChain;
      });

      await useStore.getState().loadWorkspaceData();

      const state = useStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('boards fetch failed');
      expect(mockAddToast).toHaveBeenCalledWith(
        'RAAA! Failed to load boards. Did they fly away? 🪹',
        'error'
      );
    });

    it('seeds default boards and people when workspace is empty', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: { user: MOCK_USER } },
      });

      const seededBoardRows = [
        {
          id: 'b1',
          name: 'Board 1',
          is_exempt: false,
          is_locked: false,
          sort_order: 0,
          goals: [],
          meeting_link: null,
          assigned_person_ids: [],
        },
        {
          id: 'b2',
          name: 'Board 2',
          is_exempt: false,
          is_locked: false,
          sort_order: 1,
          goals: [],
          meeting_link: null,
          assigned_person_ids: [],
        },
        {
          id: 'b3',
          name: 'OOO',
          is_exempt: true,
          is_locked: false,
          sort_order: 2,
          goals: [],
          meeting_link: null,
          assigned_person_ids: [],
        },
      ];
      const seededPeopleRows = [
        { id: 'p1', name: 'Alice', avatar_color_hex: '#6366f1' },
        { id: 'p2', name: 'Bob', avatar_color_hex: '#ec4899' },
        { id: 'p3', name: 'Charlie', avatar_color_hex: '#14b8a6' },
      ];

      let boardsCallCount = 0;
      const boardsSelectChain = makeSelectChain({ data: [], error: null });
      const boardsInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi
          .fn()
          .mockResolvedValue({ data: seededBoardRows, error: null }),
      };

      let peopleCallCount = 0;
      const peopleSelectChain = makeSelectChain({ data: [], error: null });
      const peopleInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi
          .fn()
          .mockResolvedValue({ data: seededPeopleRows, error: null }),
      };

      const settingsChain = makeSelectChain({ data: null, error: null });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'people') {
          peopleCallCount++;
          return peopleCallCount === 1 ? peopleSelectChain : peopleInsertChain;
        }
        if (table === 'pairing_boards') {
          boardsCallCount++;
          return boardsCallCount === 1 ? boardsSelectChain : boardsInsertChain;
        }
        if (table === 'workspace_settings') return settingsChain;
      });

      await useStore.getState().loadWorkspaceData();

      const state = useStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.people).toEqual([
        { id: 'p1', name: 'Alice', avatarColorHex: '#6366f1' },
        { id: 'p2', name: 'Bob', avatarColorHex: '#ec4899' },
        { id: 'p3', name: 'Charlie', avatarColorHex: '#14b8a6' },
      ]);
      expect(state.boards).toHaveLength(3);
      expect(state.boards[0].name).toBe('Board 1');
      expect(state.boards[2].name).toBe('OOO');
      expect(state.boards[2].isExempt).toBe(true);
    });

    it('returns immediately without calling getSession when already loading', async () => {
      useStore.getState()._loading = true;

      await useStore.getState().loadWorkspaceData();

      expect(supabase.auth.getSession).not.toHaveBeenCalled();
    });

    it('syncs workspace settings to prefs store when settings data is present', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: { user: MOCK_USER } },
      });

      const mockSetPublicViewEnabled = vi.fn();
      const mockSetOnboardingCompleted = vi.fn();
      const mockSetShareToken = vi.fn();
      (useWorkspacePrefsStore.getState as any).mockReturnValue({
        setPublicViewEnabled: mockSetPublicViewEnabled,
        setOnboardingCompleted: mockSetOnboardingCompleted,
        setShareToken: mockSetShareToken,
      });

      const mockPeopleRows = [
        { id: 'p1', name: 'Alice', avatar_color_hex: '#6366f1' },
      ];
      const mockBoardRows = [
        {
          id: 'b1',
          name: 'Board 1',
          is_exempt: false,
          is_locked: false,
          sort_order: 0,
          goals: [],
          meeting_link: null,
          assigned_person_ids: [],
        },
      ];
      const settingsData = {
        public_view_enabled: true,
        onboarding_completed: true,
        share_token: 'abc123',
      };

      const peopleChain = makeSelectChain({
        data: mockPeopleRows,
        error: null,
      });
      const boardsChain = makeSelectChain({ data: mockBoardRows, error: null });
      const settingsChain = makeSelectChain({
        data: settingsData,
        error: null,
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'people') return peopleChain;
        if (table === 'pairing_boards') return boardsChain;
        if (table === 'workspace_settings') return settingsChain;
      });

      await useStore.getState().loadWorkspaceData();

      expect(mockSetPublicViewEnabled).toHaveBeenCalledWith(true);
      expect(mockSetOnboardingCompleted).toHaveBeenCalledWith(true);
      expect(mockSetShareToken).toHaveBeenCalledWith('abc123');
    });
  });

  describe('subscribeToRealtime', () => {
    it('returns a no-op function when there is no authenticated user', () => {
      (useAuthStore.getState as any).mockReturnValue({ user: null });

      const unsubscribe = useStore.getState().subscribeToRealtime();

      expect(typeof unsubscribe).toBe('function');
      expect(supabase.channel).not.toHaveBeenCalled();
      expect(() => unsubscribe()).not.toThrow();
    });

    it('creates a channel, subscribes, and returns an unsubscribe function that removes the channel', () => {
      const mockUser = { id: 'user-abc-12345678' };
      (useAuthStore.getState as any).mockReturnValue({ user: mockUser });

      const channelObj = { on: vi.fn().mockReturnThis(), subscribe: vi.fn() };
      (supabase.channel as any).mockReturnValue(channelObj);

      const unsubscribe = useStore.getState().subscribeToRealtime();

      // Called at least once with channelId — first call is removeChannel cleanup
      expect(supabase.channel).toHaveBeenCalledWith('workspace-user-abc');
      expect(channelObj.subscribe).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();

      expect(supabase.removeChannel).toHaveBeenCalledWith(channelObj);
    });
  });
});
