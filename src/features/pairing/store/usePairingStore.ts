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
  goals: string[] | null;
  meeting_link: string | null;
  sort_order: number;
  assigned_person_ids: string[];
}

interface HistoryRow {
  user_id: string;
  session_id: string;
  person_id: string;
  board_id: string;
}

function rowToPerson(row: PersonRow): Person {
  return { id: row.id, name: row.name, avatarColorHex: row.avatar_color_hex };
}

function rowToBoard(row: BoardRow): PairingBoard {
  return {
    id: row.id,
    name: row.name,
    isExempt: row.is_exempt,
    sortOrder: row.sort_order,
    goals: row.goals ?? [],
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
      Pick<PairingBoard, 'name' | 'goals' | 'meetingLink' | 'isExempt'>
    >
  ) => Promise<void>;
  removeBoard: (id: string) => Promise<void>;

  // Session History
  saveSession: () => Promise<void>;

  // Algorithm & Templates
  recommendPairs: () => Promise<void>;
  saveCurrentAsTemplate: (name: string) => Promise<void>;
  applyTemplate: (templateId: string) => Promise<void>;
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

    // Seed defaults only for completely empty workspaces
    if (boards.length === 0 && people.length === 0) {
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
          is_exempt: true,
          sort_order: 2,
          goals: [],
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
    // Optimistic update
    const prev = get().people;
    set((state) => ({
      people: state.people.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));

    const dbUpdates: Partial<PersonRow> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.avatarColorHex !== undefined)
      dbUpdates.avatar_color_hex = updates.avatarColorHex;

    const { error } = await supabase
      .from('people')
      .update(dbUpdates)
      .eq('id', id);
    if (error) {
      set({ people: prev }); // rollback
      toast().addToast('Failed to update team member.', 'error');
    }
  },

  removePerson: async (id) => {
    const person = get().people.find((p) => p.id === id);
    const prevPeople = get().people;
    const prevBoards = get().boards;

    // Optimistic update
    const updatedBoards = get().boards.map((b) => ({
      ...b,
      assignedPersonIds: (b.assignedPersonIds ?? []).filter(
        (pid) => pid !== id
      ),
    }));
    set({
      people: prevPeople.filter((p) => p.id !== id),
      boards: updatedBoards,
    });
    if (person)
      toast().addToast(`${person.name} removed from the team.`, 'success');

    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) {
      set({ people: prevPeople, boards: prevBoards }); // rollback
      toast().addToast('Failed to remove team member.', 'error');
      return;
    }
    // Persist board cleanup in background
    get().persistBoardAssignments(updatedBoards);
  },

  setBoards: (boards) => {
    set((state) => {
      const next = typeof boards === 'function' ? boards(state.boards) : boards;
      get().persistBoardAssignments(next);
      return { boards: next };
    });
  },

  persistBoardAssignments: async (boards) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Inclusion of all non-null columns (name, sort_order) is mandatory for downsert (upsert).
    const updates = boards.map((b) => ({
      id: b.id,
      user_id: user.id,
      name: b.name,
      is_exempt: b.isExempt,
      sort_order: b.sortOrder,
      goals: b.goals ?? [],
      assigned_person_ids: b.assignedPersonIds ?? [],
    }));

    const { error } = await supabase
      .from('pairing_boards')
      .upsert(updates, { onConflict: 'id' });
    if (error) {
      console.error('Board persistence error:', error);
      toast().addToast(
        `Could not save board changes: ${error.message}`,
        'error'
      );
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
      toast().addToast(
        `Failed to create board "${name}": ${error?.message || 'Unknown error'}`,
        'error'
      );
      return;
    }
    set((state) => ({
      boards: [...state.boards, rowToBoard(data as BoardRow)],
    }));
    toast().addToast(`"${name.trim()}" board created.`, 'success');
  },

  updateBoard: async (id, updates) => {
    // Optimistic update
    const prev = get().boards;
    set((state) => ({
      boards: state.boards.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.goals !== undefined) dbUpdates.goals = updates.goals;
    if (updates.meetingLink !== undefined)
      dbUpdates.meeting_link = updates.meetingLink;
    if (updates.isExempt !== undefined) dbUpdates.is_exempt = updates.isExempt;

    const { error } = await supabase
      .from('pairing_boards')
      .update(dbUpdates)
      .eq('id', id);
    if (error) {
      set({ boards: prev }); // rollback
      toast().addToast(`Failed to update board: ${error.message}`, 'error');
    }
  },

  removeBoard: async (id) => {
    const board = get().boards.find((b) => b.id === id);
    const prev = get().boards;

    // Optimistic update — remove instantly
    set((state) => ({ boards: state.boards.filter((b) => b.id !== id) }));
    if (board) toast().addToast(`"${board.name}" board deleted.`, 'success');

    const { error } = await supabase
      .from('pairing_boards')
      .delete()
      .eq('id', id);
    if (error) {
      set({ boards: prev }); // rollback
      toast().addToast(`Failed to delete board: ${error.message}`, 'error');
    }
  },

  saveSession: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { boards } = get();
    // Validate we actually have some assignments to save
    const hasAssignments = boards.some(
      (b) => (b.assignedPersonIds ?? []).length > 0
    );
    if (!hasAssignments) {
      toast().addToast(
        'Nothing to save! Assign some people to boards first.',
        'info'
      );
      return;
    }

    set({ isLoading: true });

    // 1. Create a session
    const { data: session, error: sessionErr } = await supabase
      .from('pairing_sessions')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (sessionErr || !session) {
      set({ isLoading: false });
      toast().addToast(
        `Failed to create session: ${sessionErr?.message}`,
        'error'
      );
      return;
    }

    // 2. Prepare history rows
    const historyRows: HistoryRow[] = [];
    boards.forEach((board) => {
      (board.assignedPersonIds ?? []).forEach((personId) => {
        historyRows.push({
          user_id: user.id,
          session_id: session.id,
          person_id: personId,
          board_id: board.id,
        });
      });
    });

    // 3. Insert history
    const { error: historyErr } = await supabase
      .from('pairing_history')
      .insert(historyRows);

    set({ isLoading: false });

    if (historyErr) {
      toast().addToast(
        `Failed to save history: ${historyErr.message}`,
        'error'
      );
    } else {
      toast().addToast('Pairing session saved successfully!', 'success');
    }
  },

  recommendPairs: async () => {
    const { people, boards } = get();
    if (people.length < 2) return;

    set({ isLoading: true });

    try {
      // 1. Fetch recent history to build a "pairing friction" map
      const { data: history, error: historyErr } = await supabase
        .from('pairing_history')
        .select('person_id, board_id, session_id')
        .order('created_at', { ascending: false })
        .limit(100);

      if (historyErr) throw historyErr;

      // Map of personId -> Map of otherPersonId -> count (how many times they paired)
      const friction: Record<string, Record<string, number>> = {};
      people.forEach((p1) => {
        friction[p1.id] = {};
        people.forEach((p2) => {
          if (p1.id !== p2.id) friction[p1.id][p2.id] = 0;
        });
      });

      // Group history by session and board to find pairs
      const sessions: Record<string, Record<string, string[]>> = {};
      (
        history as { session_id: string; board_id: string; person_id: string }[]
      )?.forEach((row) => {
        if (!sessions[row.session_id]) {
          sessions[row.session_id] = {} as Record<string, string[]>;
        }
        if (!sessions[row.session_id][row.board_id]) {
          sessions[row.session_id][row.board_id] = [] as string[];
        }
        sessions[row.session_id][row.board_id].push(row.person_id);
      });

      Object.values(sessions).forEach((boardsMap) => {
        Object.values(boardsMap).forEach((pIds) => {
          for (let i = 0; i < pIds.length; i++) {
            for (let j = i + 1; j < pIds.length; j++) {
              const p1 = pIds[i];
              const p2 = pIds[j];
              if (friction[p1] && friction[p1][p2] !== undefined) {
                friction[p1][p2]++;
                friction[p2][p1]++;
              }
            }
          }
        });
      });

      // 2. Greedy assignment
      const unassigned = [...people].sort(() => Math.random() - 0.5);
      const newBoards = boards.map((b) => ({
        ...b,
        assignedPersonIds: [] as string[],
      }));
      const activeBoards = newBoards.filter((b) => !b.isExempt);

      if (activeBoards.length === 0) {
        set({ isLoading: false });
        return;
      }

      while (unassigned.length > 0) {
        const p1 = unassigned.pop()!;

        // Find the board with the least people (copy array to avoid mutating activeBoards if needed)
        const targetBoard = [...activeBoards].sort(
          (a, b) =>
            (a.assignedPersonIds?.length || 0) -
            (b.assignedPersonIds?.length || 0)
        )[0];

        if (!targetBoard.assignedPersonIds) {
          targetBoard.assignedPersonIds = [];
        }

        targetBoard.assignedPersonIds.push(p1.id);
      }

      set({ boards: newBoards });
      get().persistBoardAssignments(newBoards);
      toast().addToast('Smart-Pair rotation suggested!', 'success');
    } catch (err) {
      console.error(err);
      toast().addToast('Algorithm failed to load history data.', 'error');
    } finally {
      set({ isLoading: false });
    }
  },

  saveCurrentAsTemplate: async (name: string) => {
    const { boards } = get();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const templateData = boards.map((b) => ({
      name: b.name,
      goals: b.goals,
      isExempt: b.isExempt,
    }));

    const { error } = await supabase.from('pairing_templates').insert({
      user_id: user.id,
      name,
      boards: templateData,
    });

    if (error) {
      toast().addToast('Failed to save template.', 'error');
    } else {
      toast().addToast(`Template "${name}" saved!`, 'success');
    }
  },

  applyTemplate: async (templateId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('pairing_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      // 1. Delete current boards (careful: this moves people back to pool)
      const { boards: currentBoards } = get();
      await Promise.all(
        currentBoards.map((b) =>
          supabase.from('pairing_boards').delete().eq('id', b.id)
        )
      );

      // 2. Create new boards from template
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const templateBoards = data.boards as {
        name: string;
        goals: string[];
        isExempt: boolean;
      }[];

      const newBoardsRows = templateBoards.map((tb, i) => ({
        user_id: user!.id,
        name: tb.name,
        goals: tb.goals ?? [],
        is_exempt: tb.isExempt,
        sort_order: i,
        assigned_person_ids: [] as string[],
      }));

      const { data: created, error: createErr } = await supabase
        .from('pairing_boards')
        .insert(newBoardsRows)
        .select();

      if (createErr) throw createErr;

      set({
        boards: (created as BoardRow[]).map(rowToBoard),
        isLoading: false,
      });
      toast().addToast(`Applied template "${data.name}"`, 'success');
    } catch (_err) {
      set({ isLoading: false });
      toast().addToast('Failed to apply template.', 'error');
    }
  },
}));
