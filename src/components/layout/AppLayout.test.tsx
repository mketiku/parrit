/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppLayout from './AppLayout';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock the stores
vi.mock('../../features/auth/store/useAuthStore');
vi.mock('../../store/useThemeStore');
vi.mock('../ui/Toaster', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

describe('AppLayout Component', () => {
  const mockSignOut = vi.fn();
  const mockToggleDark = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      signOut: mockSignOut,
      isAdmin: false,
    });
    (useThemeStore as any).mockReturnValue({
      isDark: false,
      toggleDark: mockToggleDark,
    });
  });

  it('renders the layout with navigation links', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('shows Admin link if user is an admin', () => {
    (useAuthStore as any).mockReturnValue({
      signOut: mockSignOut,
      isAdmin: true,
    });

    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('toggles theme when theme button is clicked', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    const themeButton = screen.getByLabelText(/Toggle Dark Mode/i);
    fireEvent.click(themeButton);
    expect(mockToggleDark).toHaveBeenCalled();
  });

  it('calls signOut when desktop sign out is clicked', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    const signOutButton = screen.getByTitle('Sign Out');
    fireEvent.click(signOutButton);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('calls signOut from mobile menu', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByLabelText(/Open menu/i));
    const signOutButton = screen.getByTitle('Sign Out Mobile');
    fireEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalled();
    expect(screen.queryByLabelText(/Close menu/i)).not.toBeInTheDocument();
  });

  it('opens mobile menu when hamburger is clicked', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    const menuButton = screen.getByLabelText(/Open menu/i);
    fireEvent.click(menuButton);

    // Check if the drawer-specific close button exists
    expect(screen.getByLabelText(/Close menu/i)).toBeInTheDocument();
  });

  it('handles offline status', () => {
    // Mock navigator.onLine
    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    // Initial check (Step 11 initializes with !navigator.onLine)
    // Wait, let's trigger the event
    fireEvent(window, new Event('offline'));

    expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();

    // Cleanup mock
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      configurable: true,
    });
  });

  it('closes mobile menu on escape key', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByLabelText(/Open menu/i));
    expect(screen.getByLabelText(/Close menu/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByLabelText(/Close menu/i)).not.toBeInTheDocument();
  });
});
