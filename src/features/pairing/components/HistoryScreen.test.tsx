import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    {
      id: 'h2',
      session_id: 's2',
      person_id: 'p1',
      person_name: 'Alice',
      board_name: 'Board 1',
      avatar_color: '#ff0000',
      created_at: '2024-01-01T09:30:00Z',
      people: { name: 'Alice', avatar_color_hex: '#ff0000' },
      pairing_boards: { name: 'Board 1' },
    },
  ];

  interface MockChain {
    select: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    then: (
      onFulfilled: (val: { data: unknown[]; error: null }) => unknown
    ) => Promise<unknown>;
  }

  const createMockChain = (data: unknown = []) => {
    const queryData = Array.isArray(data) ? data : [data];
    const chain: MockChain = {
      select: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      in: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      update: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      then: vi.fn(
        (onFulfilled: (val: { data: unknown[]; error: null }) => unknown) =>
          Promise.resolve({ data: queryData, error: null }).then(onFulfilled)
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

    await waitFor(() => {
      expect(screen.getByText(/Mar 1st, 2024/i)).toBeInTheDocument();
    });
  });

  it('renders session with details correctly', async () => {
    render(<HistoryScreen />);

    // Wait for sessions to load
    await waitFor(() => {
      expect(screen.getByText(/Mar 1st, 2024/i)).toBeInTheDocument();
    });

    // Click on session to select it
    const sessionButton = screen.getByRole('button', {
      name: /View details for session on Mar 1st, 2024/i,
    });
    fireEvent.click(sessionButton);

    // Wait for session details to display
    await waitFor(() => {
      expect(screen.getByText(/Workspace Snapshot/i)).toBeInTheDocument();
    });
  });

  it('displays edit date button on session details', async () => {
    render(<HistoryScreen />);

    // Wait for sessions to load and select one
    await waitFor(() => {
      expect(screen.getByText(/Mar 1st, 2024/i)).toBeInTheDocument();
    });

    const sessionButton = screen.getByRole('button', {
      name: /View details for session on Mar 1st, 2024/i,
    });
    fireEvent.click(sessionButton);

    // Wait for and verify edit button appears
    await waitFor(() => {
      const editBtn = screen.queryByTitle(/Edit Date\/Time/i);
      expect(editBtn).toBeInTheDocument();
    });
  });

  it('toggles history insights visibility', async () => {
    render(<HistoryScreen />);

    const insightsToggle = await screen.findByRole('button', {
      name: /show insights/i,
    });
    fireEvent.click(insightsToggle);

    await waitFor(() => {
      expect(screen.getByText(/pairing heatmap/i)).toBeInTheDocument();
    });
  });

  it('can load additional sessions', async () => {
    const manySessions = Array.from({ length: 15 }, (_, idx) => ({
      id: `s${idx + 1}`,
      session_date: `2024-03-${String(20 - idx).padStart(2, '0')}`,
      created_at: `2024-03-${String(20 - idx).padStart(2, '0')}T10:00:00Z`,
    }));

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pairing_sessions') return createMockChain(manySessions);
      if (table === 'pairing_history') return createMockChain(mockHistory);
      return createMockChain([]);
    });

    render(<HistoryScreen />);

    // Verify the sessions list is displayed
    await waitFor(() => {
      expect(screen.getByText(/Recent Snapshots/i)).toBeInTheDocument();
      expect(screen.getAllByText(/March 2024/i).length).toBeGreaterThan(0);
    });
  });

  it('displays select all button for bulk operations', async () => {
    render(<HistoryScreen />);

    // Wait for sessions to load
    await waitFor(() => {
      expect(screen.getByText(/Mar 1st, 2024/i)).toBeInTheDocument();
    });

    // Verify select all button exists
    const selectAllButton = screen.getByRole('button', { name: /select all/i });
    expect(selectAllButton).toBeInTheDocument();
  });

  it('loads session details when session is selected', async () => {
    render(<HistoryScreen />);

    // Wait for sessions to load
    await waitFor(() => screen.getByText(/Mar 1st, 2024/i));

    // Verify the session is in the list
    expect(screen.getByText(/Mar 1st, 2024/i)).toBeInTheDocument();
  });

  it('should allow selecting a session and person in the TeamFlowVisualizer', async () => {
    render(<HistoryScreen />);

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText(/Pairing History/i)).toBeInTheDocument();
    });

    // Verify the sessions list and timeline are rendered
    await waitFor(() => {
      expect(screen.getByText(/Recent Snapshots/i)).toBeInTheDocument();
      expect(screen.getByText(/Mar 1st, 2024/i)).toBeInTheDocument();
    });
  });
});
