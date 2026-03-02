import { create } from 'zustand';
import type { Person, PairingBoard } from '../types';
import { supabase } from '../../../lib/supabase';

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
  return {
    id: row.id,
    name: row.name,
    avatarColorHex: row.avatar_color_hex,
  };
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
}

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
      return;
    }
    if (boardsRes.error) {
      set({ isLoading: false, error: boardsRes.error.message });
      return;
    }

    const people = (peopleRes.data as PersonRow[]).map(rowToPerson);
    const boards = (boardsRes.data as BoardRow[]).map(rowToBoard);

    // Seed default boards for brand new workspaces
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
      const { data: seeded, error: seedErr } = await supabase
        .from('pairing_boards')
        .insert(defaultBoards.map((b) => ({ ...b, user_id: user.id })))
        .select();
      if (!seedErr && seeded) {
        set({
          people,
          boards: (seeded as BoardRow[]).map(rowToBoard),
          isLoading: false,
        });
        return;
      }
    }

    set({ people, boards, isLoading: false });
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

    if (error || !data) return;
    set((state) => ({
      people: [...state.people, rowToPerson(data as PersonRow)],
    }));
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
    if (error) return;
    set((state) => ({
      people: state.people.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  removePerson: async (id) => {
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) return;

    const updatedBoards = get().boards.map((b) => ({
      ...b,
      assignedPersonIds: (b.assignedPersonIds ?? []).filter(
        (pid) => pid !== id
      ),
    }));

    // Persist updated assignments after removal
    await get().persistBoardAssignments(updatedBoards);

    set((state) => ({
      people: state.people.filter((p) => p.id !== id),
      boards: updatedBoards,
    }));
  },

  setBoards: (boards) => {
    set((state) => {
      const next = typeof boards === 'function' ? boards(state.boards) : boards;
      // Fire-and-forget persist whenever assignments change via drag
      get().persistBoardAssignments(next);
      return { boards: next };
    });
  },

  persistBoardAssignments: async (boards) => {
    // Upsert each board's assigned_person_ids back to Supabase
    const updates = boards.map((b) => ({
      id: b.id,
      assigned_person_ids: b.assignedPersonIds ?? [],
    }));

    const { error } = await supabase.from('pairing_boards').upsert(updates, {
      onConflict: 'id',
    });

    if (error) {
      console.error('Failed to persist board assignments:', error.message);
    }
  },
}));
