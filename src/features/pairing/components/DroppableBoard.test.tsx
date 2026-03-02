import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { DroppableBoard } from './DroppableBoard';
import type { PairingBoard, Person } from '../types';
import React from 'react';
import { usePairingStore } from '../store/usePairingStore';

vi.mock('../store/usePairingStore');
vi.mocked(usePairingStore).mockReturnValue({
  people: [],
  boards: [],
  isLoading: false,
  error: null,
  loadWorkspaceData: vi.fn(),
  addPerson: vi.fn(),
  updatePerson: vi.fn(),
  removePerson: vi.fn(),
  setBoards: vi.fn(),
  persistBoardAssignments: vi.fn(),
  addBoard: vi.fn(),
  updateBoard: vi.fn(),
  removeBoard: vi.fn(),
  saveSession: vi.fn(),
  recommendPairs: vi.fn(),
  saveCurrentAsTemplate: vi.fn(),
  applyTemplate: vi.fn(),
  subscribeToRealtime: vi.fn().mockReturnValue(vi.fn()),
} as unknown as ReturnType<typeof usePairingStore>);

const mockBoard: PairingBoard = {
  id: 'board-1',
  name: 'Phoenix',
  isExempt: false,
  sortOrder: 0,
  goals: ['Ship the board logic'],
};

const mockPeople: Person[] = [
  { id: '1', name: 'Alice Bob', avatarColorHex: '#f00' },
  { id: '2', name: 'Charlie Dave', avatarColorHex: '#0f0' },
];

describe('DroppableBoard Component', () => {
  it('renders board details correctly', () => {
    render(
      <DndContext>
        <DroppableBoard board={mockBoard} people={[]} />
      </DndContext>
    );

    // Board Name
    expect(screen.getByText('Phoenix')).toBeInTheDocument();
    // Board Goal
    expect(screen.getByText('Ship the board logic')).toBeInTheDocument();
  });

  it('renders people inside the board', () => {
    render(
      <DndContext>
        <DroppableBoard board={mockBoard} people={mockPeople} />
      </DndContext>
    );

    // Initials should be present
    expect(screen.getByText('AB')).toBeInTheDocument();
    expect(screen.getByText('CD')).toBeInTheDocument();
  });
});
