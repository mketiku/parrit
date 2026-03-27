import { format } from 'date-fns';
import type {
  PairingBoard,
  Person,
  SnapshotBoard,
  SnapshotPerson,
} from '../types';
import { parseLocalDate } from '../utils/dateUtils';

export interface HistorySession {
  id: string;
  session_date: string;
  created_at: string;
  snapshot_data?: { boards: SnapshotBoard[] };
}

export interface HistoryDetail {
  person_name: string;
  board_name: string;
  avatar_color: string;
}

export interface DbHistoryRow {
  person_id: string;
  board_id: string;
  person_name?: string | null;
  board_name?: string | null;
  people: { name: string; avatar_color_hex: string } | null;
  pairing_boards: { name: string } | null;
}

export function buildUpdatedTimestamp(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function mapSnapshotDetails(
  snapshotBoards: SnapshotBoard[]
): HistoryDetail[] {
  const formatted: HistoryDetail[] = [];
  snapshotBoards.forEach((board: SnapshotBoard) => {
    board.people.forEach((person: SnapshotPerson) => {
      formatted.push({
        board_name: board.name || 'Unknown Board',
        person_name: person.name || 'Unknown Person',
        avatar_color: person.avatar_color || '#94a3b8',
      });
    });
  });
  return formatted;
}

export function mapLegacyHistoryRows(
  rows: DbHistoryRow[],
  storeBoards: PairingBoard[],
  storePeople: Person[]
): HistoryDetail[] {
  return rows
    .filter(
      (row) =>
        (row.board_id || row.board_name) && (row.person_id || row.person_name)
    )
    .map((row) => {
      const storeBoard = storeBoards.find((board) => board.id === row.board_id);
      const storePerson = storePeople.find(
        (person) => person.id === row.person_id
      );

      return {
        board_name:
          row.board_name ||
          row.pairing_boards?.name ||
          storeBoard?.name ||
          'Unknown Board',
        person_name:
          row.person_name ||
          row.people?.name ||
          storePerson?.name ||
          'Unknown Person',
        avatar_color:
          row.people?.avatar_color_hex ||
          storePerson?.avatarColorHex ||
          '#94a3b8',
      };
    });
}

export function groupDetailsByBoard(
  details: HistoryDetail[]
): Record<string, HistoryDetail[]> {
  return details.reduce(
    (acc, curr) => {
      if (!acc[curr.board_name]) acc[curr.board_name] = [];
      acc[curr.board_name].push(curr);
      return acc;
    },
    {} as Record<string, HistoryDetail[]>
  );
}

export function groupSessionsByMonth(
  sessions: HistorySession[]
): Record<string, HistorySession[]> {
  return sessions.reduce(
    (acc, session) => {
      const month = format(parseLocalDate(session.session_date), 'MMMM yyyy');
      if (!acc[month]) acc[month] = [];
      acc[month].push(session);
      return acc;
    },
    {} as Record<string, HistorySession[]>
  );
}
