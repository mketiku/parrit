import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { DroppableBoard } from './DroppableBoard';
import type { PairingBoard, Person } from '../types';
import React from 'react';

const mockBoard: PairingBoard = {
  id: 'board-1',
  name: 'Phoenix',
  isExempt: false,
  goalText: 'Ship the board logic',
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
