import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock zustand persist middleware to avoid localStorage issues in tests

vi.mock('zustand/middleware', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal<any>();
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    persist: (config: any) => (set: any, get: any, api: any) =>
      config(set, get, api),
  };
});

// Now import the store
import { useWorkspacePrefsStore } from './useWorkspacePrefsStore';

describe('useWorkspacePrefsStore', () => {
  beforeEach(() => {
    // Reset store to default values
    useWorkspacePrefsStore.setState({
      stalePairHighlightingEnabled: false,
      showFullName: true,
      publicViewEnabled: false,
      onboardingCompleted: true,
      stalePairThreshold: 3,
    });
  });

  it('should have correct default values', () => {
    const state = useWorkspacePrefsStore.getState();
    expect(state.stalePairHighlightingEnabled).toBe(false);
    expect(state.showFullName).toBe(true);
    expect(state.publicViewEnabled).toBe(false);
    expect(state.onboardingCompleted).toBe(true);
    expect(state.stalePairThreshold).toBe(3);
  });

  it('should update stalePairHighlightingEnabled', () => {
    const { setStalePairHighlighting } = useWorkspacePrefsStore.getState();
    setStalePairHighlighting(true);
    expect(useWorkspacePrefsStore.getState().stalePairHighlightingEnabled).toBe(
      true
    );
  });

  it('should update showFullName', () => {
    const { setShowFullName } = useWorkspacePrefsStore.getState();
    setShowFullName(false);
    expect(useWorkspacePrefsStore.getState().showFullName).toBe(false);
  });

  it('should update publicViewEnabled', () => {
    const { setPublicViewEnabled } = useWorkspacePrefsStore.getState();
    setPublicViewEnabled(true);
    expect(useWorkspacePrefsStore.getState().publicViewEnabled).toBe(true);
  });

  it('should update onboardingCompleted', () => {
    const { setOnboardingCompleted } = useWorkspacePrefsStore.getState();
    setOnboardingCompleted(false);
    expect(useWorkspacePrefsStore.getState().onboardingCompleted).toBe(false);
  });

  it('should update stalePairThreshold', () => {
    const { setStalePairThreshold } = useWorkspacePrefsStore.getState();
    setStalePairThreshold(5);
    expect(useWorkspacePrefsStore.getState().stalePairThreshold).toBe(5);
  });
});
