export interface Person {
  id: string;
  name: string;
  avatarColorHex: string;
}

export interface PairingBoard {
  id: string;
  name: string;
  isExempt: boolean;
  goalText?: string;
  meetingLink?: string;
  assignedPersonIds?: string[];
}

export interface DragItem {
  type: 'PERSON';
  person: Person;
  sourceId: string; // The ID of the board (or 'unpaired' pool) they came from
}
