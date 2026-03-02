import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from './AppLayout';
import React from 'react';
import { useAuthStore } from '../../features/auth/store/useAuthStore';

vi.mock('../../features/auth/store/useAuthStore');
vi.mocked(useAuthStore).mockReturnValue({
  user: {
    id: 'test',
    email: 'test@example.com',
  } as unknown as import('@supabase/supabase-js').User,
  session: null,
  workspaceName: 'test',
  isLoading: false,
  initialize: vi.fn(),
  signOut: vi.fn(),
});

describe('AppLayout Component', () => {
  it('renders the header with logo and navigation links', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    // Assert logo/branding is present
    expect(screen.getAllByText(/Parrit/i)[0]).toBeInTheDocument();

    // Assert navigation items are present based on UI design
    expect(
      screen.getByRole('link', { name: /Dashboard/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Team/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument();
  });

  it('renders a main content area for children routes', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    // Role 'main' should be there for a semantic html layout
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
