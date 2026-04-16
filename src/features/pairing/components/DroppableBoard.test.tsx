import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { DroppableBoard } from './DroppableBoard';
import React from 'react';
import { usePairingStore } from '../store/usePairingStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { useToastStore } from '../../../store/useToastStore';
import { createBoard, createPerson } from '../../../test/factories';
import {
  createMockPairingStore,
  createMockWorkspacePrefsStore,
} from '../../../test/mocks';

// Mocks
vi.mock('../store/usePairingStore');
vi.mock('../../../store/useWorkspacePrefsStore');
vi.mock('../../../store/useToastStore');

const mockUsePairingStore = vi.mocked(usePairingStore);
const mockUseWorkspacePrefsStore = vi.mocked(useWorkspacePrefsStore);
const mockUseToastStore = vi.mocked(useToastStore);

const defaultStoreValues = createMockPairingStore();
const mockAddToast = vi.fn();

describe('DroppableBoard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToastStore.mockReturnValue({
      addToast: mockAddToast,
    } as unknown as ReturnType<typeof useToastStore>);
  });

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

  it('cancels renaming when Escape is pressed', async () => {
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
    fireEvent.change(input, { target: { value: 'Changed' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByDisplayValue('Changed')).not.toBeInTheDocument();
    expect(screen.getByText('Phoenix')).toBeInTheDocument();
  });

  it('cancels delete after showing confirmation', async () => {
    mockUsePairingStore.mockReturnValue(defaultStoreValues);
    mockUseWorkspacePrefsStore.mockReturnValue(createMockWorkspacePrefsStore());

    const mockBoard = createBoard({ id: 'board-1', name: 'Phoenix' });

    render(
      <DndContext>
        <DroppableBoard board={mockBoard} people={[]} />
      </DndContext>
    );

    fireEvent.click(screen.getByTitle(/delete board/i));
    expect(screen.getByText(/Delete Board\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/Delete Board\?/i)).not.toBeInTheDocument();
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

  it('saves goals on blur and shows a toast', async () => {
    mockUsePairingStore.mockReturnValue(defaultStoreValues);
    mockUseWorkspacePrefsStore.mockReturnValue(createMockWorkspacePrefsStore());

    const mockBoard = createBoard({ id: 'board-1', goals: [] });

    render(
      <DndContext>
        <DroppableBoard board={mockBoard} people={[]} />
      </DndContext>
    );

    fireEvent.click(screen.getByRole('button', { name: /add board focus/i }));

    const textarea = screen.getByPlaceholderText(
      /what is this pair working on/i
    );
    fireEvent.change(textarea, { target: { value: 'Ship alerts\nFix auth' } });
    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(defaultStoreValues.updateBoard).toHaveBeenCalledWith('board-1', {
        goals: ['Ship alerts', 'Fix auth'],
      });
      expect(mockAddToast).toHaveBeenCalledWith('Goals updated', 'success');
    });
  });

  it('shows stale pair banner when a repeated pairing crosses the threshold', () => {
    mockUsePairingStore.mockReturnValue(
      createMockPairingStore({
        pairRecency: { 'person-a:person-b': 4 },
      })
    );
    mockUseWorkspacePrefsStore.mockReturnValue(
      createMockWorkspacePrefsStore({ stalePairHighlightingEnabled: true })
    );

    const mockBoard = createBoard({ id: 'board-1' });
    const mockPeople = [
      createPerson({ id: 'person-a', name: 'Alice' }),
      createPerson({ id: 'person-b', name: 'Bob' }),
    ];

    render(
      <DndContext>
        <DroppableBoard board={mockBoard} people={mockPeople} />
      </DndContext>
    );

    expect(
      screen.getByText(/stale pair — consider rotating/i)
    ).toBeInTheDocument();
  });

  it('removes the board after delete confirmation', async () => {
    mockUsePairingStore.mockReturnValue(defaultStoreValues);
    mockUseWorkspacePrefsStore.mockReturnValue(createMockWorkspacePrefsStore());

    const mockBoard = createBoard({ id: 'board-1', name: 'Phoenix' });

    render(
      <DndContext>
        <DroppableBoard board={mockBoard} people={[]} />
      </DndContext>
    );

    fireEvent.click(screen.getByTitle(/delete board/i));
    fireEvent.click(
      screen.getAllByRole('button', { name: /^delete board$/i })[1]
    );

    await waitFor(() => {
      expect(defaultStoreValues.removeBoard).toHaveBeenCalledWith('board-1');
    });
  });
});
