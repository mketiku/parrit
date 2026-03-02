import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { DraggablePerson } from './DraggablePerson';
import type { Person } from '../types';
import React from 'react';

const mockPerson: Person = {
  id: 'user-1',
  name: 'Michael Ketiku',
  avatarColorHex: '#6366f1',
};

describe('DraggablePerson Component', () => {
  it('renders the person initials correctly', () => {
    render(
      <DndContext>
        <DraggablePerson person={mockPerson} sourceId="unpaired" />
      </DndContext>
    );

    // Should render MK for Michael Ketiku
    expect(screen.getByText('MK')).toBeInTheDocument();
  });

  it('renders a tooltip/title with the full name', () => {
    render(
      <DndContext>
        <DraggablePerson person={mockPerson} sourceId="unpaired" />
      </DndContext>
    );

    // The button or container should have the full name as accessible title or aria-label
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Michael Ketiku'
    );
  });
});
