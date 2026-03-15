import type { StateCreator } from 'zustand';
import { supabase } from '../../../../lib/supabase';
import { useToastStore } from '../../../../store/useToastStore';
import { useWorkspacePrefsStore } from '../../../../store/useWorkspacePrefsStore';
import { AVATAR_COLORS, rowToPerson, rowToBoard } from './helpers';
import type { PersonRecord, BoardRecord } from '../../types';
import type { PairingStore } from '../usePairingStore';
import { useAuthStore } from '../../../auth/store/useAuthStore';

const toast = () => useToastStore.getState();

export interface LifecycleSlice {
  loadWorkspaceData: () => Promise<void>;
  subscribeToRealtime: () => () => void;
}

export const createLifecycleSlice: StateCreator<
  PairingStore,
  [],
  [],
  LifecycleSlice
> = (set, get) => ({
  loadWorkspaceData: async () => {
    if (get()._loading) return;
    set({ isLoading: true, error: null });
    get()._loading = true;

    try {
      const user = (await supabase.auth.getSession()).data.session?.user;
      if (!user) {
        set({ isLoading: false });
        get()._loading = false;
        return;
      }

      const [peopleRes, boardsRes, settingsRes] = await Promise.all([
        supabase
          .from('people')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('pairing_boards')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('workspace_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (peopleRes.error) {
        console.error('People load error:', peopleRes.error);
        set({ isLoading: false, error: peopleRes.error.message });
        toast().addToast(
          'RAAA What the heck?! Failed to load team data. 🦜',
          'error'
        );
        return;
      }
      if (boardsRes.error) {
        console.error('Boards load error:', boardsRes.error);
        set({ isLoading: false, error: boardsRes.error.message });
        toast().addToast(
          'RAAA! Failed to load boards. Did they fly away? 🪹',
          'error'
        );
        return;
      }

      let people = (peopleRes.data as unknown as PersonRecord[]).map(
        rowToPerson
      );
      let boards = (boardsRes.data as unknown as BoardRecord[]).map(rowToBoard);

      // Sync settings to store
      if (settingsRes.data) {
        const { public_view_enabled, onboarding_completed, share_token } =
          settingsRes.data;
        const prefs = useWorkspacePrefsStore.getState();
        prefs.setPublicViewEnabled(public_view_enabled);
        prefs.setOnboardingCompleted(onboarding_completed);
        if (share_token) prefs.setShareToken(share_token);
      }

      // Seed defaults only for completely empty workspaces
      if (boards.length === 0 && people.length === 0) {
        console.log('Seeding default workspace data for user:', user.id);
        const defaultBoards = [
          {
            name: 'Board 1',
            is_exempt: false,
            sort_order: 0,
            goals: [],
            assigned_person_ids: [],
          },
          {
            name: 'Board 2',
            is_exempt: false,
            sort_order: 1,
            goals: [],
            assigned_person_ids: [],
          },
          {
            name: 'OOO',
            is_exempt: true,
            sort_order: 2,
            goals: [],
            assigned_person_ids: [],
          },
        ];
        const defaultPeople = [
          { name: 'Alice', avatar_color_hex: AVATAR_COLORS[0] },
          { name: 'Bob', avatar_color_hex: AVATAR_COLORS[1] },
          { name: 'Charlie', avatar_color_hex: AVATAR_COLORS[2] },
        ];

        const [boardRes, peopleRes2] = await Promise.all([
          supabase
            .from('pairing_boards')
            .insert(defaultBoards.map((b) => ({ ...b, user_id: user.id })))
            .select(),
          supabase
            .from('people')
            .insert(defaultPeople.map((p) => ({ ...p, user_id: user.id })))
            .select(),
        ]);

        if (boardRes.error) console.error('Board seed error:', boardRes.error);
        if (peopleRes2.error)
          console.error('People seed error:', peopleRes2.error);

        if (boardRes.data) {
          boards = (boardRes.data as unknown as BoardRecord[]).map(rowToBoard);
        }
        if (peopleRes2.data) {
          people = (peopleRes2.data as unknown as PersonRecord[]).map(
            rowToPerson
          );
        }
      }

      set({ people, boards, isLoading: false });
      get().loadStalePairs();
    } catch (err) {
      console.error('General loadWorkspaceData error:', err);
      set({ isLoading: false });
    } finally {
      get()._loading = false;
    }
  },

  subscribeToRealtime: () => {
    const user = useAuthStore.getState().user;
    if (!user) return () => {};

    const channelId = `workspace-${user.id.slice(0, 8)}`;

    // Clean up existing if somehow called twice
    supabase.removeChannel(supabase.channel(channelId));

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'people' },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          set((state) => {
            if (eventType === 'INSERT') {
              // Only add if not already in state (could be our own insert)
              const exists = state.people.some(
                (p) => p.id === (newRow as PersonRecord).id
              );
              if (exists) return state;
              return {
                people: [...state.people, rowToPerson(newRow as PersonRecord)],
              };
            }
            if (eventType === 'UPDATE') {
              return {
                people: state.people.map((p) =>
                  p.id === (newRow as PersonRecord).id
                    ? rowToPerson(newRow as PersonRecord)
                    : p
                ),
              };
            }
            if (eventType === 'DELETE') {
              return {
                people: state.people.filter(
                  (p) => p.id !== (oldRow as PersonRecord).id
                ),
              };
            }
            return state;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pairing_boards' },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          set((state) => {
            if (eventType === 'INSERT') {
              const exists = state.boards.some(
                (b) => b.id === (newRow as BoardRecord).id
              );
              if (exists) return state;
              return {
                boards: [...state.boards, rowToBoard(newRow as BoardRecord)],
              };
            }
            if (eventType === 'UPDATE') {
              return {
                boards: state.boards.map((b) =>
                  b.id === (newRow as BoardRecord).id
                    ? rowToBoard(newRow as BoardRecord)
                    : b
                ),
              };
            }
            if (eventType === 'DELETE') {
              return {
                boards: state.boards.filter(
                  (b) => b.id !== (oldRow as BoardRecord).id
                ),
              };
            }
            return state;
          });
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },
});
