import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { DroppableBoard } from './DroppableBoard';
import React from 'react';
import { usePairingStore } from '../store/usePairingStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { createBoard, createPerson } from '../../../test/factories';
import {
  createMockPairingStore,
  createMockWorkspacePrefsStore,
} from '../../../test/mocks';

// Mocks
vi.mock('../store/usePairingStore');
vi.mock('../../../store/useWorkspacePrefsStore');

const mockUsePairingStore = vi.mocked(usePairingStore);
const mockUseWorkspacePrefsStore = vi.mocked(useWorkspacePrefsStore);

const defaultStoreValues = createMockPairingStore();

describe('DroppableBoard Component', () => {
  it('renders board name and goals', () => {
    mockUsePairingStore.mockReturnValue(defaultStoreValues);
    mockUseWorkspacePrefsStore.mockReturnValue(createMockWorkspacePrefsStore());

    const mockBoard = createBoard({
      name: 'Phoenix',
      goals: ['Ship the board logic'],
    });

    render(
      <DndContext>
        <DroppableBoard board={mockBoard} people={[]} />
      </DndContext>
    );

    expect(screen.getByText('Phoenix')).toBeInTheDocument();
    expect(screen.getByText('Ship the board logic')).toBeInTheDocument();
  });

  it('renders assigned people full names by default', () => {
    mockUsePairingStore.mockReturnValue(defaultStoreValues);
    mockUseWorkspacePrefsStore.mockReturnValue(
      createMockWorkspacePrefsStore({ showFullName: true })
    );

    const mockBoard = createBoard({ id: 'board-1' });
    const mockPeople = [
      createPerson({ name: 'Alice Bob' }),
      createPerson({ name: 'Charlie Dave' }),
    ];

    render(
      <DndContext>
        <DroppableBoard board={mockBoard} people={mockPeople} />
      </DndContext>
    );

    expect(screen.getByText('Alice Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie Dave')).toBeInTheDocument();
  });

  it('renders assigned people initials when showFullName is false', () => {
    mockUsePairingStore.mockReturnValue(defaultStoreValues);
    mockUseWorkspacePrefsStore.mockReturnValue(
      createMockWorkspacePrefsStore({ showFullName: false })
    );

    const mockBoard = createBoard({ id: 'board-1' });
    const mockPeople = [
      createPerson({ name: 'Alice Bob' }),
      createPerson({ name: 'Charlie Dave' }),
    ];

    render(
      <DndContext>
        <DroppableBoard board={mockBoard} people={mockPeople} />
      </DndContext>
    );

    expect(screen.getByText('AB')).toBeInTheDocument();
    expect(screen.getByText('CD')).toBeInTheDocument();
  });

  it('calls updateBoard when editing name', async () => {
    mockUsePairingStore.mockReturnValue(defaultStoreValues);
    mockUseWorkspacePrefsStore.mockReturnValue(createMockWorkspacePrefsStore());

    const mockBoard = createBoard({ id: 'board-1', name: 'Phoenix' });

    render(
      <DndContext>
        <DroppableBoard board={mockBoard} people={[]} />
      </DndContext>
    );

    const editButton = screen.getByTitle('Rename board');
    fireEvent.click(editButton);

    const input = screen.getByDisplayValue('Phoenix');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(defaultStoreValues.updateBoard).toHaveBeenCalledWith('board-1', {
        name: 'New Name',
      });
    });
  });

  it('calls updateBoard when toggling lock status', () => {
    mockUsePairingStore.mockReturnValue(defaultStoreValues);
    mockUseWorkspacePrefsStore.mockReturnValue(createMockWorkspacePrefsStore());

    const mockBoard = createBoard({ id: 'board-1', isLocked: false });

    render(
      <DndContext>
        <DroppableBoard board={mockBoard} people={[]} />
      </DndContext>
    );

    const lockButton = screen.getByTitle(/Lock board assignments/i);
    fireEvent.click(lockButton);

    expect(defaultStoreValues.updateBoard).toHaveBeenCalledWith('board-1', {
      isLocked: true,
    });
  });

  it('calls updateBoard when toggling exempt status', () => {
    mockUsePairingStore.mockReturnValue(defaultStoreValues);
    mockUseWorkspacePrefsStore.mockReturnValue(createMockWorkspacePrefsStore());

    const mockBoard = createBoard({ id: 'board-1', isExempt: false });

    render(
      <DndContext>
        <DroppableBoard board={mockBoard} people={[]} />
      </DndContext>
    );

    const exemptButton = screen.getByTitle(/Mark as Out of Office \/ Exempt/i);
    fireEvent.click(exemptButton);

    expect(defaultStoreValues.updateBoard).toHaveBeenCalledWith('board-1', {
      isExempt: true,
    });
  });
});
