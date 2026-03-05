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
  hintGoalsSeen: boolean;
  setHintGoalsSeen: (seen: boolean) => void;
  hintRecommendSeen: boolean;
  setHintRecommendSeen: (seen: boolean) => void;
  gettingStartedDismissed: boolean;
  setGettingStartedDismissed: (dismissed: boolean) => void;
  meetingLinkEnabled: boolean;
  setMeetingLinkEnabled: (enabled: boolean) => void;
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
      hintGoalsSeen: false,
      setHintGoalsSeen: (seen) => set({ hintGoalsSeen: seen }),
      hintRecommendSeen: false,
      setHintRecommendSeen: (seen) => set({ hintRecommendSeen: seen }),
      gettingStartedDismissed: false,
      setGettingStartedDismissed: (dismissed) =>
        set({ gettingStartedDismissed: dismissed }),
      meetingLinkEnabled: false,
      setMeetingLinkEnabled: (enabled) => set({ meetingLinkEnabled: enabled }),
    }),
    {
      name: 'parrit-workspace-prefs',
    }
  )
);
