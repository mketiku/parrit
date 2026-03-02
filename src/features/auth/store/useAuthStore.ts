import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  workspaceName: string;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  workspaceName: '',
  isLoading: true,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user ?? null;
      let workspaceName = '';
      if (user?.email) {
        workspaceName = user.email.split('@')[0];
      }

      set({ session, user, workspaceName, isLoading: false });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, currentSession) => {
        const currentUser = currentSession?.user ?? null;
        let currentWorkspaceName = '';
        if (currentUser?.email) {
          currentWorkspaceName = currentUser.email.split('@')[0];
        }
        set({
          session: currentSession,
          user: currentUser,
          workspaceName: currentWorkspaceName,
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
