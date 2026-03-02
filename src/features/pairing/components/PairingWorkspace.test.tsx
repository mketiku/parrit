import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PairingWorkspace } from './PairingWorkspace';
import React from 'react';
import { usePairingStore } from '../store/usePairingStore';

vi.mock('../store/usePairingStore');

const mockPeople = [
  { id: '1', name: 'Alice Bob', avatarColorHex: '#6366f1' },
  { id: '2', name: 'Charlie Dave', avatarColorHex: '#ec4899' },
];

const mockBoards = [
  {
    id: 'board-1',
    name: 'Phoenix',
    isExempt: false,
    assignedPersonIds: ['1', '2'],
  },
  { id: 'board-2', name: 'Macaw', isExempt: false, assignedPersonIds: [] },
];

describe('PairingWorkspace Component', () => {
  it('renders the unpaired pool and boards', () => {
    vi.mocked(usePairingStore).mockReturnValue({
      people: mockPeople,
      boards: mockBoards,
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
    });

    render(<PairingWorkspace />);

    // Check Unpaired pool
    expect(screen.getByText('Unpaired Pool')).toBeInTheDocument();
    expect(screen.getByText('Phoenix')).toBeInTheDocument();
    expect(screen.getByText('Macaw')).toBeInTheDocument();
  });
});
