/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppLayout from './AppLayout';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { renderWithProviders } from '../../test/utils';
import React from 'react';

// Mock the stores
vi.mock('../../features/auth/store/useAuthStore');
vi.mock('../../store/useThemeStore');
vi.mock('../ui/Toaster', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));
vi.mock('../../features/feedback/components/FeedbackModal', () => ({
  FeedbackModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="feedback-modal" /> : null,
}));

describe('AppLayout Component', () => {
  const mockSignOut = vi.fn();
  const mockToggleDark = vi.fn();

  beforeEach(() => {
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
    renderWithProviders(<AppLayout />);

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

    renderWithProviders(<AppLayout />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('toggles theme when theme button is clicked', () => {
    renderWithProviders(<AppLayout />);

    const themeButton = screen.getByLabelText(/Toggle Dark Mode/i);
    fireEvent.click(themeButton);
    expect(mockToggleDark).toHaveBeenCalled();
  });

  it('calls signOut when desktop sign out is clicked', () => {
    renderWithProviders(<AppLayout />);

    const signOutButton = screen.getByTitle('Sign Out');
    fireEvent.click(signOutButton);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('calls signOut from mobile menu', () => {
    renderWithProviders(<AppLayout />);

    fireEvent.click(screen.getByLabelText(/Open menu/i));
    const signOutButton = screen.getByTitle('Sign Out Mobile');
    fireEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalled();
    expect(screen.queryByLabelText(/Close menu/i)).not.toBeInTheDocument();
  });

  it('opens mobile menu when hamburger is clicked', () => {
    renderWithProviders(<AppLayout />);

    const menuButton = screen.getByLabelText(/Open menu/i);
    fireEvent.click(menuButton);

    expect(screen.getByLabelText(/Close menu/i)).toBeInTheDocument();
  });

  it('handles offline status', () => {
    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    renderWithProviders(<AppLayout />);

    fireEvent(window, new Event('offline'));

    expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();

    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      configurable: true,
    });
  });

  it('opens the feedback modal when Feedback is clicked', () => {
    renderWithProviders(<AppLayout />);

    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Feedback/i }));
    expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();
  });

  it('closes mobile menu on escape key', () => {
    renderWithProviders(<AppLayout />);

    fireEvent.click(screen.getByLabelText(/Open menu/i));
    expect(screen.getByLabelText(/Close menu/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByLabelText(/Close menu/i)).not.toBeInTheDocument();
  });
});
