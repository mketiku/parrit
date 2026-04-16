/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicView } from './PublicView';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { supabase } from '../../../lib/supabase';
import { renderWithProviders } from '../../../test/utils';
import React from 'react';

const ROUTE = '/view/:shareToken';
const VALID_TOKEN = '550e8400-e29b-41d4-a716-446655440000';

// Mock child component to focus on PublicView logic
vi.mock('./WorkspaceDashboardDisplay', () => ({
  WorkspaceDashboardDisplay: () => <div data-testid="dashboard">Dashboard</div>,
}));

vi.mock('../../auth/store/useAuthStore');
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('PublicView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupAuth = (isAdmin: boolean, isLoading: boolean) => {
    vi.mocked(useAuthStore).mockImplementation((selector?: any) => {
      const state = { isAdmin, isLoading };
      return selector ? selector(state) : state;
    });
  };

  it('should show loading spinner while auth is resolving', () => {
    setupAuth(false, true);

    renderWithProviders(<PublicView />, {
      route: `/view/test-token`,
      path: ROUTE,
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show Access Restricted if workspace is private and user is not admin', async () => {
    setupAuth(false, false);

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { public_view_enabled: false, user_id: 'test-user' },
      }),
    });

    renderWithProviders(<PublicView />, {
      route: `/view/${VALID_TOKEN}`,
      path: ROUTE,
    });

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });
  });

  it('should bypass restriction and show data if user is an admin', async () => {
    setupAuth(true, false);

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { public_view_enabled: false, user_id: 'test-user' },
      }),
    });

    (supabase.rpc as any).mockResolvedValue({
      data: { people: [], boards: [] },
      error: null,
    });

    renderWithProviders(<PublicView />, {
      route: `/view/${VALID_TOKEN}`,
      path: ROUTE,
    });

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });

  it('should show Access Restricted for invalid share token format', async () => {
    setupAuth(false, false);

    renderWithProviders(<PublicView />, {
      route: `/view/invalid-token-format`,
      path: ROUTE,
    });

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('should show Access Restricted if settings for token are not found', async () => {
    setupAuth(false, false);

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    renderWithProviders(<PublicView />, {
      route: `/view/${VALID_TOKEN}`,
      path: ROUTE,
    });

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });
  });

  it('should fetch and display people and boards on success', async () => {
    setupAuth(false, false);

    const actualUserId = 'test-user-id';
    (supabase.from as any).mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle:
        table === 'workspace_settings'
          ? vi.fn().mockResolvedValue({
              data: { public_view_enabled: true, user_id: actualUserId },
            })
          : vi.fn(),
      then: (resolve: any) => {
        if (table === 'people')
          resolve({ data: [{ id: 'p1', name: 'Alice' }] });
        if (table === 'pairing_boards')
          resolve({ data: [{ id: 'b1', name: 'Board 1' }] });
        return Promise.resolve();
      },
    }));

    renderWithProviders(<PublicView />, {
      route: `/view/${VALID_TOKEN}`,
      path: ROUTE,
    });

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
    expect(supabase.from).toHaveBeenCalledWith('people');
    expect(supabase.from).toHaveBeenCalledWith('pairing_boards');
  });
});
