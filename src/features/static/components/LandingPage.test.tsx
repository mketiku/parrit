/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LandingPage } from './LandingPage';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock the auth store
vi.mock('../../auth/store/useAuthStore');

describe('LandingPage Component', { timeout: 10000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      user: null,
      workspaceName: '',
    });
  });

  it('renders landing page for guest users', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText(/Create a Workspace/i).length).toBeGreaterThan(
      0
    );
  });

  it('renders landing page for logged in users', () => {
    (useAuthStore as any).mockReturnValue({
      user: { id: 'test-user' },
      workspaceName: 'Acme',
    });

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/Acme/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter the Flock/i)).toBeInTheDocument();
  });
});
