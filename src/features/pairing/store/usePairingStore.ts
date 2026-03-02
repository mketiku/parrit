import { create } from 'zustand';
import type { Person, PairingBoard } from '../types';
import { supabase } from '../../../lib/supabase';
import { useToastStore } from '../../../store/useToastStore';

export const AVATAR_COLORS = [
  '#6366f1',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#22c55e',
  '#ef4444',
  '#3b82f6',
  '#a855f7',
  '#f97316',
  '#06b6d4',
];

// ---- DB row types ----
interface PersonRow {
  id: string;
  name: string;
  avatar_color_hex: string;
}

interface BoardRow {
  id: string;
  name: string;
  is_exempt: boolean;
  goal_text: string | null;
  meeting_link: string | null;
  sort_order: number;
  assigned_person_ids: string[];
}

function rowToPerson(row: PersonRow): Person {
  return { id: row.id, name: row.name, avatarColorHex: row.avatar_color_hex };
}

function rowToBoard(row: BoardRow): PairingBoard {
  return {
    id: row.id,
    name: row.name,
    isExempt: row.is_exempt,
    goalText: row.goal_text ?? undefined,
    meetingLink: row.meeting_link ?? undefined,
    assignedPersonIds: row.assigned_person_ids ?? [],
  };
}

// ---- Store interface ----
interface PairingStore {
  people: Person[];
  boards: PairingBoard[];
  isLoading: boolean;
  error: string | null;

  // Lifecycle
  loadWorkspaceData: () => Promise<void>;
  subscribeToRealtime: () => () => void; // returns unsubscribe fn

  // People actions
  addPerson: (name: string) => Promise<void>;
  updatePerson: (
    id: string,
    updates: Partial<Pick<Person, 'name' | 'avatarColorHex'>>
  ) => Promise<void>;
  removePerson: (id: string) => Promise<void>;

  // Board actions
  setBoards: (
    boards: PairingBoard[] | ((prev: PairingBoard[]) => PairingBoard[])
  ) => void;
  persistBoardAssignments: (boards: PairingBoard[]) => Promise<void>;
  addBoard: (name: string, isExempt?: boolean) => Promise<void>;
  updateBoard: (
    id: string,
    updates: Partial<
      Pick<PairingBoard, 'name' | 'goalText' | 'meetingLink' | 'isExempt'>
    >
  ) => Promise<void>;
  removeBoard: (id: string) => Promise<void>;
}

const toast = () => useToastStore.getState();

