import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryScreen } from './HistoryScreen';
import React from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { usePairingStore } from '../store/usePairingStore';
import { useHistoryAnalytics } from '../hooks/useHistoryAnalytics';
import { useToastStore } from '../../../store/useToastStore';

// Mocks
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../../auth/store/useAuthStore');
vi.mock('../store/usePairingStore');
vi.mock('../hooks/useHistoryAnalytics');
vi.mock('../../../store/useToastStore');

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('HistoryScreen Component', () => {
  const mockSessions = [
    {
      id: 's1',
      session_date: '2024-03-01',
      created_at: '2024-03-01T10:00:00Z',
    },
    {
      id: 's2',
      session_date: '2024-02-28',
      created_at: '2024-02-28T09:30:00Z',
    },
  ];
  const mockAddToast = vi.fn();

  const createMockChain = (data: unknown = []) => {
    const queryData = Array.isArray(data) ? data : [data];
    const chain: Record<string, unknown> = {
      select: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn((count?: number) =>
        Promise.resolve({
          data:
            typeof count === 'number' ? queryData.slice(0, count) : queryData,
          error: null,
        })
      ),
      in: vi.fn(() => Promise.resolve({ data: queryData, error: null })),
      eq: vi.fn(() => Promise.resolve({ data: queryData, error: null })),
      then: vi.fn((onFulfilled: (val: unknown) => unknown) =>
        Promise.resolve({ data: queryData, error: null }).then(onFulfilled)
      ),
    };
    return chain;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Auth
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'test-user' },
      workspaceName: 'Test Workspace',
    } as unknown as ReturnType<typeof useAuthStore>);

    // Mock Pairing Store
    vi.mocked(usePairingStore).mockReturnValue({
      people: [],
      boards: [],
      isLoading: false,
    } as unknown as ReturnType<typeof usePairingStore>);

    // Mock Analytics
    vi.mocked(useHistoryAnalytics).mockReturnValue({
      personStats: {},
      matrix: { personIds: [], personNames: {}, counts: {} },
      isLoading: false,
    } as unknown as ReturnType<typeof useHistoryAnalytics>);

    // Mock Toast
    vi.mocked(useToastStore).mockReturnValue({
      addToast: mockAddToast,
    } as unknown as ReturnType<typeof useToastStore>);

    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === 'pairing_sessions') return createMockChain(mockSessions);
        return createMockChain([]);
      }
    );
  });

  it('renders and displays sessions', async () => {
    render(<HistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Mar 1st, 2024/i)).toBeInTheDocument();
    });
  });

  it('handles snapshot date update correctly', async () => {
    render(<HistoryScreen />);

    await waitFor(() => screen.getByText(/Mar 1st, 2024/i));

    // Click session to select
    fireEvent.click(screen.getByText(/Mar 1st, 2024/i));

    // Click Edit Date/Time
    const editBtn = await screen.findByTitle(/Edit Date\/Time/i);
    fireEvent.click(editBtn);

    // Mock the update response
    const mockUpdateChain: Record<string, unknown> = {
      eq: vi.fn(() => mockUpdateChain),
      select: vi.fn(() =>
        Promise.resolve({
          data: [
            { id: 's1', session_date: '2024-03-02', created_at: 'new-ts' },
          ],
          error: null,
        })
      ),
    };

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn(() => mockUpdateChain),
    } as unknown as ReturnType<typeof supabase.from>);

    // Click Save
    const saveBtn = screen.getByText(/^Save$/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringMatching(/Session updated/i),
        'success'
      );
    });
  });

  it('shows error if snapshot date update returns no data (RLS blocked)', async () => {
    render(<HistoryScreen />);

    await waitFor(() => screen.getByText(/Mar 1st, 2024/i));

    // Select and click edit
    fireEvent.click(screen.getByText(/Mar 1st, 2024/i));
    const editBtn = await screen.findByTitle(/Edit Date\/Time/i);
    fireEvent.click(editBtn);

    // Mock an update that returns no data
    const mockUpdateChain: Record<string, unknown> = {
      eq: vi.fn(() => mockUpdateChain),
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    };

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn(() => mockUpdateChain),
    } as unknown as ReturnType<typeof supabase.from>);

    // Click Save
    const saveBtn = screen.getByText(/^Save$/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringMatching(/Failed to update session/i),
        'error'
      );
    });
  });

  it('toggles history insights visibility', async () => {
    render(<HistoryScreen />);

    const insightsToggle = await screen.findByRole('button', {
      name: /show insights/i,
    });
    fireEvent.click(insightsToggle);

    expect(
      screen.getByRole('button', { name: /hide insights/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/pairing heatmap/i)).toBeInTheDocument();
  });

  it('loads older snapshots when requested', async () => {
    const manySessions = Array.from({ length: 8 }, (_, idx) => ({
      id: `s${idx + 1}`,
      session_date: `2024-03-${String(20 - idx).padStart(2, '0')}`,
      created_at: `2024-03-${String(20 - idx).padStart(2, '0')}T10:00:00Z`,
    }));

    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === 'pairing_sessions') return createMockChain(manySessions);
        return createMockChain([]);
      }
    );

    render(<HistoryScreen />);

    const loadMoreButton = await screen.findByRole('button', {
      name: /\+ load older snapshots/i,
    });
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText(/mar 13th, 2024/i)).toBeInTheDocument();
    });
  });

  it('bulk deletes selected sessions and shows success toast', async () => {
    const deleteIn = vi.fn(() => Promise.resolve({ error: null }));
    const deleteEq = vi.fn(() => Promise.resolve({ error: null }));

    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === 'pairing_sessions') {
          const query = createMockChain(mockSessions);
          return {
            ...query,
            delete: vi.fn(() => ({
              in: deleteIn,
              eq: deleteEq,
            })),
          } as unknown as ReturnType<typeof supabase.from>;
        }
        return createMockChain([]);
      }
    );

    render(<HistoryScreen />);

    const selectAllButton = await screen.findByRole('button', {
      name: /select all sessions/i,
    });
    fireEvent.click(selectAllButton);
    fireEvent.click(screen.getByRole('button', { name: /delete \(2\)/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete forever/i }));

    await waitFor(() => {
      expect(deleteIn).toHaveBeenCalledWith('id', ['s1', 's2']);
      expect(mockAddToast).toHaveBeenCalledWith(
        '2 sessions deleted',
        'success'
      );
    });
  });
});
