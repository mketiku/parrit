export interface Person {
  id: string;
  name: string;
  avatarColorHex: string;
}

export interface PairingBoard {
  id: string;
  name: string;
  isExempt: boolean;
  isLocked: boolean;
  sortOrder: number;
  goals: string[];
  meetingLink?: string;
  assignedPersonIds?: string[];
}

export interface DragItem {
  type: 'PERSON';
  person: Person;
  sourceId: string; // The ID of the board (or 'unpaired' pool) they came from
}
export interface PersonRecord {
  id: string;
  name: string;
  avatar_color_hex: string;
  user_id: string;
  created_at: string;
}

export interface BoardRecord {
  id: string;
  user_id: string;
  name: string;
  is_exempt: boolean;
  is_locked: boolean;
  goals: string[];
  meeting_link: string | null;
  sort_order: number;
  assigned_person_ids: string[];
  created_at: string;
}

export interface SnapshotPerson {
  id: string;
  name: string;
  avatar_color: string;
}

export interface SnapshotBoard {
  id: string;
  name: string;
  goals: string[];
  meeting_link?: string;
  people: SnapshotPerson[];
}

export interface SnapshotData {
  boards: SnapshotBoard[];
}

export interface HistoryRowPayload {
  person_id: string;
  board_id: string;
  board_name: string;
  person_name: string;
}