export const usePairingStore = create<PairingStore>((set, get) => ({
  people: [],
  boards: [],
  isLoading: false,
  error: null,

  loadWorkspaceData: async () => {
    set({ isLoading: true, error: null });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      set({ isLoading: false });
      return;
    }

    const [peopleRes, boardsRes] = await Promise.all([
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
    ]);

    if (peopleRes.error) {
      set({ isLoading: false, error: peopleRes.error.message });
      toast().addToast('Failed to load team data.', 'error');
      return;
    }
    if (boardsRes.error) {
      set({ isLoading: false, error: boardsRes.error.message });
      toast().addToast('Failed to load boards.', 'error');
      return;
    }

    const people = (peopleRes.data as PersonRow[]).map(rowToPerson);
    const boards = (boardsRes.data as BoardRow[]).map(rowToBoard);

    // Seed defaults for brand new workspaces
    if (boards.length === 0) {
      const defaultBoards = [
        {
          name: 'Board 1',
          is_exempt: false,
          sort_order: 0,
          assigned_person_ids: [],
        },
        {
          name: 'Board 2',
          is_exempt: false,
          sort_order: 1,
          assigned_person_ids: [],
        },
        {
          name: 'Out of Office',
          is_exempt: true,
          sort_order: 2,
          assigned_person_ids: [],
        },
      ];
      const defaultPeople = [
        { name: 'Alice Anderson', avatar_color_hex: AVATAR_COLORS[0] },
        { name: 'Bob Brooks', avatar_color_hex: AVATAR_COLORS[1] },
        { name: 'Charles Carter', avatar_color_hex: AVATAR_COLORS[2] },
      ];

      const [boardRes, peopleRes2] = await Promise.all([
        supabase
          .from('pairing_boards')
          .insert(defaultBoards.map((b) => ({ ...b, user_id: user.id })))
          .select(),
        people.length === 0
          ? supabase
              .from('people')
              .insert(defaultPeople.map((p) => ({ ...p, user_id: user.id })))
              .select()
          : Promise.resolve({ data: null, error: null }),
      ]);

      set({
        boards: boardRes.data
          ? (boardRes.data as BoardRow[]).map(rowToBoard)
          : [],
        people: peopleRes2.data
          ? (peopleRes2.data as PersonRow[]).map(rowToPerson)
          : people,
        isLoading: false,
      });
      return;
    }

    set({ people, boards, isLoading: false });
  },

  subscribeToRealtime: () => {
    const channel = supabase
      .channel('workspace-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'people' },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          set((state) => {
            if (eventType === 'INSERT') {
              // Only add if not already in state (could be our own insert)
              const exists = state.people.some(
                (p) => p.id === (newRow as PersonRow).id
              );
              if (exists) return state;
              return {
                people: [...state.people, rowToPerson(newRow as PersonRow)],
              };
            }
            if (eventType === 'UPDATE') {
              return {
                people: state.people.map((p) =>
                  p.id === (newRow as PersonRow).id
                    ? rowToPerson(newRow as PersonRow)
                    : p
                ),
              };
            }
            if (eventType === 'DELETE') {
              return {
                people: state.people.filter(
                  (p) => p.id !== (oldRow as PersonRow).id
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
                (b) => b.id === (newRow as BoardRow).id
              );
              if (exists) return state;
              return {
                boards: [...state.boards, rowToBoard(newRow as BoardRow)],
              };
            }
            if (eventType === 'UPDATE') {
              return {
                boards: state.boards.map((b) =>
                  b.id === (newRow as BoardRow).id
                    ? rowToBoard(newRow as BoardRow)
                    : b
                ),
              };
            }
            if (eventType === 'DELETE') {
              return {
                boards: state.boards.filter(
                  (b) => b.id !== (oldRow as BoardRow).id
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

  addPerson: async (name: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const usedColors = get().people.map((p) => p.avatarColorHex);
    const nextColor =
      AVATAR_COLORS.find((c) => !usedColors.includes(c)) ??
      AVATAR_COLORS[get().people.length % AVATAR_COLORS.length];

    const { data, error } = await supabase
      .from('people')
      .insert({
        name: name.trim(),
        avatar_color_hex: nextColor,
        user_id: user.id,
      })
      .select()
      .single();

    if (error || !data) {
      toast().addToast(`Failed to add ${name}.`, 'error');
      return;
    }
    set((state) => ({
      people: [...state.people, rowToPerson(data as PersonRow)],
    }));
    toast().addToast(`${name.trim()} added to the team.`, 'success');
  },

  updatePerson: async (id, updates) => {
    const dbUpdates: Partial<PersonRow> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.avatarColorHex !== undefined)
      dbUpdates.avatar_color_hex = updates.avatarColorHex;

    const { error } = await supabase
      .from('people')
      .update(dbUpdates)
      .eq('id', id);
    if (error) {
      toast().addToast('Failed to update team member.', 'error');
      return;
    }
    set((state) => ({
      people: state.people.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  removePerson: async (id) => {
    const person = get().people.find((p) => p.id === id);
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) {
      toast().addToast('Failed to remove team member.', 'error');
      return;
    }

    const updatedBoards = get().boards.map((b) => ({
      ...b,
      assignedPersonIds: (b.assignedPersonIds ?? []).filter(
        (pid) => pid !== id
      ),
    }));
    await get().persistBoardAssignments(updatedBoards);

    set((state) => ({
      people: state.people.filter((p) => p.id !== id),
      boards: updatedBoards,
    }));
    if (person)
      toast().addToast(`${person.name} removed from the team.`, 'success');
  },

  setBoards: (boards) => {
    set((state) => {
      const next = typeof boards === 'function' ? boards(state.boards) : boards;
      get().persistBoardAssignments(next);
      return { boards: next };
    });
  },

  persistBoardAssignments: async (boards) => {
    const updates = boards.map((b) => ({
      id: b.id,
      assigned_person_ids: b.assignedPersonIds ?? [],
    }));
    const { error } = await supabase
      .from('pairing_boards')
      .upsert(updates, { onConflict: 'id' });
    if (error) {
      toast().addToast('Could not save board changes.', 'error');
    }
  },

  addBoard: async (name, isExempt = false) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const sortOrder = get().boards.length;
    const { data, error } = await supabase
      .from('pairing_boards')
      .insert({
        name: name.trim(),
        is_exempt: isExempt,
        sort_order: sortOrder,
        assigned_person_ids: [],
        user_id: user.id,
      })
      .select()
      .single();

    if (error || !data) {
      toast().addToast(`Failed to create board "${name}".`, 'error');
      return;
    }
    set((state) => ({
      boards: [...state.boards, rowToBoard(data as BoardRow)],
    }));
    toast().addToast(`"${name.trim()}" board created.`, 'success');
  },

  updateBoard: async (id, updates) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.goalText !== undefined) dbUpdates.goal_text = updates.goalText;
    if (updates.meetingLink !== undefined)
      dbUpdates.meeting_link = updates.meetingLink;
    if (updates.isExempt !== undefined) dbUpdates.is_exempt = updates.isExempt;

    const { error } = await supabase
      .from('pairing_boards')
      .update(dbUpdates)
      .eq('id', id);
    if (error) {
      toast().addToast('Failed to update board.', 'error');
      return;
    }
    set((state) => ({
      boards: state.boards.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  },

  removeBoard: async (id) => {
    const board = get().boards.find((b) => b.id === id);
    const { error } = await supabase
      .from('pairing_boards')
      .delete()
      .eq('id', id);
    if (error) {
      toast().addToast('Failed to delete board.', 'error');
      return;
    }
    set((state) => ({ boards: state.boards.filter((b) => b.id !== id) }));
    if (board) toast().addToast(`"${board.name}" board deleted.`, 'success');
  },
}));
