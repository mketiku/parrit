// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import { createBaseSlice, type BaseSlice } from './baseSlice';
import {
  createExportImportSlice,
  type ExportImportSlice,
} from './exportImportSlice';
import type { PairingBoard, Person } from '../../types';
import { supabase } from '../../../../lib/supabase';

const { mockFrom, mockAddToast, prefsState } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockAddToast: vi.fn(),
  prefsState: {
    stalePairHighlightingEnabled: true,
    showFullName: true,
    publicViewEnabled: true,
    onboardingCompleted: true,
    stalePairThreshold: 4,
    meetingLinkEnabled: true,
    setStalePairHighlighting: vi.fn(),
    setShowFullName: vi.fn(),
    setPublicViewEnabled: vi.fn(),
    setOnboardingCompleted: vi.fn(),
    setStalePairThreshold: vi.fn(),
    setMeetingLinkEnabled: vi.fn(),
    setShareToken: vi.fn(),
  },
}));

vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: mockFrom,
  },
}));

vi.mock('../../../../store/useToastStore', () => ({
  useToastStore: {
    getState: () => ({ addToast: mockAddToast }),
  },
}));

vi.mock('../../../../store/useWorkspacePrefsStore', () => ({
  useWorkspacePrefsStore: {
    getState: () => prefsState,
  },
}));

type TestStore = BaseSlice &
  ExportImportSlice & {
    people: Person[];
    boards: PairingBoard[];
  };

function makeStore(people: Person[] = [], boards: PairingBoard[] = []) {
  return create<TestStore>()((...a) => ({
    ...(createBaseSlice as any)(...a),
    ...(createExportImportSlice as any)(...a),
    people,
    boards,
  }));
}

const people: Person[] = [
  { id: 'person-1', name: 'Alice', avatarColorHex: '#111111' },
];

const boards: PairingBoard[] = [
  {
    id: 'board-1',
    name: 'Core',
    isExempt: false,
    isLocked: true,
    sortOrder: 0,
    goals: ['Focus'],
    meetingLink: 'https://meet.example.com/core',
    assignedPersonIds: ['person-1'],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  (supabase.auth.getUser as any).mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null,
  });
});

