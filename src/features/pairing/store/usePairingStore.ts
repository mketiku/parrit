import { create } from 'zustand';
import type { Person, PairingBoard, PersonRecord, BoardRecord } from '../types';
import { supabase } from '../../../lib/supabase';
import { useToastStore } from '../../../store/useToastStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';

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

interface HistoryRow {
  user_id: string;
  session_id: string;
  person_id: string;
  board_id: string;
  created_at?: string;
}

interface ExportedSession {
  session_date: string;
  created_at: string;
  history: {
    personName: string;
    boardName: string;
    createdAt: string;
  }[];
}

interface WorkspaceSnapshot {
  version: number;
  exportedAt: string;
  people: { name: string; avatarColorHex: string }[];
  boards: {
    name: string;
    isExempt: boolean;
    goals: string[];
    meetingLink: string | null;
    assignedPersonNames: string[];
  }[];
  sessions?: ExportedSession[];
}

function rowToPerson(row: PersonRecord): Person {
  return { id: row.id, name: row.name, avatarColorHex: row.avatar_color_hex };
}

function rowToBoard(row: BoardRecord): PairingBoard {
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
  applyBuiltinTemplate: (
    name: string,
    boards: { name: string; isExempt: boolean }[]
  ) => Promise<void>;
  rotateBoardPair: (boardId: string) => Promise<void>;

  // Export / Import
  exportWorkspace: (includeHistory?: boolean) => Promise<string>; // returns JSON string
  importWorkspace: (json: string) => Promise<void>;
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
      set({ isLoading: false, error: peopleRes.error.message });
      toast().addToast('Failed to load team data.', 'error');
      return;
    }
    if (boardsRes.error) {
      set({ isLoading: false, error: boardsRes.error.message });
      toast().addToast('Failed to load boards.', 'error');
      return;
    }

    const people = (peopleRes.data as unknown as PersonRecord[]).map(
      rowToPerson
    );
    const boards = (boardsRes.data as unknown as BoardRecord[]).map(rowToBoard);

    // Sync settings to store
    if (settingsRes.data) {
      const { public_view_enabled, onboarding_completed } = settingsRes.data;
      const prefs = useWorkspacePrefsStore.getState();
      prefs.setPublicViewEnabled(public_view_enabled);
      prefs.setOnboardingCompleted(onboarding_completed);
    }

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
        { name: 'Alice', avatar_color_hex: AVATAR_COLORS[0] },
        { name: 'Bob', avatar_color_hex: AVATAR_COLORS[1] },
        { name: 'Charlie', avatar_color_hex: AVATAR_COLORS[2] },
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
          ? (boardRes.data as unknown as BoardRecord[]).map(rowToBoard)
          : [],
        people: peopleRes2.data
          ? (peopleRes2.data as unknown as PersonRecord[]).map(rowToPerson)
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
      people: [...state.people, rowToPerson(data as PersonRecord)],
    }));
    toast().addToast(`${name.trim()} added to the team.`, 'success');
  },

  updatePerson: async (id, updates) => {
    // Optimistic update
    const prev = get().people;
    set((state) => ({
      people: state.people.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));

    const dbUpdates: Partial<PersonRecord> = {};
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
      boards: [...state.boards, rowToBoard(data as BoardRecord)],
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
      // 1. Fetch recent history to determine last time people paired
      const { data: history, error: historyErr } = await supabase
        .from('pairing_history')
        .select('person_id, board_id, session_id, created_at')
        .order('created_at', { ascending: false })
        .limit(400);

      if (historyErr) throw historyErr;

      // lastPairedAt[p1][p2] = most recent timestamp they were on a board together
      const lastPairedAt: Record<string, Record<string, string>> = {};

      // Group history by session + board to identify pairs
      const sessionMap: Record<
        string,
        Record<string, { pid: string; time: string }[]>
      > = {};
      (history as unknown as HistoryRow[])?.forEach((row) => {
        if (!sessionMap[row.session_id]) sessionMap[row.session_id] = {};
        if (!sessionMap[row.session_id][row.board_id])
          sessionMap[row.session_id][row.board_id] = [];
        sessionMap[row.session_id][row.board_id].push({
          pid: row.person_id,
          time: row.created_at || '',
        });
      });

      Object.values(sessionMap).forEach((boardsInSession) => {
        Object.values(boardsInSession).forEach((peopleOnBoard) => {
          for (let i = 0; i < peopleOnBoard.length; i++) {
            for (let j = i + 1; j < peopleOnBoard.length; j++) {
              const p1 = peopleOnBoard[i].pid;
              const p2 = peopleOnBoard[j].pid;
              const time = peopleOnBoard[i].time;

              if (!lastPairedAt[p1]) lastPairedAt[p1] = {};
              if (!lastPairedAt[p2]) lastPairedAt[p2] = {};

              // Since we ordered by created_at DESC, the first one we find is the most recent
              if (!lastPairedAt[p1][p2]) lastPairedAt[p1][p2] = time;
              if (!lastPairedAt[p2][p1]) lastPairedAt[p2][p1] = time;
            }
          }
        });
      });

      // 2. Identify who needs assigning
      const exemptPersonIds = new Set<string>();
      boards
        .filter((b) => b.isExempt)
        .forEach((b) => {
          (b.assignedPersonIds || []).forEach((id) => exemptPersonIds.add(id));
        });

      const unassigned = people
        .filter((p) => !exemptPersonIds.has(p.id))
        .sort(() => Math.random() - 0.5); // Randomize initial pool

      const newBoards = boards.map((b) => ({
        ...b,
        assignedPersonIds: b.isExempt
          ? [...(b.assignedPersonIds || [])]
          : ([] as string[]),
      }));

      const activeBoards = newBoards.filter((b) => !b.isExempt);
      if (activeBoards.length === 0) {
        set({ isLoading: false });
        return;
      }

      // 3. Smart Assignment Logic
      // Strategy:
      // - First, try to put 2 people on every available board using Least Recent logic.
      // - Then, fill the rest on the least-filled boards.

      // Phase A: Create Core Pairs
      for (const board of activeBoards) {
        if (unassigned.length === 0) break;

        // Pick p1 (first person for the board)
        const p1 = unassigned.pop()!;
        board.assignedPersonIds.push(p1.id);

        if (unassigned.length > 0) {
          // Find p2 (the person who hasn't paired with p1 in the longest time)
          let bestP2Index = -1;
          let oldestTime = '9999-12-31'; // Future date for "never paired" logic

          unassigned.forEach((candidate, idx) => {
            const lastTime =
              lastPairedAt[p1.id]?.[candidate.id] || '0000-01-01';
            if (lastTime < oldestTime) {
              oldestTime = lastTime;
              bestP2Index = idx;
            }
          });

          if (bestP2Index !== -1) {
            const p2 = unassigned.splice(bestP2Index, 1)[0];
            board.assignedPersonIds.push(p2.id);
          }
        }
      }

      // Phase B: Overflow (if people left, distribute to least filled boards)
      while (unassigned.length > 0) {
        const pNext = unassigned.pop()!;
        const targetBoard = activeBoards.sort(
          (a, b) =>
            (a.assignedPersonIds?.length || 0) -
            (b.assignedPersonIds?.length || 0)
        )[0];
        targetBoard.assignedPersonIds.push(pNext.id);
      }

      set({ boards: newBoards });
      get().persistBoardAssignments(newBoards);
      toast().addToast(
        'Data-driven "Least Recent" rotation suggested!',
        'success'
      );
    } catch (err) {
      console.error('Recommendation Error:', err);
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
        boards: (created as BoardRecord[]).map(rowToBoard),
        isLoading: false,
      });
      toast().addToast(`Applied template "${data.name}"`, 'success');
    } catch {
      set({ isLoading: false });
      toast().addToast('Failed to apply template.', 'error');
    }
  },

  applyBuiltinTemplate: async (name, boards) => {
    set({ isLoading: true });
    try {
      const currentBoards = get().boards;
      await Promise.all(
        currentBoards.map((b) =>
          supabase.from('pairing_boards').delete().eq('id', b.id)
        )
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated.');

      const newBoardsRows = boards.map((b, i) => ({
        user_id: user.id,
        name: b.name,
        goals: [] as string[],
        is_exempt: b.isExempt,
        sort_order: i,
        assigned_person_ids: [] as string[],
      }));

      const { data: created, error: createErr } = await supabase
        .from('pairing_boards')
        .insert(newBoardsRows)
        .select();

      if (createErr) throw createErr;

      set({
        boards: (created as BoardRecord[]).map(rowToBoard),
        isLoading: false,
      });
      toast().addToast(`Applied preset "${name}" ✓`, 'success');
    } catch {
      set({ isLoading: false });
      toast().addToast('Failed to apply preset template.', 'error');
    }
  },

  rotateBoardPair: async (boardId) => {
    const { boards, people } = get();
    const sourceBoard = boards.find((b) => b.id === boardId);
    if (!sourceBoard || (sourceBoard.assignedPersonIds ?? []).length === 0)
      return;

    // 1. Pick a person from the source board to "eject"
    const ids = sourceBoard.assignedPersonIds ?? [];
    const ejectIdx = Math.floor(Math.random() * ids.length);
    const ejectedId = ids[ejectIdx];

    // 2. Find eligible swap candidates (everyone NOT on this board)
    const otherPeopleIds = people
      .map((p) => p.id)
      .filter((id) => !ids.includes(id));

    if (otherPeopleIds.length === 0) return;

    // 3. Pick a target person to swap in
    const targetId =
      otherPeopleIds[Math.floor(Math.random() * otherPeopleIds.length)];

    // 4. Find which board (if any) the target person is currently on
    const targetBoard = boards.find((b) =>
      (b.assignedPersonIds ?? []).includes(targetId)
    );

    const updatedBoards = boards.map((b) => {
      let newIds = [...(b.assignedPersonIds ?? [])];

      if (b.id === sourceBoard.id) {
        // Swap out the ejected guy, swap in the target
        newIds = newIds.map((id) => (id === ejectedId ? targetId : id));
      } else if (targetBoard && b.id === targetBoard.id) {
        // If the target was on another board, swap out the target, swap in the ejected guy
        newIds = newIds.map((id) => (id === targetId ? ejectedId : id));
      } else if (!targetBoard && b.id === 'pool') {
        // (Pool isn't a board in DB, it's just filtered state, so persistBoardAssignments handles it)
      }

      return { ...b, assignedPersonIds: newIds };
    });

    // 5. Update and Persist
    set({ boards: updatedBoards });
    await get().persistBoardAssignments(updatedBoards);
    toast().addToast('Pair rotated ⟳', 'success');
  },

  exportWorkspace: async (includeHistory = true) => {
    const { people, boards } = get();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return '';

    // Build a portable snapshot — IDs are NOT included (they're workspace-specific).
    // We store person names + colors so they can be re-created on import.
    const snapshot: WorkspaceSnapshot = {
      version: 2,
      exportedAt: new Date().toISOString(),
      people: people.map((p) => ({
        name: p.name,
        avatarColorHex: p.avatarColorHex,
      })),
      boards: boards.map((b) => ({
        name: b.name,
        isExempt: b.isExempt,
        goals: b.goals,
        meetingLink: b.meetingLink ?? null,
        assignedPersonNames: (b.assignedPersonIds ?? [])
          .map((id) => people.find((p) => p.id === id)?.name ?? null)
          .filter((n): n is string => !!n),
      })),
    };

    if (includeHistory) {
      const { data: sessionsData } = await supabase
        .from('pairing_sessions')
        .select(
          `
          id,
          session_date,
          created_at,
          pairing_history (
            person_id,
            board_id,
            created_at,
            people (name),
            pairing_boards (name)
          )
        `
        )
        .eq('user_id', user.id)
        .order('session_date', { ascending: true });

      if (sessionsData) {
        snapshot.sessions = (
          sessionsData as unknown as Array<{
            session_date: string;
            created_at: string;
            pairing_history: Array<{
              people: { name: string };
              pairing_boards: { name: string };
              created_at: string;
            }>;
          }>
        ).map((s) => ({
          session_date: s.session_date,
          created_at: s.created_at,
          history: (s.pairing_history || []).map((h) => ({
            personName: h.people?.name || 'Unknown Person',
            boardName: h.pairing_boards?.name || 'Unknown Board',
            createdAt: h.created_at,
          })),
        }));
      }
    }

    return JSON.stringify(snapshot, null, 2);
  },

  importWorkspace: async (json: string) => {
    set({ isLoading: true });
    try {
      const snapshot = JSON.parse(json) as WorkspaceSnapshot;

      if (
        !snapshot.version ||
        !Array.isArray(snapshot.people) ||
        !Array.isArray(snapshot.boards)
      ) {
        throw new Error('Invalid workspace export file.');
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated.');

      // 1. Delete all existing people, boards, and sessions (cascades to history)
      await Promise.all([
        supabase.from('people').delete().eq('user_id', user.id),
        supabase.from('pairing_boards').delete().eq('user_id', user.id),
        supabase.from('pairing_sessions').delete().eq('user_id', user.id),
      ]);

      // 2. Create new people
      const peopleRows = snapshot.people.map((p) => ({
        user_id: user.id,
        name: p.name,
        avatar_color_hex: p.avatarColorHex,
      }));

      const { data: createdPeople, error: peopleErr } = await supabase
        .from('people')
        .insert(peopleRows)
        .select();
      if (peopleErr) throw peopleErr;

      // Build name → new ID map
      const nameToId: Record<string, string> = {};
      (createdPeople as PersonRecord[]).forEach((row) => {
        nameToId[row.name] = row.id;
      });

      // 3. Create new boards
      const boardRows = snapshot.boards.map((b, i) => ({
        user_id: user.id,
        name: b.name,
        is_exempt: b.isExempt,
        goals: b.goals ?? [],
        meeting_link: b.meetingLink ?? null,
        sort_order: i,
        assigned_person_ids: (b.assignedPersonNames ?? [])
          .map((name) => nameToId[name])
          .filter(Boolean),
      }));

      const { data: createdBoards, error: boardsErr } = await supabase
        .from('pairing_boards')
        .insert(boardRows)
        .select();
      if (boardsErr) throw boardsErr;

      // Build board name → id map
      const boardNameToId: Record<string, string> = {};
      (createdBoards as BoardRecord[]).forEach((row) => {
        boardNameToId[row.name] = row.id;
      });

      // 4. Restore Sessions & History if present
      if (snapshot.sessions && Array.isArray(snapshot.sessions)) {
        for (const s of snapshot.sessions) {
          const { data: session, error: sErr } = await supabase
            .from('pairing_sessions')
            .insert({
              user_id: user.id,
              session_date: s.session_date,
              created_at: s.created_at,
            })
            .select()
            .single();

          if (sErr || !session) continue;

          const historyRows = (s.history || [])
            .map((h) => ({
              user_id: user.id,
              session_id: session.id,
              person_id: nameToId[h.personName],
              board_id: boardNameToId[h.boardName],
              created_at: h.createdAt,
            }))
            .filter((h) => h.person_id && h.board_id);

          if (historyRows.length > 0) {
            await supabase.from('pairing_history').insert(historyRows);
          }
        }
      }

      set({
        people: (createdPeople as PersonRecord[]).map(rowToPerson),
        boards: (createdBoards as BoardRecord[]).map(rowToBoard),
        isLoading: false,
      });
      toast().addToast('Workspace imported successfully! 🎉', 'success');
    } catch (err: unknown) {
      set({ isLoading: false });
      const msg = err instanceof Error ? err.message : 'Import failed.';
      toast().addToast(msg, 'error');
    }
  },
}));
