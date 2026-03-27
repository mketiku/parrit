import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspacePrefsStore } from './useWorkspacePrefsStore';

describe('useWorkspacePrefsStore', () => {
  beforeEach(() => {
    useWorkspacePrefsStore.setState({
      stalePairHighlightingEnabled: false,
      showFullName: true,
      publicViewEnabled: false,
      onboardingCompleted: false,
      stalePairThreshold: 3,
      hintGoalsSeen: false,
      hintRecommendSeen: false,
      gettingStartedDismissed: false,
      meetingLinkEnabled: false,
      hintHistorySeen: false,
      hintHeatmapSeen: false,
      slackWebhookUrl: '',
      shareToken: '',
    });
  });

  it('should have correct default values', () => {
    const state = useWorkspacePrefsStore.getState();
    expect(state.stalePairHighlightingEnabled).toBe(false);
    expect(state.showFullName).toBe(true);
    expect(state.stalePairThreshold).toBe(3);
    expect(state.onboardingCompleted).toBe(false);
  });

  it('should update stale pair highlighting', () => {
    useWorkspacePrefsStore.getState().setStalePairHighlighting(true);
    expect(useWorkspacePrefsStore.getState().stalePairHighlightingEnabled).toBe(
      true
    );
  });

  it('should update show full name preference', () => {
    useWorkspacePrefsStore.getState().setShowFullName(false);
    expect(useWorkspacePrefsStore.getState().showFullName).toBe(false);
  });

  it('should update stale pair threshold', () => {
    useWorkspacePrefsStore.getState().setStalePairThreshold(5);
    expect(useWorkspacePrefsStore.getState().stalePairThreshold).toBe(5);
  });

  it('should update onboarding completion status', () => {
    useWorkspacePrefsStore.getState().setOnboardingCompleted(true);
    expect(useWorkspacePrefsStore.getState().onboardingCompleted).toBe(true);
  });

  it('should update hints and dashboard preferences', () => {
    const store = useWorkspacePrefsStore.getState();
    store.setHintGoalsSeen(true);
    store.setHintRecommendSeen(true);
    store.setGettingStartedDismissed(true);
    store.setPublicViewEnabled(true);
    store.setMeetingLinkEnabled(true);
    store.setSlackWebhookUrl('https://hooks.slack.com/services/123');
    store.setShareToken('test-token');

    const state = useWorkspacePrefsStore.getState();
    expect(state.hintGoalsSeen).toBe(true);
    expect(state.hintRecommendSeen).toBe(true);
    expect(state.gettingStartedDismissed).toBe(true);
    expect(state.publicViewEnabled).toBe(true);
    expect(state.meetingLinkEnabled).toBe(true);
    expect(state.slackWebhookUrl).toBe('https://hooks.slack.com/services/123');
    expect(state.shareToken).toBe('test-token');
  });
});
