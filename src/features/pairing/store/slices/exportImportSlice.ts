import { z } from 'zod';
import type { StateCreator } from 'zustand';
import { supabase } from '../../../../lib/supabase';
import { useToastStore } from '../../../../store/useToastStore';
import { useWorkspacePrefsStore } from '../../../../store/useWorkspacePrefsStore';
import { rowToPerson, rowToBoard } from './helpers';
import type { PersonRecord, BoardRecord, SnapshotData } from '../../types';
import type { PairingStore } from '../usePairingStore';

const toast = () => useToastStore.getState();

const WorkspaceSnapshotSchema = z.object({
  version: z.number(),
  exportedAt: z.string(),
  people: z.array(z.object({ name: z.string(), avatarColorHex: z.string() })),
  boards: z.array(
    z.object({
      name: z.string(),
      isExempt: z.boolean(),
      goals: z.array(z.string()).optional().default([]),
      meetingLink: z.string().nullable().optional(),
      assignedPersonNames: z.array(z.string()).optional().default([]),
      isLocked: z.boolean().optional(),
    })
  ),
  settings: z
    .object({
      stalePairHighlightingEnabled: z.boolean(),
      showFullName: z.boolean(),
      publicViewEnabled: z.boolean(),
      onboardingCompleted: z.boolean(),
      stalePairThreshold: z.number(),
      meetingLinkEnabled: z.boolean(),
      slackWebhookUrl: z.string(),
      theme: z.string().optional(),
    })
    .optional(),
  templates: z
    .array(z.object({ name: z.string(), boards: z.unknown() }))
    .optional(),
  sessions: z
    .array(
      z.object({
        session_date: z.string(),
        created_at: z.string(),
        snapshot_data: z.unknown().nullable().optional(),
        history: z
          .array(
            z.object({
              personName: z.string(),
              boardName: z.string(),
              createdAt: z.string(),
            })
          )
          .optional()
          .default([]),
      })
    )
    .optional(),
});

type WorkspaceSnapshot = z.infer<typeof WorkspaceSnapshotSchema>;

export interface ExportImportSlice {
  exportWorkspace: (includeHistory?: boolean) => Promise<string>;
  importWorkspace: (json: string) => Promise<void>;
}

export const createExportImportSlice: StateCreator<
  PairingStore,
  [],
  [],
  ExportImportSlice
