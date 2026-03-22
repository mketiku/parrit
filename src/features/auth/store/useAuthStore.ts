import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  workspaceName: string;
  role: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  _initialized?: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  workspaceName: '',
  role: null,
  isAdmin: false,
  isLoading: true,

  initialize: async () => {
    if (useAuthStore.getState()._initialized) {
      // Ensure we don't leave the UI in a loading state if initialize is called multiple times
      set({ isLoading: false });
      return;
    }
    useAuthStore.getState()._initialized = true;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user ?? null;
      let workspaceName = '';
      let role: string | null = null;

      if (user) {
        workspaceName =
          user.user_metadata?.workspace_name ||
          user.email?.split('@')[0] ||
          `Workspace ${user.id.slice(0, 5)}`;

        role = user.app_metadata?.role || null;
      }

      set({
        session,
        user,
        workspaceName,
        role,
        isAdmin: role === 'admin',
        isLoading: false,
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, currentSession) => {
        const currentUser = currentSession?.user ?? null;
        let currentWorkspaceName = '';
        let currentRole: string | null = null;

        if (currentUser) {
          currentWorkspaceName =
            currentUser.user_metadata?.workspace_name ||
            currentUser.email?.split('@')[0] ||
            `Workspace ${currentUser.id.slice(0, 5)}`;

          currentRole = currentUser.app_metadata?.role || null;
        }
        set({
          session: currentSession,
          user: currentUser,
          workspaceName: currentWorkspaceName,
          role: currentRole,
          isAdmin: currentRole === 'admin',
          isLoading: false, // Ensure loading is off if we get a session change
        });
      });
    } catch (error) {
      console.error('Error initializing auth', error);
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
