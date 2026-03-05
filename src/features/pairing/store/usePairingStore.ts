import { create } from 'zustand';
import type { Person, PairingBoard, PersonRecord, BoardRecord } from '../types';
import { supabase } from '../../../lib/supabase';
import { useToastStore } from '../../../store/useToastStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { calculateRecommendations } from '../utils/pairingLogic';

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
  person_name?: string;
  board_name?: string;
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
    isLocked: row.is_locked || false,
    sortOrder: row.sort_order,
    goals: row.goals ?? [],
    meetingLink: row.meeting_link ?? undefined,
    assignedPersonIds: row.assigned_person_ids ?? [],
  };
}

// ---- Store interface ----
export interface PairingStore {
  people: Person[];
  boards: PairingBoard[];
  isLoading: boolean;
  isSaving: boolean;
  isRecommending: boolean;
  error: string | null;
  _delay: (ms: number) => Promise<void>;
  previousBoards: PairingBoard[] | null;

  // Lifecycle
  loadWorkspaceData: () => Promise<void>;
  subscribeToRealtime: () => () => void; // returns unsubscribe fn

  // Undo system
  undo: () => void;

  // People actions
  addPerson: (name: string) => Promise<void>;
  updatePerson: (
    id: string,
    updates: Partial<Pick<Person, 'name' | 'avatarColorHex'>>
  ) => Promise<void>;
  removePerson: (id: string) => Promise<void>;

