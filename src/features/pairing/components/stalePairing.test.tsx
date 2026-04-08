import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DroppableBoard } from './DroppableBoard';
import { usePairingStore } from '../store/usePairingStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import React from 'react';
import type { PairingBoard, Person } from '../types';

// Mock the stores
vi.mock('../store/usePairingStore', () => ({
  usePairingStore: vi.fn(),
}));

vi.mock('../../../store/useWorkspacePrefsStore', () => ({
  useWorkspacePrefsStore: vi.fn(),
}));

// Mock DraggablePerson to just check props
vi.mock('./DraggablePerson', () => ({
  DraggablePerson: ({
    person,
    isStale,
  }: {
    person: { id: string; name: string };
    isStale: boolean;
  }) => (
    <div data-testid={`person-${person.id}`} data-stale={isStale}>
      {person.name} {isStale ? '(STALE)' : ''}
    </div>
  ),
}));

// Mock Dnd-kit hooks used in DroppableBoard
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
    isOver: false,
  }),
}));

describe('DroppableBoard - Stale Person Logic', () => {
  const mockPeople: Person[] = [
    {
      id: 'p1',
      name: 'Alice',
      avatarColorHex: '#ff0000',
      workspaceId: 'w1',
      createdAt: '',
    },
    {
      id: 'p2',
      name: 'Bob',
      avatarColorHex: '#00ff00',
      workspaceId: 'w1',
      createdAt: '',
    },
  ];

  const mockBoard: Partial<PairingBoard> = {
    id: 'b1',
    name: 'Board 1',
    assignedPersonIds: ['p1', 'p2'],
    goals: [],
    isExempt: false,
    isLocked: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default store state
    (usePairingStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      removeBoard: vi.fn(),
      updateBoard: vi.fn(),
      pairRecency: { 'p1:p2': 5 }, // Stale pair
    });

    (
      useWorkspacePrefsStore as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      stalePairHighlightingEnabled: true,
      stalePairThreshold: 3,
    });
  });

  it('identifies people as stale when they exceed the threshold', () => {
    render(
      <DroppableBoard board={mockBoard as PairingBoard} people={mockPeople} />
    );

    const p1 = screen.getByTestId('person-p1');
    const p2 = screen.getByTestId('person-p2');

    expect(p1.getAttribute('data-stale')).toBe('true');
    expect(p2.getAttribute('data-stale')).toBe('true');
  });

  it('does NOT mark people as stale if highlighting is disabled', () => {
    (
      useWorkspacePrefsStore as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      stalePairHighlightingEnabled: false,
      stalePairThreshold: 3,
    });

    render(
      <DroppableBoard board={mockBoard as PairingBoard} people={mockPeople} />
    );

    const p1 = screen.getByTestId('person-p1');
    expect(p1.getAttribute('data-stale')).toBe('false');
  });

  it('does NOT mark people as stale if they are below the threshold', () => {
    (usePairingStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      removeBoard: vi.fn(),
      updateBoard: vi.fn(),
      pairRecency: { 'p1:p2': 2 }, // Below threshold of 3
    });

    render(
      <DroppableBoard board={mockBoard as PairingBoard} people={mockPeople} />
    );

    const p1 = screen.getByTestId('person-p1');
    expect(p1.getAttribute('data-stale')).toBe('false');
  });

  it('handles reverse ID keys in pairRecency (Bob:Alice instead of Alice:Bob)', () => {
    (usePairingStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      removeBoard: vi.fn(),
      updateBoard: vi.fn(),
      pairRecency: { 'p2:p1': 10 },
    });

    render(
      <DroppableBoard board={mockBoard as PairingBoard} people={mockPeople} />
    );

    expect(screen.getByTestId('person-p1').getAttribute('data-stale')).toBe(
      'true'
    );
    expect(screen.getByTestId('person-p2').getAttribute('data-stale')).toBe(
      'true'
    );
  });
});
