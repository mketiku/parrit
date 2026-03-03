import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { DroppableBoard } from './DroppableBoard';
import type { PairingBoard, Person } from '../types';
import React from 'react';
import { usePairingStore } from '../store/usePairingStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';

// Mocks
vi.mock('../store/usePairingStore');
vi.mock('../../../store/useWorkspacePrefsStore');

const mockUsePairingStore = vi.mocked(usePairingStore);
const mockUseWorkspacePrefsStore = vi.mocked(useWorkspacePrefsStore);

const defaultStoreValues = {
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
  rotateBoardPair: vi.fn(),
  subscribeToRealtime: vi.fn().mockReturnValue(vi.fn()),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const defaultPrefsValues = {
  stalePairHighlightingEnabled: false,
};

mockUsePairingStore.mockReturnValue(defaultStoreValues);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockUseWorkspacePrefsStore.mockReturnValue(defaultPrefsValues as any);

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

    expect(screen.getByText('Phoenix')).toBeInTheDocument();
    expect(screen.getByText('Ship the board logic')).toBeInTheDocument();
  });

  it('renders people inside the board', () => {
    render(
      <DndContext>
        <DroppableBoard board={mockBoard} people={mockPeople} />
      </DndContext>
    );

    expect(screen.getByText('AB')).toBeInTheDocument();
    expect(screen.getByText('CD')).toBeInTheDocument();
  });

  it('shows Off-Duty label when exempt', () => {
    const exemptBoard = { ...mockBoard, isExempt: true };
    render(
      <DndContext>
        <DroppableBoard board={exemptBoard} people={[]} />
      </DndContext>
    );

    expect(screen.getByText('Off-Duty')).toBeInTheDocument();
  });

  it('triggers rotateBoardPair when rotate button is clicked', () => {
    render(
      <DndContext>
        <DroppableBoard board={mockBoard} people={mockPeople} />
      </DndContext>
    );

    const rotateBtn = screen.getByTitle(/Rotate pair/i);
    fireEvent.click(rotateBtn);
    expect(defaultStoreValues.rotateBoardPair).toHaveBeenCalledWith(
      mockBoard.id
    );
  });
});
