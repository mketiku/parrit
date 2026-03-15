import type { StateCreator } from 'zustand';
import type { PairingBoard, BoardRecord } from '../../types';
import { supabase } from '../../../../lib/supabase';
import { useToastStore } from '../../../../store/useToastStore';
import { rowToBoard } from './helpers';
import type { PairingStore } from '../usePairingStore';

const toast = () => useToastStore.getState();

export interface BoardsSlice {
  boards: PairingBoard[];
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
  moveBoard: (activeId: string, overId: string) => Promise<void>;
  removeBoard: (id: string) => Promise<void>;
  undo: () => void;
}

export const createBoardsSlice: StateCreator<
  PairingStore,
  [],
  [],
  BoardsSlice
> = (set, get) => ({
  boards: [],

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

  moveBoard: async (activeId, overId) => {
    const { boards } = get();
    const oldIndex = boards.findIndex((b) => b.id === activeId);
    const newIndex = boards.findIndex((b) => b.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const newBoards = [...boards];
    const [movedBoard] = newBoards.splice(oldIndex, 1);
    newBoards.splice(newIndex, 0, movedBoard);

    const reorderedBoards = newBoards.map((b, idx) => ({
      ...b,
      sortOrder: idx,
    }));

    // Optimistic update
    set({ boards: reorderedBoards });

    // Persist to DB
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const updates = reorderedBoards.map((b) => ({
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
      set({ boards }); // rollback
      toast().addToast(`Failed to reorder boards: ${error.message}`, 'error');
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
});
