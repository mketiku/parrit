import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PairingWorkspace } from './PairingWorkspace';
import React from 'react';
import { usePairingStore } from '../store/usePairingStore';
import { createBoard, createPerson } from '../../../test/factories';
import { createMockPairingStore } from '../../../test/mocks';

vi.mock('../store/usePairingStore');

const mockPeople = [
  createPerson({ id: '1', name: 'Alice Bob' }),
  createPerson({ id: '2', name: 'Charlie Dave' }),
];

const mockBoards = [
  createBoard({
    id: 'board-1',
    name: 'Phoenix',
    assignedPersonIds: ['1', '2'],
  }),
  createBoard({
    id: 'board-2',
    name: 'Macaw',
    assignedPersonIds: [],
  }),
];

describe('PairingWorkspace Component', () => {
  it('renders the unpaired pool and boards', () => {
    const mockStore = createMockPairingStore({
      people: mockPeople,
      boards: mockBoards,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(usePairingStore).mockImplementation((selector?: any) =>
      selector ? selector(mockStore) : mockStore
    );

    render(<PairingWorkspace />);

    // Check Unpaired pool
    expect(screen.getByText('Unpaired Pool')).toBeInTheDocument();
    // Names might appear twice due to the hidden BoardExportView
    expect(screen.getAllByText('Phoenix')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Macaw')[0]).toBeInTheDocument();
  });
});