describe('exportImportSlice', () => {
  it('returns an empty string when exporting without an authenticated user', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const store = makeStore(people, boards);

    await expect(store.getState().exportWorkspace()).resolves.toBe('');
  });

  it('exports workspace data without hitting sessions when history is disabled', async () => {
    const pairingTemplatesEq = vi
      .fn()
      .mockResolvedValue({ data: [{ name: 'Default', boards: [] }] });
    const pairingTemplatesSelect = vi.fn(() => ({ eq: pairingTemplatesEq }));
    const pairingSessionsSelect = vi.fn();

    mockFrom.mockImplementation((table: string) => {
      if (table === 'pairing_templates') {
        return { select: pairingTemplatesSelect };
      }
      if (table === 'pairing_sessions') {
        return { select: pairingSessionsSelect };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const store = makeStore(people, boards);
    const json = await store.getState().exportWorkspace(false);
    const parsed = JSON.parse(json);

    expect(pairingSessionsSelect).not.toHaveBeenCalled();
    expect(parsed.people).toEqual([
      { name: 'Alice', avatarColorHex: '#111111' },
    ]);
    expect(parsed.boards[0]).toMatchObject({
      name: 'Core',
      isLocked: true,
      assignedPersonNames: ['Alice'],
    });
    expect(parsed.templates).toEqual([{ name: 'Default', boards: [] }]);
    expect(parsed.sessions).toBeUndefined();
  });

  it('includes normalized session history when exporting with history', async () => {
    const pairingTemplatesEq = vi.fn().mockResolvedValue({ data: [] });
    const pairingTemplatesSelect = vi.fn(() => ({ eq: pairingTemplatesEq }));
    const pairingSessionsOrder = vi.fn().mockResolvedValue({
      data: [
        {
          session_date: '2026-03-20',
          created_at: '2026-03-20T12:00:00.000Z',
          snapshot_data: { boards: [] },
          pairing_history: [
            {
              person_name: null,
              board_name: null,
              people: { name: 'Alice' },
              pairing_boards: { name: 'Core' },
              created_at: '2026-03-20T12:00:00.000Z',
            },
          ],
        },
      ],
    });
    const pairingSessionsEq = vi.fn(() => ({ order: pairingSessionsOrder }));
    const pairingSessionsSelect = vi.fn(() => ({ eq: pairingSessionsEq }));

    mockFrom.mockImplementation((table: string) => {
      if (table === 'pairing_templates') {
        return { select: pairingTemplatesSelect };
      }
      if (table === 'pairing_sessions') {
        return { select: pairingSessionsSelect };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const store = makeStore(people, boards);
    const json = await store.getState().exportWorkspace(true);
    const parsed = JSON.parse(json);

    expect(parsed.sessions).toEqual([
      {
        session_date: '2026-03-20',
        created_at: '2026-03-20T12:00:00.000Z',
        snapshot_data: { boards: [] },
        history: [
          {
            personName: 'Alice',
            boardName: 'Core',
            createdAt: '2026-03-20T12:00:00.000Z',
          },
        ],
      },
    ]);
  });

  it('rejects invalid import payloads and leaves loading false', async () => {
    const store = makeStore();

    await store.getState().importWorkspace('{"version":"wrong"}');

    expect(store.getState().isLoading).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringContaining('Invalid workspace file:'),
      'error'
    );
  });

  it('imports a workspace, restores state, settings, templates, sessions, and history', async () => {
    const workspaceSettingsUpsert = vi.fn().mockResolvedValue({ error: null });
    const templatesInsert = vi.fn().mockResolvedValue({ error: null });
    const peopleSelect = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'person-db-1',
          name: 'Alice',
          avatar_color_hex: '#111111',
          user_id: 'user-123',
          created_at: '',
        },
      ],
      error: null,
    });
    const peopleInsert = vi.fn(() => ({ select: peopleSelect }));
    const boardsSelect = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'board-db-1',
          name: 'Core',
          is_exempt: false,
          is_locked: true,
          goals: ['Focus'],
          meeting_link: null,
          sort_order: 0,
          assigned_person_ids: ['person-db-1'],
          user_id: 'user-123',
          created_at: '',
        },
      ],
      error: null,
    });
    const boardsInsert = vi.fn(() => ({ select: boardsSelect }));
    const sessionSingle = vi.fn().mockResolvedValue({
      data: { id: 'session-1' },
      error: null,
    });
    const sessionsInsert = vi.fn(() => ({
      select: () => ({ single: sessionSingle }),
    }));
    const historyInsert = vi.fn().mockResolvedValue({ error: null });

    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const deleteFactory = () => ({ eq: deleteEq });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'people') {
        return { delete: deleteFactory, insert: peopleInsert };
      }
      if (table === 'pairing_boards') {
        return { delete: deleteFactory, insert: boardsInsert };
      }
      if (table === 'pairing_sessions') {
        return { delete: deleteFactory, insert: sessionsInsert };
      }
      if (table === 'pairing_templates') {
        return { delete: deleteFactory, insert: templatesInsert };
      }
      if (table === 'workspace_settings') {
        return { delete: deleteFactory, upsert: workspaceSettingsUpsert };
      }
      if (table === 'pairing_history') {
        return { insert: historyInsert };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const store = makeStore();
    await store.getState().importWorkspace(
      JSON.stringify({
        version: 1,
        exportedAt: '2026-03-27T00:00:00.000Z',
        people: [{ name: 'Alice', avatarColorHex: '#111111' }],
        boards: [
          {
            name: 'Core',
            isExempt: false,
            goals: ['Focus'],
            meetingLink: null,
            assignedPersonNames: ['Alice'],
            isLocked: true,
          },
        ],
        settings: {
          stalePairHighlightingEnabled: true,
          showFullName: true,
          publicViewEnabled: true,
          onboardingCompleted: true,
          stalePairThreshold: 4,
          meetingLinkEnabled: true,
        },
        templates: [{ name: 'Default', boards: [{ name: 'Core' }] }],
        sessions: [
          {
            session_date: '2026-03-20',
            created_at: '2026-03-20T12:00:00.000Z',
            snapshot_data: { boards: [] },
            history: [
              {
                personName: 'Alice',
                boardName: 'Core',
                createdAt: '2026-03-20T12:00:00.000Z',
              },
            ],
          },
        ],
      })
    );

    expect(prefsState.setStalePairHighlighting).toHaveBeenCalledWith(true);
    expect(prefsState.setShowFullName).toHaveBeenCalledWith(true);
    expect(prefsState.setPublicViewEnabled).toHaveBeenCalledWith(true);
    expect(prefsState.setOnboardingCompleted).toHaveBeenCalledWith(true);
    expect(prefsState.setStalePairThreshold).toHaveBeenCalledWith(4);
    expect(prefsState.setMeetingLinkEnabled).toHaveBeenCalledWith(true);
    expect(workspaceSettingsUpsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      public_view_enabled: true,
      onboarding_completed: true,
    });
    expect(templatesInsert).toHaveBeenCalledWith([
      {
        user_id: 'user-123',
        name: 'Default',
        boards: [{ name: 'Core' }],
      },
    ]);
    expect(peopleInsert).toHaveBeenCalledWith([
      {
        user_id: 'user-123',
        name: 'Alice',
        avatar_color_hex: '#111111',
      },
    ]);
    expect(boardsInsert).toHaveBeenCalledWith([
      {
        user_id: 'user-123',
        name: 'Core',
        is_exempt: false,
        goals: ['Focus'],
        meeting_link: null,
        sort_order: 0,
        assigned_person_ids: ['person-db-1'],
      },
    ]);
    expect(historyInsert).toHaveBeenCalledWith([
      {
        user_id: 'user-123',
        session_id: 'session-1',
        person_id: 'person-db-1',
        board_id: 'board-db-1',
        person_name: 'Alice',
        board_name: 'Core',
        created_at: '2026-03-20T12:00:00.000Z',
      },
    ]);
    expect(store.getState().people).toEqual([
      { id: 'person-db-1', name: 'Alice', avatarColorHex: '#111111' },
    ]);
    expect(store.getState().boards).toEqual([
      {
        id: 'board-db-1',
        name: 'Core',
        isExempt: false,
        isLocked: true,
        sortOrder: 0,
        goals: ['Focus'],
        meetingLink: undefined,
        assignedPersonIds: ['person-db-1'],
      },
    ]);
    expect(mockAddToast).toHaveBeenCalledWith(
      'Workspace imported successfully!',
      'success'
    );
  });

  it('shows an auth error when importing without an authenticated user', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const store = makeStore();

    await store.getState().importWorkspace(
      JSON.stringify({
        version: 1,
        exportedAt: '2026-03-27T00:00:00.000Z',
        people: [],
        boards: [],
      })
    );

    expect(mockAddToast).toHaveBeenCalledWith('Not authenticated.', 'error');
    expect(store.getState().isLoading).toBe(false);
  });

  it('wipes workspace data and resets persisted prefs', async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn(() => ({ eq: deleteEq }));
    mockFrom.mockReturnValue({ delete: del });
    const store = makeStore(people, boards);

    await store.getState().wipeWorkspace();

    expect(store.getState().people).toEqual([]);
    expect(store.getState().boards).toEqual([]);
    expect(prefsState.setPublicViewEnabled).toHaveBeenCalledWith(false);
    expect(prefsState.setOnboardingCompleted).toHaveBeenCalledWith(false);
    expect(prefsState.setShareToken).toHaveBeenCalledWith('');
    expect(mockAddToast).toHaveBeenCalledWith(
      'Workspace data wiped successfully.',
      'success'
    );
  });

  it('shows an auth error when wiping without an authenticated user', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const store = makeStore(people, boards);

    await store.getState().wipeWorkspace();

    expect(mockAddToast).toHaveBeenCalledWith('Not authenticated.', 'error');
    expect(store.getState().isLoading).toBe(false);
    expect(store.getState().people).toEqual(people);
    expect(store.getState().boards).toEqual(boards);
  });
});
