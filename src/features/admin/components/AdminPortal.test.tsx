/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { AdminPortal } from './AdminPortal';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { supabase } from '../../../lib/supabase';

vi.mock('../../auth/store/useAuthStore');
vi.mock('../../../lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}));

const mockWorkspaces = [
  {
    id: 'ws-1',
    email: 'team-a@parrit.com',
    created_at: '2024-01-01T00:00:00Z',
    last_sign_in_at: null,
    public_view_enabled: false,
    member_count: 3,
    board_count: 2,
  },
];

const mockFeedback = [
  {
    id: 'fb-1',
    created_at: '2024-03-01T10:00:00Z',
    user_id: 'user-abc123',
    type: 'bug',
    message: 'The save button does not work.',
    page: '/app',
    is_read: false,
  },
  {
    id: 'fb-2',
    created_at: '2024-03-02T12:00:00Z',
    user_id: null,
    type: 'idea',
    message: 'Add keyboard shortcuts.',
    page: '/app/team',
    is_read: false,
  },
];

describe('AdminPortal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({ isAdmin: true });
    (supabase.rpc as any).mockImplementation((fn: string) => {
      if (fn === 'admin_get_workspaces')
        return Promise.resolve({ data: mockWorkspaces, error: null });
      if (fn === 'admin_get_feedback')
        return Promise.resolve({ data: mockFeedback, error: null });
      return Promise.resolve({ data: [], error: null });
    });
  });

  it('shows restricted access for non-admins', () => {
    (useAuthStore as any).mockReturnValue({ isAdmin: false });
    render(<AdminPortal />);
    expect(screen.getByText('Restricted Access')).toBeInTheDocument();
  });

  it('shows the workspaces tab by default', async () => {
    render(<AdminPortal />);
    await waitFor(() => {
      expect(screen.getByText('t***@parrit.com')).toBeInTheDocument();
    });
  });

  it('switches to the feedback tab and loads submissions', async () => {
    render(<AdminPortal />);
    await waitFor(() => screen.getByText('t***@parrit.com'));

    fireEvent.click(screen.getByRole('button', { name: /feedback/i }));

    await waitFor(() => {
      expect(
        screen.getByText('The save button does not work.')
      ).toBeInTheDocument();
      expect(screen.getByText('Add keyboard shortcuts.')).toBeInTheDocument();
    });
  });

  it('shows the correct type badge for each feedback item', async () => {
    render(<AdminPortal />);
    await waitFor(() => screen.getByText('t***@parrit.com'));
    fireEvent.click(screen.getByRole('button', { name: /feedback/i }));

    await waitFor(() => {
      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(screen.getByText('Idea')).toBeInTheDocument();
    });
  });

  it('shows empty state when there is no feedback', async () => {
    (supabase.rpc as any).mockImplementation((fn: string) => {
      if (fn === 'admin_get_workspaces')
        return Promise.resolve({ data: mockWorkspaces, error: null });
      if (fn === 'admin_get_feedback')
        return Promise.resolve({ data: [], error: null });
      return Promise.resolve({ data: [], error: null });
    });

    render(<AdminPortal />);
    await waitFor(() => screen.getByText('t***@parrit.com'));
    fireEvent.click(screen.getByRole('button', { name: /feedback/i }));

    await waitFor(() => {
      expect(
        screen.getByText('No feedback submitted yet.')
      ).toBeInTheDocument();
    });
  });
});
