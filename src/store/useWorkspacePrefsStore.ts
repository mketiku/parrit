import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Persisted user-controlled workspace preferences.
 * Stored in localStorage under 'parrit-workspace-prefs'.
 */
interface WorkspacePrefsState {
  stalePairHighlightingEnabled: boolean;
  setStalePairHighlighting: (enabled: boolean) => void;
}

export const useWorkspacePrefsStore = create<WorkspacePrefsState>()(
  persist(
    (set) => ({
      stalePairHighlightingEnabled: false, // off by default
      setStalePairHighlighting: (enabled) =>
        set({ stalePairHighlightingEnabled: enabled }),
    }),
    {
      name: 'parrit-workspace-prefs',
    }
  )
);
