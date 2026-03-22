/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicView } from './PublicView';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { supabase } from '../../../lib/supabase';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

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
    setupAuth(false, true); // Admin=false, Loading=true

    render(
      <MemoryRouter initialEntries={['/view/test-token']}>
        <Routes>
          <Route path="/view/:shareToken" element={<PublicView />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show Access Restricted if workspace is private and user is not admin', async () => {
    setupAuth(false, false); // Not admin, not loading

    // Mock private settings
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { public_view_enabled: false, user_id: 'test-user' },
      }),
    });

    render(
      <MemoryRouter
        initialEntries={['/view/550e8400-e29b-41d4-a716-446655440000']}
      >
        <Routes>
          <Route path="/view/:shareToken" element={<PublicView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });
  });

  it('should bypass restriction and show data if user is an admin', async () => {
    setupAuth(true, false); // IS ADMIN, not loading

    // Mock private settings
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { public_view_enabled: false, user_id: 'test-user' },
      }),
    });

    // Mock successful RPC for admin data
    (supabase.rpc as any).mockResolvedValue({
      data: { people: [], boards: [] },
      error: null,
    });

    render(
      <MemoryRouter
        initialEntries={['/view/550e8400-e29b-41d4-a716-446655440000']}
      >
        <Routes>
          <Route path="/view/:shareToken" element={<PublicView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    // Ensure we used the admin data RPC
    expect(supabase.rpc).toHaveBeenCalledWith(
      'admin_get_workspace_data',
      expect.anything()
    );
  });
});
