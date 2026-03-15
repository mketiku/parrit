import type { StateCreator } from 'zustand';
import { supabase } from '../../../../lib/supabase';
import { useToastStore } from '../../../../store/useToastStore';
import { rowToBoard } from './helpers';
import type { BoardRecord } from '../../types';
import type { PairingStore } from '../usePairingStore';

const toast = () => useToastStore.getState();

export interface TemplateSlice {
  saveCurrentAsTemplate: (name: string) => Promise<void>;
  applyTemplate: (templateId: string) => Promise<void>;
  applyBuiltinTemplate: (
    name: string,
    boards: { name: string; isExempt: boolean }[]
  ) => Promise<void>;
}

export const createTemplateSlice: StateCreator<
  PairingStore,
  [],
  [],
  TemplateSlice
> = (set, get) => ({
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
});
