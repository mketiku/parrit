import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import React from 'react';
import { useAuthStore } from './features/auth/store/useAuthStore';
import { usePairingStore } from './features/pairing/store/usePairingStore';
import { createMockPairingStore } from './test/mocks';

vi.mock('./features/auth/store/useAuthStore');
vi.mock('./features/pairing/store/usePairingStore');

const mockPairingState = createMockPairingStore();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.mocked(usePairingStore).mockImplementation((selector?: any) =>
  selector ? selector(mockPairingState) : mockPairingState
);

describe('App Root Component', () => {
  it('renders the layout and default dashboard view', () => {
    // Force a logged-in state so the app renders its actual routes
    const authState = {
      user: {
        id: 'test-user',
        email: 'test@example.com',
      } as unknown as import('@supabase/supabase-js').User,
      session: null,
      workspaceName: 'test',
      isLoading: false,
      initialize: vi.fn(),
      signOut: vi.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useAuthStore).mockImplementation((selector?: any) =>
      selector ? selector(authState) : authState
    );

    // Mock time to Saturday, March 21, 2026
    const mockDate = new Date(2026, 2, 21);
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    render(<App />);

    // Header Logo should exist
    expect(screen.getByText('Parrit')).toBeInTheDocument();

    // Verify Dashboard Title (Consistency fix)
    expect(screen.getByText('Pairing Dashboard')).toBeInTheDocument();

    // Verify Workspace identity is still present
    expect(screen.getByText('Test Workspace')).toBeInTheDocument();

    // Verify the date is rendered (Saturday, March 21st)
    expect(screen.getByText('Saturday, March 21st')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
