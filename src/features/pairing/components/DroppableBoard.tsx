import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { PairingBoard, Person } from '../types';
import { DraggablePerson } from './DraggablePerson';
import { LayoutDashboard, ShieldX } from 'lucide-react';

interface DroppableBoardProps {
  board: PairingBoard;
  people: Person[];
  selectedPersonIds?: Set<string>;
  onPersonClick?: (id: string, e: React.MouseEvent) => void;
}

export function DroppableBoard({
  board,
  people,
  selectedPersonIds,
  onPersonClick,
}: DroppableBoardProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: board.id,
    data: {
      type: 'BOARD',
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex min-h-[160px] flex-col rounded-2xl border bg-white p-5 shadow-xs transition-colors
        dark:bg-neutral-900 
        ${
          isOver
            ? 'border-indigo-400 bg-indigo-50/50 dark:border-indigo-500/50 dark:bg-indigo-950/20'
            : 'border-neutral-200 dark:border-neutral-800'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {board.isExempt ? (
          <ShieldX className="h-5 w-5 text-neutral-400" />
        ) : (
          <LayoutDashboard className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
        )}
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
          {board.name}
        </h3>
        {board.isExempt && (
          <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            Exempt
          </span>
        )}
      </div>

      {/* Goal Placeholder */}
      {(board.goalText || board.meetingLink) && (
        <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          {board.goalText && <p>{board.goalText}</p>}
          {board.meetingLink && (
            <a
              href={board.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Join Meeting
            </a>
          )}
        </div>
      )}

      {/* Draggable Zone Container */}
      <div
        className={`
          flex flex-1 flex-wrap gap-2 rounded-xl p-3 border-2 border-transparent transition-all
          ${isOver ? 'bg-indigo-100/30 border-indigo-300 border-dashed dark:bg-indigo-900/10 dark:border-indigo-700' : 'bg-neutral-50 dark:bg-neutral-950'}
          ${people.length === 0 && !isOver ? 'border-dashed border-neutral-200 dark:border-neutral-800' : ''}
        `}
      >
        {people.length === 0 ? (
          <span className="flex w-full min-h-[48px] items-center justify-center text-sm font-medium text-neutral-400 dark:text-neutral-500">
            {isOver ? 'Drop to assign' : 'Empty Board'}
          </span>
        ) : (
          people.map((person) => (
            <DraggablePerson
              key={person.id}
              person={person}
              sourceId={board.id}
              isSelected={selectedPersonIds?.has(person.id)}
              onClick={(e) => onPersonClick?.(person.id, e)}
            />
          ))
        )}
      </div>
    </div>
  );
}
