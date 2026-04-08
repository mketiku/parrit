import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PairingWorkspace } from './PairingWorkspace';
import { usePairingStore } from '../store/usePairingStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { useHistoryAnalytics } from '../hooks/useHistoryAnalytics';
import React from 'react';

// Mock all the hooks and stores
vi.mock('../store/usePairingStore', () => ({
  usePairingStore: vi.fn(),
}));
vi.mock('../../auth/store/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('../../../store/useWorkspacePrefsStore', () => ({
  useWorkspacePrefsStore: vi.fn(),
}));
vi.mock('../hooks/useHistoryAnalytics', () => ({
  useHistoryAnalytics: vi.fn(),
}));
vi.mock('../store/useTutorialStore', () => ({
  useTutorialStore: vi.fn(() => ({ startTutorial: vi.fn() })),
}));

// Mock components that are heavy or irrelevant to the logic
vi.mock('./DroppableBoard', () => ({ DroppableBoard: () => null }));
vi.mock('./DraggablePerson', () => ({ DraggablePerson: () => null }));
vi.mock('../../../components/ui/FeatherBurst', () => ({
  FeatherBurst: () => <div data-testid="feather-burst" />,
}));

describe('PairingWorkspace - Celebration Triggers', () => {
  const mockPeople = [{ id: 'p1', name: 'Alice' }];
  const mockBoards = [
    { id: 'b1', name: 'Board 1', assignedPersonIds: [], isExempt: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      workspaceName: 'test',
    });
    (
      useWorkspacePrefsStore as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({});
    (
      useHistoryAnalytics as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      matrix: {},
      sessionCount: 0,
      isLoading: false,
      refreshHistory: vi.fn(),
    });
  });

  it('does NOT trigger celebration on initial mount even if pool is empty', () => {
    // Setup state where pool is empty immediately (Alice is on Board 1)
    const boardsWithAlice = [
      { id: 'b1', name: 'Board 1', assignedPersonIds: ['p1'], isExempt: false },
    ];

    (usePairingStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: unknown) => unknown) =>
        selector({
          people: mockPeople,
          boards: boardsWithAlice,
          isLoading: false,
          isSaving: false,
          isRecommending: false,
        })
    );

    render(<PairingWorkspace />);

    expect(screen.queryByTestId('feather-burst')).not.toBeInTheDocument();
  });

  it('triggers celebration when pool becomes empty after being non-empty', () => {
    // 1. Start with non-empty pool
    (usePairingStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: unknown) => unknown) =>
        selector({
          people: mockPeople,
          boards: mockBoards, // Alice is not assigned
          isLoading: false,
          isSaving: false,
          isRecommending: false,
        })
    );

    const { rerender } = render(<PairingWorkspace />);
    expect(screen.queryByTestId('feather-burst')).not.toBeInTheDocument();

    // 2. Assign Alice to Board 1
    const boardsWithAlice = [
      { id: 'b1', name: 'Board 1', assignedPersonIds: ['p1'], isExempt: false },
    ];
    (usePairingStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: unknown) => unknown) =>
        selector({
          people: mockPeople,
          boards: boardsWithAlice,
          isLoading: false,
          isSaving: false,
          isRecommending: false,
        })
    );

    rerender(<PairingWorkspace />);

    expect(screen.getByTestId('feather-burst')).toBeInTheDocument();
  });
});
