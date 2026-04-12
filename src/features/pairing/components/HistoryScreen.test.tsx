import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mocks
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../store/usePairingStore', () => {
  const state = {
    people: [{ id: 'p1', name: 'Alice', avatarColorHex: '#ff0000' }],
    boards: [],
    isLoading: false,
    setBoards: vi.fn(),
    exportWorkspace: vi.fn(),
    importWorkspace: vi.fn(),
  };
  const hook = vi.fn((selector) => (selector ? selector(state) : state));
  Object.assign(hook, {
    getState: vi.fn(() => state),
    setState: vi.fn(),
    subscribe: vi.fn(),
  });
  return { usePairingStore: hook };
});

vi.mock('../../auth/store/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user' },
    workspaceName: 'Test Workspace',
  })),
}));

vi.mock('../hooks/useHistoryAnalytics', () => ({
  useHistoryAnalytics: vi.fn(() => ({
    personStats: {},
    matrix: { personIds: [], personNames: {}, counts: {} },
    isLoading: false,
  })),
}));

vi.mock('../../../store/useToastStore', () => ({
  useToastStore: vi.fn(() => ({
    addToast: vi.fn(),
  })),
}));

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useParams: vi.fn(() => ({})),
}));

import { HistoryScreen } from './HistoryScreen';
import { supabase } from '../../../lib/supabase';

describe('HistoryScreen Component', () => {
  const mockSessions = [
    {
      id: 's1',
      session_date: '2024-03-01',
      created_at: '2024-03-01T10:00:00Z',
    },
    {
      id: 's2',
      session_date: '2024-01-01',
      created_at: '2024-01-01T09:30:00Z',
    },
  ];
  const mockHistory = [
    {
      id: 'h1',
      session_id: 's1',
      person_id: 'p1',
      person_name: 'Alice',
      board_name: 'Board 1',
      avatar_color: '#ff0000',
      created_at: '2024-03-01T10:00:00Z',
      people: { name: 'Alice', avatar_color_hex: '#ff0000' },
      pairing_boards: { name: 'Board 1' },
    },
  ];

  type QueryResult<T> = {
    data: T;
    error: null;
  };

  interface MockChain<T> {
    select: (...args: unknown[]) => MockChain<T>;
    order: (...args: unknown[]) => MockChain<T>;
    limit: (...args: unknown[]) => MockChain<T>;
    in: (...args: unknown[]) => MockChain<T>;
    eq: (...args: unknown[]) => MockChain<T>;
    update: (...args: unknown[]) => MockChain<T>;
    delete: (...args: unknown[]) => MockChain<T>;
    single: (...args: unknown[]) => MockChain<T>;
    then: (onFulfilled: (value: QueryResult<T>) => unknown) => Promise<unknown>;
  }

  const createMockChain = <T,>(data: T): MockChain<T> => {
    const chain: MockChain<T> = {
      select: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      in: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      update: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      single: vi.fn(() => chain),
      then: vi.fn((onFulfilled) =>
        Promise.resolve({ data, error: null }).then(onFulfilled)
      ),
    };
    return chain;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pairing_sessions') return createMockChain(mockSessions);
      if (table === 'pairing_history') return createMockChain(mockHistory);
      return createMockChain([]);
    });
  });

  it('renders and displays sessions', async () => {
    render(<HistoryScreen />);
    expect(await screen.findByText(/Mar 1st, 2024/i)).toBeInTheDocument();
  });

  it('renders session with details correctly', async () => {
    render(<HistoryScreen />);
    const sessionBtn = await screen.findByRole('button', {
      name: /View details for session on Mar 1st, 2024/i,
    });
    fireEvent.click(sessionBtn);
    expect(await screen.findByText(/Workspace Snapshot/i)).toBeInTheDocument();
  });

  it('toggles history insights visibility', async () => {
    render(<HistoryScreen />);
    const insightsToggle = await screen.findByRole('button', {
      name: /show insights/i,
    });
    fireEvent.click(insightsToggle);
    expect(await screen.findByText(/pairing heatmap/i)).toBeInTheDocument();
  });

  it('allows bulk selecting and deselecting all sessions', async () => {
    render(<HistoryScreen />);

    const selectAllBtn = await screen.findByRole('button', {
      name: /select all/i,
    });
    fireEvent.click(selectAllBtn);

    const deselectAllBtn = await screen.findByRole('button', {
      name: /deselect all/i,
    });
    fireEvent.click(deselectAllBtn);

    expect(screen.queryByText(/Delete Selected/i)).not.toBeInTheDocument();
  });

  it('enables bulk delete button when sessions are selected', async () => {
    render(<HistoryScreen />);
    const checkboxes = await screen.findAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(
      await screen.findByRole('button', { name: /Delete \(1\)/i })
    ).toBeInTheDocument();
  });

  it('renders history entries in details view', async () => {
    render(<HistoryScreen />);
    const sessionBtn = await screen.findByRole('button', {
      name: /View details for session on Mar 1st, 2024/i,
    });
    fireEvent.click(sessionBtn);
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getAllByText('Board 1').length).toBeGreaterThan(0);
  });
});
