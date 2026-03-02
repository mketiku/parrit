import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null, isLoading: false });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, currentSession) => {
        set({ session: currentSession, user: currentSession?.user ?? null });
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
