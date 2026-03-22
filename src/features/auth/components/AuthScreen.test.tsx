/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthScreen } from './AuthScreen';
import { supabase } from '../../../lib/supabase';
import { BrowserRouter as Router } from 'react-router-dom';
import React from 'react';

// Mock Supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

describe('AuthScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for successful sign in
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      error: null,
    });
    (supabase.auth.signUp as any).mockResolvedValue({ error: null });

    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('generates a pseudo-email and signs in correctly', async () => {
    render(
      <Router>
        <AuthScreen />
      </Router>
    );

    // Enter workspace name
    const workspaceInput = screen.getByLabelText(/Workspace Name/i);
    fireEvent.change(workspaceInput, { target: { value: 'Apollo Team' } });

    // Enter password
    const passwordInput = screen.getByLabelText(/Password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit
    const submitButton = screen.getByRole('button', {
      name: /Enter Workspace/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Should normalize "Apollo Team" to "apollo-team@parrit.com"
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'apollo-team@parrit.com',
        password: 'password123',
      });
    });
  });

  it('generates a pseudo-email and signs up correctly', async () => {
    // Navigate to signup via button click
    render(
      <Router>
        <AuthScreen />
      </Router>
    );

    const toggleButton = screen.getByText(/Create one/i);
    fireEvent.click(toggleButton);

    // Verify it changed to signup mode
    expect(
      screen.getByRole('button', { name: /Create Workspace/i })
    ).toBeInTheDocument();

    // Enter workspace name
    fireEvent.change(screen.getByLabelText(/Workspace Name/i), {
      target: { value: 'New-Team' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'securePass' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Create Workspace/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new-team@parrit.com',
        password: 'securePass',
        options: {
          data: {
            workspace_name: 'New-Team',
          },
        },
      });
    });
  });

  it('displays error messages from Supabase', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      error: { message: 'Invalid credentials' },
    });

    render(
      <Router>
        <AuthScreen />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/Workspace Name/i), {
      target: { value: 'fail' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'fail' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enter Workspace/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
