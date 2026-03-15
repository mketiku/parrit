import type {
  Person,
  PairingBoard,
  PersonRecord,
  BoardRecord,
  SnapshotData,
} from '../../types';

export const AVATAR_COLORS = [
  '#6366f1',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#22c55e',
  '#ef4444',
  '#3b82f6',
  '#a855f7',
  '#f97316',
  '#06b6d4',
];

export function rowToPerson(row: PersonRecord): Person {
  return { id: row.id, name: row.name, avatarColorHex: row.avatar_color_hex };
}

export function rowToBoard(row: BoardRecord): PairingBoard {
  return {
    id: row.id,
    name: row.name,
    isExempt: row.is_exempt,
    isLocked: row.is_locked || false,
    sortOrder: row.sort_order,
    goals: row.goals ?? [],
    meetingLink: row.meeting_link ?? undefined,
    assignedPersonIds: row.assigned_person_ids ?? [],
  };
}

export interface HistoryRow {
  user_id: string;
  session_id: string;
  person_id: string;
  board_id: string;
  person_name?: string;
  board_name?: string;
  created_at?: string;
}

export interface ExportedSession {
  session_date: string;
  created_at: string;
  history: {
    personName: string;
    boardName: string;
    createdAt: string;
  }[];
  snapshot_data?: SnapshotData | null;
}

export interface WorkspaceSnapshot {
  version: number;
  exportedAt: string;
  settings?: {
    stalePairHighlightingEnabled: boolean;
    showFullName: boolean;
    publicViewEnabled: boolean;
    onboardingCompleted: boolean;
    stalePairThreshold: number;
    meetingLinkEnabled: boolean;
    slackWebhookUrl: string;
    theme?: string;
  };
  templates?: {
    name: string;
    boards: unknown;
  }[];
  people: { name: string; avatarColorHex: string }[];
  boards: {
    name: string;
    isExempt: boolean;
    goals: string[];
    meetingLink: string | null;
    assignedPersonNames: string[];
    isLocked?: boolean;
  }[];
  sessions?: ExportedSession[];
}
