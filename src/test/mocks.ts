import { vi } from 'vitest';
import { PairingStore } from '../features/pairing/store/usePairingStore';
import { WorkspacePrefsState } from '../store/useWorkspacePrefsStore';

/**
 * Creates a mock PairingStore with all functions as vi.fn().
 * This provides type safety for our mocks and avoids 'any' casting.
 */
export const createMockPairingStore = (
  overrides?: Partial<PairingStore>
): PairingStore => ({
  people: [],
  boards: [],
  isLoading: false,
  isSaving: false,
  isRecommending: false,
  error: null,
  previousBoards: null,
  _delay: vi.fn().mockResolvedValue(undefined),
  loadWorkspaceData: vi.fn().mockResolvedValue(undefined),
  subscribeToRealtime: vi.fn().mockReturnValue(vi.fn()),
  addPerson: vi.fn().mockResolvedValue(undefined),
  updatePerson: vi.fn().mockResolvedValue(undefined),
  removePerson: vi.fn().mockResolvedValue(undefined),
  undo: vi.fn(),
  setBoards: vi.fn(),
  persistBoardAssignments: vi.fn().mockResolvedValue(undefined),
  addBoard: vi.fn().mockResolvedValue(undefined),
  updateBoard: vi.fn().mockResolvedValue(undefined),
  moveBoard: vi.fn().mockResolvedValue(undefined),
  removeBoard: vi.fn().mockResolvedValue(undefined),
  saveSession: vi.fn().mockResolvedValue(undefined),
  recommendPairs: vi.fn().mockResolvedValue(undefined),
  saveCurrentAsTemplate: vi.fn().mockResolvedValue(undefined),
  applyTemplate: vi.fn().mockResolvedValue(undefined),
  applyBuiltinTemplate: vi.fn().mockResolvedValue(undefined),
  exportWorkspace: vi.fn().mockResolvedValue('{}'),
  importWorkspace: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

/**
 * Creates a mock WorkspacePrefsStore with all functions as vi.fn().
 */
export const createMockWorkspacePrefsStore = (
  overrides?: Partial<WorkspacePrefsState>
): WorkspacePrefsState => ({
  stalePairHighlightingEnabled: false,
  setStalePairHighlighting: vi.fn(),
  showFullName: true,
  setShowFullName: vi.fn(),
  publicViewEnabled: false,
  setPublicViewEnabled: vi.fn(),
  onboardingCompleted: true,
  setOnboardingCompleted: vi.fn(),
  stalePairThreshold: 3,
  setStalePairThreshold: vi.fn(),
  hintGoalsSeen: false,
  setHintGoalsSeen: vi.fn(),
  hintRecommendSeen: false,
  setHintRecommendSeen: vi.fn(),
  gettingStartedDismissed: false,
  setGettingStartedDismissed: vi.fn(),
  meetingLinkEnabled: false,
  setMeetingLinkEnabled: vi.fn(),
  hintHistorySeen: false,
  setHintHistorySeen: vi.fn(),
  hintHeatmapSeen: false,
  setHintHeatmapSeen: vi.fn(),
  slackWebhookUrl: '',
  setSlackWebhookUrl: vi.fn(),
  shareToken: '',
  setShareToken: vi.fn(),
  ...overrides,
});
