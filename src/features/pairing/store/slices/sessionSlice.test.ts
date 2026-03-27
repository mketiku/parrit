/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createSessionSlice } from './sessionSlice';
import { createBaseSlice } from './baseSlice';
import type { BaseSlice } from './baseSlice';
import type { SessionSlice } from './sessionSlice';

// Mock supabase
vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: 'user-123' } }, error: null })
      ),
    },
    rpc: vi.fn(() => Promise.resolve({ error: null })),
  },
}));

// Mock useToastStore
const mockAddToast = vi.fn();
vi.mock('../../../../store/useToastStore', () => ({
  useToastStore: {
    getState: () => ({ addToast: mockAddToast }),
  },
}));

// Mock useWorkspacePrefsStore
let mockSlackWebhookUrl = '';
vi.mock('../../../../store/useWorkspacePrefsStore', () => ({
  useWorkspacePrefsStore: {
    getState: () => ({ slackWebhookUrl: mockSlackWebhookUrl }),
  },
}));

// Mock dateUtils
vi.mock('../../utils/dateUtils', () => ({
  formatLocalDate: vi.fn(() => '2026-03-21'),
}));

import { supabase } from '../../../../lib/supabase';

// Minimal test store type
type TestStore = BaseSlice & SessionSlice & { boards: any[]; people: any[] };

function makeStore(overrides: Partial<TestStore> = {}) {
  return create<TestStore>()((...a) => ({
    ...(createBaseSlice as any)(...a),
    ...(createSessionSlice as any)(...a),
    boards: [],
    people: [],
    ...overrides,
  }));
}

const defaultBoard = {
  id: 'board-1',
  name: 'Board One',
  isExempt: false,
  isLocked: false,
  sortOrder: 0,
  goals: [],
  meetingLink: undefined,
  assignedPersonIds: ['person-1'],
};

const defaultPerson = {
  id: 'person-1',
  name: 'Alice',
  avatarColorHex: '#ff0000',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSlackWebhookUrl = '';
  // Reset supabase mocks to defaults
  (supabase.auth.getUser as any).mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null,
  });
  (supabase.rpc as any).mockResolvedValue({ error: null });
});

