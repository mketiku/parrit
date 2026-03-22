/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsScreen } from './SettingsScreen';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useThemeStore } from '../../../store/useThemeStore';
import { usePairingStore } from '../../pairing/store/usePairingStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { supabase } from '../../../lib/supabase';
import React from 'react';

// Mocks
vi.mock('../../auth/store/useAuthStore');
vi.mock('../../../store/useThemeStore');
vi.mock('../../pairing/store/usePairingStore');
vi.mock('../../../store/useWorkspacePrefsStore');
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

describe('SettingsScreen Component', () => {
  const mockSetTheme = vi.fn();
  const mockSetShowFullName = vi.fn();
  const mockExportWorkspace = vi.fn();
  const mockImportWorkspace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuthStore as any).mockReturnValue({
      user: { id: 'user-1' },
      workspaceName: 'TestTeam',
    });

    (useThemeStore as any).mockReturnValue({
      theme: 'macaw-elite',
      setTheme: mockSetTheme,
    });

    (useWorkspacePrefsStore as any).mockReturnValue({
      showFullName: false,
      setShowFullName: mockSetShowFullName,
      stalePairHighlightingEnabled: true,
      setStalePairHighlighting: vi.fn(),
      stalePairThreshold: 3,
      setStalePairThreshold: vi.fn(),
      publicViewEnabled: false,
      setPublicViewEnabled: vi.fn(),
      onboardingCompleted: true,
      setOnboardingCompleted: vi.fn(),
      slackWebhookUrl: '',
      setSlackWebhookUrl: vi.fn(),
    });

    (usePairingStore as any).mockReturnValue({
      exportWorkspace: mockExportWorkspace,
      importWorkspace: mockImportWorkspace,
      isLoading: false,
    });
  });

  it('renders correctly and switches tabs', () => {
    render(<SettingsScreen />);
    expect(
      screen.getByText(/Manage your TestTeam environment/i)
    ).toBeInTheDocument();

    // Switch to Pairing tab
    const pairingTab = screen.getAllByText('Pairing')[0];
    fireEvent.click(pairingTab);
    expect(screen.getByText('Pairing Intelligence')).toBeInTheDocument();
  });

  it('allows changing theme', () => {
    render(<SettingsScreen />);
    const nightParrotButton = screen.getByLabelText(
      /Switch to Night Parrot theme/i
    );
    fireEvent.click(nightParrotButton);
    expect(mockSetTheme).toHaveBeenCalledWith('night-parrot');
  });

  it('toggles display names preference', () => {
    render(<SettingsScreen />);
    const toggle = screen.getByRole('switch', { name: /Display Names/i });
    fireEvent.click(toggle);
    expect(mockSetShowFullName).toHaveBeenCalledWith(true);
  });

  it('handles password updates', async () => {
    (supabase.auth.updateUser as any).mockResolvedValue({ error: null });

    render(<SettingsScreen />);
    // Switch to security tab
    fireEvent.click(screen.getAllByText('Security')[0]);

    const newPasswordInput = screen.getByPlaceholderText(/^New$/);
    const confirmPasswordInput = screen.getByPlaceholderText(/^Confirm$/);
    const saveButton = screen.getAllByText('Save')[0];

    fireEvent.change(newPasswordInput, { target: { value: 'secret123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'secret123' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'secret123',
      });
      expect(
        screen.getByText(/Password successfully updated/i)
      ).toBeInTheDocument();
    });
  });

  it('validates password mismatch', () => {
    render(<SettingsScreen />);
    fireEvent.click(screen.getAllByText('Security')[0]);

    fireEvent.change(screen.getByPlaceholderText(/^New$/), {
      target: { value: 'pass1' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^Confirm$/), {
      target: { value: 'pass2' },
    });
    fireEvent.click(screen.getAllByText('Save')[0]);

    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  it('triggers workspace export', () => {
    mockExportWorkspace.mockResolvedValue('{}');
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();

    render(<SettingsScreen />);
    fireEvent.click(screen.getAllByText('Security')[0]);

    const exportButton = screen.getByText('Run Export');
    fireEvent.click(exportButton);

    expect(mockExportWorkspace).toHaveBeenCalled();
  });
});
