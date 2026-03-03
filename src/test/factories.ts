import { Person, PairingBoard } from '../features/pairing/types';

/**
 * Creates a mock Person object with sensible defaults.
 */
export const createPerson = (overrides?: Partial<Person>): Person => ({
  id: crypto.randomUUID(),
  name: 'Test Person',
  avatarColorHex: '#6366f1',
  ...overrides,
});

/**
 * Creates a mock PairingBoard object with sensible defaults.
 */
export const createBoard = (
  overrides?: Partial<PairingBoard>
): PairingBoard => ({
  id: crypto.randomUUID(),
  name: 'Test Board',
  isExempt: false,
  isLocked: false,
  sortOrder: 0,
  goals: [],
  assignedPersonIds: [],
  ...overrides,
});
