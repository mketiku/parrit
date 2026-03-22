/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LandingPage } from './LandingPage';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock the auth store
vi.mock('../../auth/store/useAuthStore');

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    section: ({ children, ...props }: any) => (
      <section {...props}>{children}</section>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

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

    expect(screen.getByText(/Signed in as/i)).toBeInTheDocument();
    expect(screen.getByText(/Acme Workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter Dashboard/i)).toBeInTheDocument();
  });
});
