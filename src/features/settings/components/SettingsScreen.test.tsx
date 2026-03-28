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
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

describe('SettingsScreen Component', () => {
  const mockSetTheme = vi.fn();
  const mockSetShowFullName = vi.fn();
  const mockSetStalePairHighlighting = vi.fn();
  const mockSetPublicViewEnabled = vi.fn();
  const mockSetOnboardingCompleted = vi.fn();
  const mockSetStalePairThreshold = vi.fn();
  const mockSetGettingStartedDismissed = vi.fn();
  const mockSetMeetingLinkEnabled = vi.fn();
  const mockSetSlackWebhookUrl = vi.fn();
  const mockExportWorkspace = vi.fn();
  const mockImportWorkspace = vi.fn();
  const mockWipeWorkspace = vi.fn();
  const mockSetShareToken = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );
    vi.stubGlobal('alert', vi.fn());
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: vi.fn(() => 'mocked-uuid'),
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });

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
      setStalePairHighlighting: mockSetStalePairHighlighting,
      stalePairThreshold: 3,
      setStalePairThreshold: mockSetStalePairThreshold,
      publicViewEnabled: false,
      setPublicViewEnabled: mockSetPublicViewEnabled,
      onboardingCompleted: true,
      setOnboardingCompleted: mockSetOnboardingCompleted,
      gettingStartedDismissed: false,
      setGettingStartedDismissed: mockSetGettingStartedDismissed,
      meetingLinkEnabled: false,
      setMeetingLinkEnabled: mockSetMeetingLinkEnabled,
      slackWebhookUrl: '',
      setSlackWebhookUrl: mockSetSlackWebhookUrl,
      shareToken: 'shared-token-123',
    });

    (usePairingStore as any).mockReturnValue({
      exportWorkspace: mockExportWorkspace,
      importWorkspace: mockImportWorkspace,
      isLoading: false,
    });

    (usePairingStore as any).getState = vi.fn(() => ({
      wipeWorkspace: mockWipeWorkspace,
    }));

    (useWorkspacePrefsStore as any).getState = vi.fn(() => ({
      setShareToken: mockSetShareToken,
    }));
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

  it('updates pairing preferences and onboarding state', async () => {
    render(<SettingsScreen />);
    fireEvent.click(screen.getAllByText('Pairing')[0]);

    fireEvent.click(
      screen.getByRole('button', { name: /warn after 5 consecutive sessions/i })
    );
    fireEvent.click(screen.getAllByRole('switch')[0]);
    fireEvent.click(
      screen.getByRole('switch', {
        name: /product tutorial auto-start/i,
      })
    );
    fireEvent.click(
      screen.getByRole('switch', { name: /show getting started guide/i })
    );
    fireEvent.click(
      screen.getByRole('switch', { name: /meeting links on boards/i })
    );

    await waitFor(() => {
      expect(mockSetStalePairThreshold).toHaveBeenCalledWith(5);
      expect(mockSetStalePairHighlighting).toHaveBeenCalledWith(false);
      expect(mockSetOnboardingCompleted).toHaveBeenCalledWith(false);
      expect(mockSetGettingStartedDismissed).toHaveBeenCalledWith(true);
      expect(mockSetMeetingLinkEnabled).toHaveBeenCalledWith(true);
      expect(supabase.from).toHaveBeenCalledWith('workspace_settings');
    });
  });

  it('manages the public collaboration link', async () => {
    (useWorkspacePrefsStore as any).mockReturnValue({
      showFullName: false,
      setShowFullName: mockSetShowFullName,
      stalePairHighlightingEnabled: true,
      setStalePairHighlighting: mockSetStalePairHighlighting,
      stalePairThreshold: 3,
      setStalePairThreshold: mockSetStalePairThreshold,
      publicViewEnabled: true,
      setPublicViewEnabled: mockSetPublicViewEnabled,
      onboardingCompleted: true,
      setOnboardingCompleted: mockSetOnboardingCompleted,
      gettingStartedDismissed: false,
      setGettingStartedDismissed: mockSetGettingStartedDismissed,
      meetingLinkEnabled: false,
      setMeetingLinkEnabled: mockSetMeetingLinkEnabled,
      slackWebhookUrl: '',
      setSlackWebhookUrl: mockSetSlackWebhookUrl,
      shareToken: 'shared-token-123',
    });

    render(<SettingsScreen />);
    fireEvent.click(screen.getAllByText('Privacy')[0]);

    expect(screen.getByText(/\/view\/shared-token-123/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^copy$/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/view/shared-token-123`
    );

    fireEvent.click(
      screen.getByRole('button', { name: /regenerate link \/ revoke keys/i })
    );

    await waitFor(() => {
      expect(mockSetShareToken).toHaveBeenCalledWith('mocked-uuid');
      expect(alert).toHaveBeenCalledWith('Link rotated successfully!');
    });
  });

  it('shows webhook validation errors and accepts valid https urls', () => {
    render(<SettingsScreen />);
    fireEvent.click(screen.getAllByText('Integrations')[0]);

    const input = screen.getByPlaceholderText(
      'https://hooks.slack.com/services/...'
    );
    fireEvent.change(input, {
      target: { value: 'http://hooks.slack.com/foo' },
    });

    expect(
      screen.getByText(/Webhook URL must start with https:\/\//i)
    ).toBeInTheDocument();
    expect(mockSetSlackWebhookUrl).toHaveBeenCalledWith(
      'http://hooks.slack.com/foo'
    );

    fireEvent.change(input, {
      target: { value: 'https://hooks.slack.com/foo' },
    });

    expect(
      screen.getByText(/Leave blank to disable chat notifications/i)
    ).toBeInTheDocument();
  });

  it('validates short passwords, handles update failures, and supports import and wipe flows', async () => {
    render(<SettingsScreen />);
    fireEvent.click(screen.getAllByText('Security')[0]);

    fireEvent.change(screen.getByPlaceholderText(/^New$/), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^Confirm$/), {
      target: { value: '123' },
    });
    fireEvent.click(screen.getAllByText('Save')[0]);

    expect(
      screen.getByText(/Password must be at least 6 characters long/i)
    ).toBeInTheDocument();

    (supabase.auth.updateUser as any).mockResolvedValueOnce({
      error: new Error('Auth is down'),
    });

    fireEvent.change(screen.getByPlaceholderText(/^New$/), {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^Confirm$/), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getAllByText('Save')[0]);

    await waitFor(() => {
      expect(screen.getByText('Auth is down')).toBeInTheDocument();
    });

    mockImportWorkspace.mockResolvedValueOnce(undefined);
    const file = new File(['{"boards":[],"people":[]}'], 'workspace.json', {
      type: 'application/json',
    });

    fireEvent.click(screen.getByText(/Select JSON/i));
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText(/Destructive Action/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /yes, replace everything/i })
    );

    await waitFor(() => {
      expect(mockImportWorkspace).toHaveBeenCalledWith(
        '{"boards":[],"people":[]}'
      );
    });

    (globalThis.confirm as unknown as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole('button', { name: /wipe everything/i }));

    await waitFor(() => {
      expect(mockWipeWorkspace).toHaveBeenCalled();
    });
  });
});
