import { create } from 'zustand';
import type { Person, PairingBoard } from '../types';

const AVATAR_COLORS = [
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

const INITIAL_PEOPLE: Person[] = [
  { id: '1', name: 'Alice Bob', avatarColorHex: '#6366f1' },
  { id: '2', name: 'Charlie Dave', avatarColorHex: '#ec4899' },
  { id: '3', name: 'Eve Foster', avatarColorHex: '#14b8a6' },
  { id: '4', name: 'Greg House', avatarColorHex: '#f59e0b' },
];

const INITIAL_BOARDS: PairingBoard[] = [
  {
    id: 'board-1',
    name: 'Phoenix',
    isExempt: false,
    goalText: 'Auth UI',
    assignedPersonIds: ['1', '2'],
  },
  {
    id: 'board-2',
    name: 'Macaw',
    isExempt: false,
    goalText: 'API Fixes',
    assignedPersonIds: ['3'],
  },
  {
    id: 'board-ooo',
    name: 'Out of Office',
    isExempt: true,
    assignedPersonIds: [],
  },
];

interface PairingStore {
  people: Person[];
  boards: PairingBoard[];

  // People actions
  addPerson: (name: string) => void;
  updatePerson: (
    id: string,
    updates: Partial<Pick<Person, 'name' | 'avatarColorHex'>>
  ) => void;
  removePerson: (id: string) => void;

  // Board actions
  setBoards: (
    boards: PairingBoard[] | ((prev: PairingBoard[]) => PairingBoard[])
  ) => void;
}

let nextColorIndex = INITIAL_PEOPLE.length % AVATAR_COLORS.length;

export const usePairingStore = create<PairingStore>((set) => ({
  people: INITIAL_PEOPLE,
  boards: INITIAL_BOARDS,

  addPerson: (name: string) => {
    const newPerson: Person = {
      id: `person-${Date.now()}`,
      name,
      avatarColorHex: AVATAR_COLORS[nextColorIndex % AVATAR_COLORS.length],
    };
    nextColorIndex++;
    set((state) => ({ people: [...state.people, newPerson] }));
  },

  updatePerson: (id, updates) => {
    set((state) => ({
      people: state.people.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  removePerson: (id) => {
    set((state) => ({
      people: state.people.filter((p) => p.id !== id),
      // Also remove from all boards
      boards: state.boards.map((b) => ({
        ...b,
        assignedPersonIds: (b.assignedPersonIds || []).filter(
          (pid) => pid !== id
        ),
      })),
    }));
  },

  setBoards: (boards) => {
    set((state) => ({
      boards: typeof boards === 'function' ? boards(state.boards) : boards,
    }));
  },
}));
