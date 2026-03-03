import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Persisted user-controlled workspace preferences.
 * Stored in localStorage under 'parrit-workspace-prefs'.
 */
export interface WorkspacePrefsState {
  stalePairHighlightingEnabled: boolean;
  setStalePairHighlighting: (enabled: boolean) => void;
  showFullName: boolean;
  setShowFullName: (enabled: boolean) => void;
  publicViewEnabled: boolean;
  setPublicViewEnabled: (enabled: boolean) => void;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
  stalePairThreshold: number;
  setStalePairThreshold: (threshold: number) => void;
}

export const useWorkspacePrefsStore = create<WorkspacePrefsState>()(
  persist(
    (set) => ({
      stalePairHighlightingEnabled: false,
      setStalePairHighlighting: (enabled) =>
        set({ stalePairHighlightingEnabled: enabled }),
      showFullName: true,
      setShowFullName: (enabled) => set({ showFullName: enabled }),
      publicViewEnabled: false,
      setPublicViewEnabled: (enabled) => set({ publicViewEnabled: enabled }),
      onboardingCompleted: false,
      setOnboardingCompleted: (completed) =>
        set({ onboardingCompleted: completed }),
      stalePairThreshold: 3,
      setStalePairThreshold: (threshold) =>
        set({ stalePairThreshold: threshold }),
    }),
    {
      name: 'parrit-workspace-prefs',
    }
  )
);