describe('sessionSlice - saveSession', () => {
  it('returns early without calling rpc when isSaving is already true', async () => {
    const store = makeStore({
      isSaving: true,
      boards: [defaultBoard],
      people: [defaultPerson],
    });
    await store.getState().saveSession();
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(mockAddToast).not.toHaveBeenCalled();
  });

  it('returns early without doing anything when there is no authenticated user', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const store = makeStore({
      boards: [defaultBoard],
      people: [defaultPerson],
    });
    await store.getState().saveSession();
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(mockAddToast).not.toHaveBeenCalled();
  });

  it('shows info toast and does NOT call rpc when all boards have empty assignedPersonIds', async () => {
    const emptyBoard = { ...defaultBoard, assignedPersonIds: [] };
    const store = makeStore({ boards: [emptyBoard], people: [defaultPerson] });
    await store.getState().saveSession();
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledOnce();
    expect(mockAddToast).toHaveBeenCalledWith(
      'Nothing to save! The nest is empty. Assign some people to boards first. 🪹',
      'info'
    );
  });

  it('shows info toast and does NOT call rpc when boards array is empty', async () => {
    const store = makeStore({ boards: [], people: [] });
    await store.getState().saveSession();
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith(
      'Nothing to save! The nest is empty. Assign some people to boards first. 🪹',
      'info'
    );
  });

  it('calls supabase.rpc with the correct payload shape on a successful save', async () => {
    const store = makeStore({
      boards: [defaultBoard],
      people: [defaultPerson],
    });
    await store.getState().saveSession();

    expect(supabase.rpc).toHaveBeenCalledOnce();
    expect(supabase.rpc).toHaveBeenCalledWith('save_pairing_session', {
      p_session_date: '2026-03-21',
      p_snapshot_data: {
        boards: [
          {
            id: 'board-1',
            name: 'Board One',
            goals: [],
            meeting_link: undefined,
            people: [
              { id: 'person-1', name: 'Alice', avatar_color: '#ff0000' },
            ],
          },
        ],
      },
      p_history_rows: [
        {
          person_id: 'person-1',
          board_id: 'board-1',
          board_name: 'Board One',
          person_name: 'Alice',
        },
      ],
    });
  });

  it('sets isSaving back to false and shows success toast after a successful save', async () => {
    const store = makeStore({
      boards: [defaultBoard],
      people: [defaultPerson],
    });
    await store.getState().saveSession();

    expect(store.getState().isSaving).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith(
      'Pairing session saved successfully!',
      'success'
    );
  });

  it('uses "Unknown" for person name and default avatar color when person is not found', async () => {
    const boardWithUnknownPerson = {
      ...defaultBoard,
      assignedPersonIds: ['ghost-id'],
    };
    const store = makeStore({ boards: [boardWithUnknownPerson], people: [] });
    await store.getState().saveSession();

    const rpcCall = (supabase.rpc as any).mock.calls[0][1];
    expect(rpcCall.p_snapshot_data.boards[0].people[0]).toEqual({
      id: 'ghost-id',
      name: 'Unknown',
      avatar_color: '#94a3b8',
    });
    expect(rpcCall.p_history_rows[0].person_name).toBe('Unknown');
  });

  it('sets isSaving to false and shows error toast when rpc returns an error', async () => {
    (supabase.rpc as any).mockResolvedValue({ error: { message: 'DB error' } });
    const store = makeStore({
      boards: [defaultBoard],
      people: [defaultPerson],
    });
    await store.getState().saveSession();

    expect(store.getState().isSaving).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith(
      'Failed to save session: DB error',
      'error'
    );
    // Should not show success toast
    expect(mockAddToast).not.toHaveBeenCalledWith(
      'Pairing session saved successfully!',
      'success'
    );
  });

  it('does not call fetch when slackWebhookUrl is empty after a successful save', async () => {
    const mockFetch = vi.fn().mockResolvedValue({});
    vi.stubGlobal('fetch', mockFetch);
    mockSlackWebhookUrl = '';

    const store = makeStore({
      boards: [defaultBoard],
      people: [defaultPerson],
    });
    await store.getState().saveSession();

    expect(mockFetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('calls fetch with the webhook URL when slackWebhookUrl is configured after a successful save', async () => {
    const mockFetch = vi.fn().mockResolvedValue({});
    vi.stubGlobal('fetch', mockFetch);
    mockSlackWebhookUrl = 'https://hooks.slack.com/test-webhook';

    const store = makeStore({
      boards: [defaultBoard],
      people: [defaultPerson],
    });
    await store.getState().saveSession();

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/test-webhook',
      expect.objectContaining({
        method: 'POST',
        mode: 'no-cors',
      })
    );
    vi.unstubAllGlobals();
  });

  it('shows "Webhook notification failed to send." info toast when fetch throws', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('network failure'));
    vi.stubGlobal('fetch', mockFetch);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSlackWebhookUrl = 'https://hooks.slack.com/test-webhook';

    const store = makeStore({
      boards: [defaultBoard],
      people: [defaultPerson],
    });
    await store.getState().saveSession();

    expect(mockAddToast).toHaveBeenCalledWith(
      'Webhook notification failed to send.',
      'info'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Webhook error:',
      expect.any(Error)
    );
    vi.unstubAllGlobals();
    consoleSpy.mockRestore();
  });

  it('shows error toast when a disallowed domain is used for webhook', async () => {
    const mockFetch = vi.fn().mockResolvedValue({});
    vi.stubGlobal('fetch', mockFetch);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSlackWebhookUrl = 'https://malicious-site.com/webhook';

    const store = makeStore({
      boards: [defaultBoard],
      people: [defaultPerson],
    });
    await store.getState().saveSession();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith(
      'Webhook notification failed to send.',
      'info'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Webhook error:',
      expect.any(Error)
    );
    vi.unstubAllGlobals();
    consoleSpy.mockRestore();
  });
});
