/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PairingWorkspace } from './PairingWorkspace';
import { usePairingStore } from '../store/usePairingStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { useTutorialStore } from '../store/useTutorialStore';
import { useHistoryAnalytics } from '../hooks/useHistoryAnalytics';
import { useToastStore } from '../../../store/useToastStore';
import React from 'react';

// Mocks
vi.mock('../store/usePairingStore');
vi.mock('../../auth/store/useAuthStore');
vi.mock('../../../store/useWorkspacePrefsStore');
vi.mock('../store/useTutorialStore');
vi.mock('../hooks/useHistoryAnalytics');
vi.mock('../../../store/useToastStore');
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,...'),
}));
vi.mock('@floating-ui/react-dom', () => ({
  useFloating: () => ({
    x: 0,
    y: 0,
    strategy: 'absolute',
    refs: { setReference: vi.fn(), setFloating: vi.fn() },
  }),
  offset: vi.fn(),
  flip: vi.fn(),
  shift: vi.fn(),
  autoUpdate: vi.fn(),
}));

describe('PairingWorkspace Component', () => {
  const mockAddBoard = vi.fn();
  const mockSaveSession = vi.fn();
  const mockRecommendPairs = vi.fn();
  const mockStartTutorial = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddBoard.mockResolvedValue(undefined);

    const mockState = {
      people: [
        { id: 'p1', name: 'Alice', boardId: null },
        { id: 'p2', name: 'Bob', boardId: 'b1' },
      ],
      boards: [
        {
          id: 'b1',
          name: 'Board 1',
          assignedPeopleIds: ['p2'],
          goals: [],
          isExempt: false,
          isLocked: false,
        },
      ],
      addBoard: mockAddBoard,
      saveSession: mockSaveSession,
      recommendPairs: mockRecommendPairs,
      isLoading: false,
      isSaving: false,
      isRecommending: false,
      setBoards: vi.fn(),
      moveBoard: vi.fn(),
    };

    (usePairingStore as any).mockImplementation((selector: any) =>
      selector ? selector(mockState) : mockState
    );

    (useAuthStore as any).mockReturnValue({
      isAdmin: true,
      workspaceName: 'Test',
    });
    (useWorkspacePrefsStore as any).mockReturnValue({
      hintGoalsSeen: true,
      gettingStartedDismissed: true,
      showFullName: true,
    });
    (useTutorialStore as any).mockReturnValue({
      startTutorial: mockStartTutorial,
      isActive: false,
      currentStepIndex: 0,
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      exitTutorial: vi.fn(),
      steps: [],
    });
    (useHistoryAnalytics as any).mockReturnValue({
      matrix: { personIds: [], personNames: {}, counts: {} },
      sessionCount: 0,
      isLoading: false,
      refreshHistory: vi.fn(),
    });
    (useToastStore as any).mockReturnValue({
      addToast: vi.fn(),
    });
  });

  it('renders the workspace with boards and available pool', () => {
    render(<PairingWorkspace />);
    expect(screen.getByText('Board 1')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('calls saveSession when clicking primary action', () => {
    render(<PairingWorkspace />);
    const saveButton = screen.getByText(/Save Session/i);
    fireEvent.click(saveButton);
    expect(mockSaveSession).toHaveBeenCalled();
  });

  it('calls recommendPairs when clicking recommend pairs', () => {
    render(<PairingWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: /recommend pairs/i }));

    expect(mockRecommendPairs).toHaveBeenCalled();
  });

  it('creates a new exempt board from the add board form', async () => {
    render(<PairingWorkspace />);

    fireEvent.click(
      screen.getByRole('button', { name: /add new pairing board/i })
    );
    fireEvent.change(screen.getByPlaceholderText(/board name/i), {
      target: { value: 'Platform' },
    });
    fireEvent.click(screen.getByLabelText(/exempt/i));
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    expect(mockAddBoard).toHaveBeenCalledWith('Platform', true);
    expect(
      await screen.findByRole('button', { name: /add new pairing board/i })
    ).toBeInTheDocument();
  });

  it('starts the tutorial from the help button', () => {
    render(<PairingWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: /help & tutorial/i }));

    expect(mockStartTutorial).toHaveBeenCalled();
  });
});
