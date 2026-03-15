import type { StateCreator } from 'zustand';
import type { Person, PersonRecord } from '../../types';
import { supabase } from '../../../../lib/supabase';
import { useToastStore } from '../../../../store/useToastStore';
import { AVATAR_COLORS, rowToPerson } from './helpers';
import type { PairingStore } from '../usePairingStore';

const toast = () => useToastStore.getState();

export interface PeopleSlice {
  people: Person[];
  addPerson: (name: string) => Promise<void>;
  updatePerson: (
    id: string,
    updates: Partial<Pick<Person, 'name' | 'avatarColorHex'>>
  ) => Promise<void>;
  removePerson: (id: string) => Promise<void>;
}

export const createPeopleSlice: StateCreator<
  PairingStore,
  [],
  [],
  PeopleSlice
> = (set, get) => ({
  people: [],

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
});
