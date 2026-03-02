import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Persisted user-controlled workspace preferences.
 * Stored in localStorage under 'parrit-workspace-prefs'.
 */
interface WorkspacePrefsState {
  stalePairHighlightingEnabled: boolean;
  setStalePairHighlighting: (enabled: boolean) => void;
  showFullName: boolean;
  setShowFullName: (enabled: boolean) => void;
}

export const useWorkspacePrefsStore = create<WorkspacePrefsState>()(
  persist(
    (set) => ({
      stalePairHighlightingEnabled: false,
      setStalePairHighlighting: (enabled) =>
        set({ stalePairHighlightingEnabled: enabled }),
      showFullName: true,
      setShowFullName: (enabled) => set({ showFullName: enabled }),
    }),
    {
      name: 'parrit-workspace-prefs',
    }
  )
);
