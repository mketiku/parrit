/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';
import { supabase } from '../../../lib/supabase';

// Mock Supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear mock history
    vi.clearAllMocks();

    // Reset Zustand store state
    useAuthStore.setState({
      user: null,
      session: null,
      workspaceName: '',
      role: null,
      isAdmin: false,
      isLoading: true,
      _initialized: false,
    });
  });

  it('should initialize with session data and admin role', async () => {
    const mockUser = {
      id: 'admin-id',
      email: 'admin@parrit.com',
      user_metadata: { workspace_name: 'Super Admin' },
      app_metadata: { role: 'admin' },
    };

    const mockSession = { user: mockUser };

    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: mockSession },
    });

    const { initialize } = useAuthStore.getState();
    await initialize();

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.workspaceName).toBe('Super Admin');
    expect(state.role).toBe('admin');
    expect(state.isAdmin).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should fallback to email-based workspaceName if metadata is missing', async () => {
    const mockUser = {
      id: 'user-id',
      email: 'apollo-team@parrit.com',
      user_metadata: {},
      app_metadata: { role: 'user' },
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: mockUser } },
    });

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().workspaceName).toBe('apollo-team');
    expect(useAuthStore.getState().isAdmin).toBe(false);
  });

  it('should use Workspace [ID] fallback if both metadata and email are missing', async () => {
    const mockUser = {
      id: 'abcde123',
      email: null,
      user_metadata: null,
      app_metadata: {},
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: mockUser } },
    });

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().workspaceName).toBe('Workspace abcde');
  });

  it('should handle sign out', async () => {
    useAuthStore.setState({
      user: { id: 'test' } as unknown as import('@supabase/supabase-js').User,
    });

    await useAuthStore.getState().signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('should skip re-initialization if already initialized', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
    });

    const { initialize } = useAuthStore.getState();
    await initialize();
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);

    await initialize();
    // Should not call getSession again
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('should handle session changes via onAuthStateChange', async () => {
    let authCallback: any;
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
    });

    await useAuthStore.getState().initialize();

    // Trigger auth change
    const mockUser = {
      id: 'new-user',
      email: 'new@parrit.com',
      app_metadata: { role: 'admin' },
    };
    const mockSession = { user: mockUser };

    authCallback('SIGNED_IN', mockSession);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAdmin).toBe(true);
    expect(state.workspaceName).toBe('new');
  });

  it('should handle errors during initialization', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (supabase.auth.getSession as any).mockRejectedValue(
      new Error('Auth failed')
    );

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error initializing auth',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});
