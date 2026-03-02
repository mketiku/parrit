import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import React from 'react';
import { useAuthStore } from './features/auth/store/useAuthStore';

vi.mock('./features/auth/store/useAuthStore');

describe('App Root Component', () => {
  it('renders the layout and default dashboard view', () => {
    // Force a logged-in state so the app renders its actual routes
    vi.mocked(useAuthStore).mockReturnValue({
      user: {
        id: 'test-user',
        email: 'test@example.com',
      } as unknown as import('@supabase/supabase-js').User,
      session: null,
      workspaceName: 'test',
      isLoading: false,
      initialize: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    // Header Logo should exist
    expect(screen.getByText('Parrit')).toBeInTheDocument();

    // Default route placeholder text should exist
    expect(screen.getByText('Test Workspace')).toBeInTheDocument();
  });
});