  // Board actions
  setBoards: (
    boards: PairingBoard[] | ((prev: PairingBoard[]) => PairingBoard[]),
    undoable?: boolean
  ) => void;
  persistBoardAssignments: (boards: PairingBoard[]) => Promise<void>;
  addBoard: (name: string, isExempt?: boolean) => Promise<void>;
  updateBoard: (
    id: string,
    updates: Partial<
      Pick<
        PairingBoard,
        'name' | 'goals' | 'meetingLink' | 'isExempt' | 'isLocked'
      >
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

  // Export / Import
  exportWorkspace: (includeHistory?: boolean) => Promise<string>; // returns JSON string
  importWorkspace: (json: string) => Promise<void>;
}

const toast = () => useToastStore.getState();

export const usePairingStore = create<PairingStore>((set, get) => ({
  people: [],
  boards: [],
  isLoading: false,
  isSaving: false,
  isRecommending: false,
  error: null,

  _delay: (ms: number) => new Promise((res) => setTimeout(res, ms)),
  previousBoards: null,

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

  undo: () => {
    const { previousBoards } = get();
    if (previousBoards) {
      set({ boards: previousBoards, previousBoards: null });
      get().persistBoardAssignments(previousBoards);
      toast().addToast('Action undone.', 'success');
    }
  },

  setBoards: (boards, undoable = false) => {
    const currentBoards = get().boards;
    const next = typeof boards === 'function' ? boards(currentBoards) : boards;

    if (undoable) {
      set({ previousBoards: currentBoards });
      toast().addToast('Boards updated.', 'info', {
        label: 'Undo',
        onClick: () => get().undo(),
      });
    }

    set({ boards: next });
    get().persistBoardAssignments(next);
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
      is_locked: b.isLocked,
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
        is_locked: false,
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
    if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;

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
    if (get().isSaving) return;

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

    set({ isSaving: true });

    // 1. Create a session
    const { data: session, error: sessionErr } = await supabase
      .from('pairing_sessions')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (sessionErr || !session) {
      set({ isSaving: false });
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
        const person = get().people.find((p) => p.id === personId);
        historyRows.push({
          user_id: user.id,
          session_id: session.id,
          person_id: personId,
          board_id: board.id,
          board_name: board.name,
          person_name: person?.name || 'Unknown',
        });
      });
    });

    // Insert history
    const { error: historyErr } = await supabase
      .from('pairing_history')
      .insert(historyRows);

    // Artificial delay for calmness
    await get()._delay(800);

    set({ isSaving: false });

    if (historyErr) {
      toast().addToast(
        `Failed to save history: ${historyErr.message}`,
        'error'
      );
    } else {
      toast().addToast('Pairing session saved successfully!', 'success');

      // Fire chat webhook if configured
      const { slackWebhookUrl } = (
        await import('../../../store/useWorkspacePrefsStore')
      ).useWorkspacePrefsStore.getState();
      if (slackWebhookUrl.trim()) {
        const { boards: currentBoards, people: currentPeople } = get();
        const today = new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });

        // Build board lines, skip empty boards
        const boardLines = currentBoards
          .filter((b) => (b.assignedPersonIds ?? []).length > 0)
          .map((b) => {
            const names = (b.assignedPersonIds ?? [])
              .map((id) => currentPeople.find((p) => p.id === id)?.name ?? id)
              .join(' + ');
            return `• *${b.name}*: ${names}`;
          });

        const text = `:hatching_chick: *Parrit — ${today}*\n${boardLines.join('\n')}`;

        // Support Slack (use 'text'), Discord (use 'content'), and Teams (use 'text')
        try {
          await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, content: text }),
          });
        } catch {
          // Webhook errors are non-critical — don't surface to user
        }
      }
    }
  },

  recommendPairs: async () => {
    const { people, boards } = get();
    if (people.length < 2) return;

    set({ isRecommending: true });
    await get()._delay(1200); // Artificial delay for calmness

    try {
      // 1. Fetch recent history
      const { data: history, error: historyErr } = await supabase
        .from('pairing_history')
        .select('person_id, board_id, session_id, created_at')
        .order('created_at', { ascending: false })
        .limit(400);

      if (historyErr) throw historyErr;

      // 2. Run the algorithm
      const newBoards = calculateRecommendations(
        people,
        boards,
        (history as unknown as HistoryRow[]) || []
      );

      // 3. Update state and persists
      set({ boards: newBoards });
      await get().persistBoardAssignments(newBoards);

      toast().addToast('Rotation recommended!', 'success');
    } catch (err) {
      console.error('Recommendation Error:', err);
      toast().addToast('Algorithm failed to load history data.', 'error');
    } finally {
      set({ isRecommending: false });
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
      isLocked: false,
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
        is_locked: false,
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
        is_locked: false,
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
      toast().addToast(`Applied preset "${name}"`, 'success');
    } catch {
      set({ isLoading: false });
      toast().addToast('Failed to apply preset template.', 'error');
    }
  },

  exportWorkspace: async (includeHistory = true) => {
    const { people, boards } = get();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return '';

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
        isLocked: b.isLocked,
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
        nameToId[row.name.trim()] = row.id;
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
          .map((name) => nameToId[name.trim()])
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
        boardNameToId[row.name.trim()] = row.id;
      });

      const normalizeDate = (d: string | undefined): string | undefined => {
        if (!d) return d;
        if (!isNaN(new Date(d).getTime())) return d;
        // Fix 15:37:37:12.675 -> 15:37:37.12675
        let fixed = d.replace(/:(\d+)\.(\d+)/, '.$1$2');
        // Fix 15:37:37:12 -> 15:37:37.12
        fixed = fixed.replace(/(\d{2}:\d{2}:\d{2}):(\d+)/, '$1.$2');
        if (!isNaN(new Date(fixed).getTime())) return fixed;
        return d;
      };

      // 4. Restore Sessions & History if present
      if (snapshot.sessions && Array.isArray(snapshot.sessions)) {
        for (const s of snapshot.sessions) {
          const { data: session, error: sErr } = await supabase
            .from('pairing_sessions')
            .insert({
              user_id: user.id,
              session_date: s.session_date,
              created_at: normalizeDate(s.created_at),
            })
            .select()
            .single();

          if (sErr || !session) {
            console.error('Session import error:', sErr);
            continue;
          }

          const historyRows = (s.history || [])
            .map((h) => ({
              user_id: user.id,
              session_id: session.id,
              person_id: nameToId[h.personName.trim()],
              board_id: boardNameToId[h.boardName.trim()],
              created_at: normalizeDate(h.createdAt),
            }))
            .filter((h) => h.person_id && h.board_id);

          if (historyRows.length > 0) {
            const { error: hErr } = await supabase
              .from('pairing_history')
              .insert(historyRows);
            if (hErr) {
              console.error('History insert error:', hErr);
            }
          }
        }
      }

      set({
        people: (createdPeople as PersonRecord[]).map(rowToPerson),
        boards: (createdBoards as BoardRecord[]).map(rowToBoard),
        isLoading: false,
      });
      toast().addToast('Workspace imported successfully!', 'success');
    } catch (err: unknown) {
      set({ isLoading: false });
      const msg = err instanceof Error ? err.message : 'Import failed.';
      toast().addToast(msg, 'error');
    }
  },
}));