> = (set, get) => ({
  exportWorkspace: async (includeHistory = true) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return '';

    const { people, boards } = get();
    // Get latest preferences from store
    const prefs = useWorkspacePrefsStore.getState();

    const snapshot: WorkspaceSnapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: {
        stalePairHighlightingEnabled: prefs.stalePairHighlightingEnabled,
        showFullName: prefs.showFullName,
        publicViewEnabled: prefs.publicViewEnabled,
        onboardingCompleted: prefs.onboardingCompleted,
        stalePairThreshold: prefs.stalePairThreshold,
        meetingLinkEnabled: prefs.meetingLinkEnabled,
        slackWebhookUrl: prefs.slackWebhookUrl,
      },
      people: people.map((p) => ({
        name: p.name,
        avatarColorHex: p.avatarColorHex,
      })),
      boards: boards.map((b) => ({
        name: b.name,
        isExempt: b.isExempt,
        isLocked: b.isLocked,
        goals: b.goals,
        meetingLink: b.meetingLink ?? null,
        assignedPersonNames: (b.assignedPersonIds ?? [])
          .map((id) => people.find((p) => p.id === id)?.name)
          .filter(Boolean) as string[],
      })),
    };

    // Fetch templates
    const { data: templatesData } = await supabase
      .from('pairing_templates')
      .select('name, boards')
      .eq('user_id', user.id);

    if (templatesData) {
      snapshot.templates = templatesData.map((t) => ({
        name: t.name,
        boards: t.boards,
      }));
    }

    if (includeHistory) {
      const { data: sessionsData } = await supabase
        .from('pairing_sessions')
        .select(
          `
          id,
          session_date,
          created_at,
          snapshot_data,
          pairing_history (
            person_id,
            board_id,
            person_name,
            board_name,
            created_at,
            people (name),
            pairing_boards (name)
          )
        `
        )
        .eq('user_id', user.id)
        .order('session_date', { ascending: true });

      if (sessionsData) {
        snapshot.sessions = (
          sessionsData as unknown as Array<{
            session_date: string;
            created_at: string;
            snapshot_data: SnapshotData | null;
            pairing_history: Array<{
              person_name: string | null;
              board_name: string | null;
              people: { name: string } | null;
              pairing_boards: { name: string } | null;
              created_at: string;
            }>;
          }>
        ).map((s) => ({
          session_date: s.session_date,
          created_at: s.created_at,
          snapshot_data: s.snapshot_data,
          history: (s.pairing_history || []).map((h) => ({
            personName: h.person_name || h.people?.name || 'Unknown Person',
            boardName:
              h.board_name || h.pairing_boards?.name || 'Unknown Board',
            createdAt: h.created_at,
          })),
        }));
      }
    }

    return JSON.stringify(snapshot, null, 2);
  },

  importWorkspace: async (json: string) => {
    set({ isLoading: true });
    try {
      const raw = JSON.parse(json);
      const parseResult = WorkspaceSnapshotSchema.safeParse(raw);
      if (!parseResult.success) {
        throw new Error(
          `Invalid workspace file: ${parseResult.error.issues.map((i) => i.message).join(', ')}`
        );
      }
      const snapshot = parseResult.data;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated.');

      // 1. Clear everything
      await Promise.all([
        supabase.from('people').delete().eq('user_id', user.id),
        supabase.from('pairing_boards').delete().eq('user_id', user.id),
        supabase.from('pairing_sessions').delete().eq('user_id', user.id),
        supabase.from('pairing_templates').delete().eq('user_id', user.id),
        supabase.from('workspace_settings').delete().eq('user_id', user.id),
      ]);

      // 2. Restore settings and prefs if present
      if (snapshot.settings) {
        const s = snapshot.settings;
        const prefs = useWorkspacePrefsStore.getState();

        // Update local store
        prefs.setStalePairHighlighting(s.stalePairHighlightingEnabled);
        prefs.setShowFullName(s.showFullName);
        prefs.setPublicViewEnabled(s.publicViewEnabled);
        prefs.setOnboardingCompleted(s.onboardingCompleted);
        prefs.setStalePairThreshold(s.stalePairThreshold);
        prefs.setMeetingLinkEnabled(s.meetingLinkEnabled);
        prefs.setSlackWebhookUrl(s.slackWebhookUrl);

        // Update DB workspace_settings
        await supabase.from('workspace_settings').upsert({
          user_id: user.id,
          public_view_enabled: s.publicViewEnabled,
          onboarding_completed: s.onboardingCompleted,
        });
      }

      // 3. Restore templates if present
      if (snapshot.templates && Array.isArray(snapshot.templates)) {
        const templateRows = snapshot.templates.map((t) => ({
          user_id: user.id,
          name: t.name,
          boards: t.boards,
        }));
        await supabase.from('pairing_templates').insert(templateRows);
      }

      // 4. Create new people
      const peopleRows = snapshot.people.map((p) => ({
        user_id: user.id,
        name: p.name,
        avatar_color_hex: p.avatarColorHex,
      }));

      const { data: createdPeople, error: peopleErr } = await supabase
        .from('people')
        .insert(peopleRows)
        .select();
      if (peopleErr) throw peopleErr;

      // Build name → new ID map
      const nameToId: Record<string, string> = {};
      (createdPeople as PersonRecord[]).forEach((row) => {
        nameToId[row.name.trim()] = row.id;
      });

      // 5. Create new boards
      const boardRows = snapshot.boards.map((b, i) => ({
        user_id: user.id,
        name: b.name,
        is_exempt: b.isExempt,
        goals: b.goals ?? [],
        meeting_link: b.meetingLink ?? null,
        sort_order: i,
        assigned_person_ids: (b.assignedPersonNames ?? [])
          .map((name) => nameToId[name.trim()])
          .filter(Boolean),
      }));

      const { data: createdBoards, error: boardsErr } = await supabase
        .from('pairing_boards')
        .insert(boardRows)
        .select();
      if (boardsErr) throw boardsErr;

      // Build board name → id map
      const boardNameToId: Record<string, string> = {};
      (createdBoards as BoardRecord[]).forEach((row) => {
        boardNameToId[row.name.trim()] = row.id;
      });

      // 6. Restore Sessions & History if present
      if (snapshot.sessions && Array.isArray(snapshot.sessions)) {
        for (const s of snapshot.sessions) {
          const { data: session, error: sErr } = await supabase
            .from('pairing_sessions')
            .insert({
              user_id: user.id,
              session_date: s.session_date,
              created_at: s.created_at,
              snapshot_data: s.snapshot_data ?? {},
            })
            .select()
            .single();

          if (sErr || !session) {
            console.error('Session import error:', sErr);
            continue;
          }

          const historyRows = (s.history || []).map((h) => ({
            user_id: user.id,
            session_id: session.id,
            person_id: nameToId[h.personName.trim()],
            board_id: boardNameToId[h.boardName.trim()],
            person_name: h.personName,
            board_name: h.boardName,
            created_at: h.createdAt,
          }));

          if (historyRows.length > 0) {
            const { error: hErr } = await supabase
              .from('pairing_history')
              .insert(historyRows);
            if (hErr) {
              console.error('History insert error:', hErr);
            }
          }
        }
      }

      set({
        people: (createdPeople as PersonRecord[]).map(rowToPerson),
        boards: (createdBoards as BoardRecord[]).map(rowToBoard),
        isLoading: false,
      });
      toast().addToast('Workspace imported successfully!', 'success');
    } catch (err: unknown) {
      set({ isLoading: false });
      const msg = err instanceof Error ? err.message : 'Import failed.';
      toast().addToast(msg, 'error');
    }
  },
});
