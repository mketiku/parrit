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
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user ?? null;
      let workspaceName = '';
      let role = null;
      if (user?.email) {
        workspaceName = user.email.split('@')[0];
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
        let currentRole = null;
        if (currentUser?.email) {
          currentWorkspaceName = currentUser.email.split('@')[0];
          currentRole = currentUser.app_metadata?.role || null;
        }
        set({
          session: currentSession,
          user: currentUser,
          workspaceName: currentWorkspaceName,
          role: currentRole,
          isAdmin: currentRole === 'admin',
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
