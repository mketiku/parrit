import type { StateCreator } from 'zustand';
import { supabase } from '../../../../lib/supabase';
import { useToastStore } from '../../../../store/useToastStore';
import { useWorkspacePrefsStore } from '../../../../store/useWorkspacePrefsStore';
import { formatLocalDate } from '../../utils/dateUtils';
import type { SnapshotData, HistoryRowPayload } from '../../types';
import type { PairingStore } from '../usePairingStore';

const toast = () => useToastStore.getState();

export interface SessionSlice {
  saveSession: () => Promise<void>;
}

export const createSessionSlice: StateCreator<
  PairingStore,
  [],
  [],
  SessionSlice
> = (set, get) => ({
  saveSession: async () => {
    if (get().isSaving) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { boards } = get();
    // Validate we actually have some assignments to save
    const hasAssignments = boards.some(
      (b) => (b.assignedPersonIds ?? []).length > 0
    );
    if (!hasAssignments) {
      toast().addToast(
        'Nothing to save! The nest is empty. Assign some people to boards first. 🪹',
        'info'
      );
      return;
    }

    set({ isSaving: true });

    // 1. Prepare data for Atomic Save
    const session_date = formatLocalDate(new Date());

    // Prepare the "Polaroid" snapshot (Strategy #2)
    const snapshot_data: SnapshotData = {
      boards: boards.map((b) => ({
        id: b.id,
        name: b.name,
        goals: b.goals,
        meeting_link: b.meetingLink,
        people: (b.assignedPersonIds ?? []).map((pid) => {
          const p = get().people.find((person) => person.id === pid);
          return {
            id: pid,
            name: p?.name || 'Unknown',
            avatar_color: p?.avatarColorHex || '#94a3b8',
          };
        }),
      })),
    };

    // Prepare normalized rows for analytics (backward compatibility)
    const historyRows: HistoryRowPayload[] = [];
    boards.forEach((board) => {
      (board.assignedPersonIds ?? []).forEach((personId) => {
        const person = get().people.find((p) => p.id === personId);
        historyRows.push({
          person_id: personId,
          board_id: board.id,
          board_name: board.name,
          person_name: person?.name || 'Unknown',
        });
      });
    });

    // 2. Perform Atomic Save via RPC
    const { error: saveErr } = await supabase.rpc('save_pairing_session', {
      p_user_id: user.id,
      p_session_date: session_date,
      p_snapshot_data: snapshot_data,
      p_history_rows: historyRows,
    });

    if (saveErr) {
      set({ isSaving: false });
      toast().addToast(`Failed to save session: ${saveErr.message}`, 'error');
      return;
    }

    // Only apply artificial delay in local dev where network is instantaneous
    if (import.meta.env.DEV) {
      await get()._delay(500);
    }

    set({ isSaving: false });
    toast().addToast('Pairing session saved successfully!', 'success');

    // Fire chat webhook if configured
    const { slackWebhookUrl } = useWorkspacePrefsStore.getState();
    if (slackWebhookUrl.trim()) {
      const { boards: currentBoards, people: currentPeople } = get();
      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      // Build board lines, skip empty boards
      const boardLines = currentBoards
        .filter((b) => (b.assignedPersonIds ?? []).length > 0)
        .map((b) => {
          const names = (b.assignedPersonIds ?? [])
            .map((id) => currentPeople.find((p) => p.id === id)?.name ?? id)
            .join(' + ');
          const goalLines =
            (b.goals ?? []).length > 0
              ? '\n' + (b.goals ?? []).map((g) => `   _${g}_`).join('\n')
              : '';
          return `• *${b.name}*: ${names}${goalLines}`;
        });

      const text = `:hatching_chick: *Parrit Pairing Status — ${today}*\n${boardLines.join('\n')}`;

      // Support Slack (use 'text'), Discord (use 'content'), and Teams (use 'text')
      try {
        // Use 'no-cors' mode and 'text/plain' to bypass browser preflight CORS checks.
        // This is a "fire and forget" request since we don't care about the response.
        await fetch(slackWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ text, content: text }),
        });
      } catch {
        useToastStore
          .getState()
          .addToast('Webhook notification failed to send.', 'info');
      }
    }
  },
});
