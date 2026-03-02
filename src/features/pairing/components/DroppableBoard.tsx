import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { PairingBoard, Person } from '../types';
import { DraggablePerson } from './DraggablePerson';
import { AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShieldX,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { usePairingStore } from '../store/usePairingStore';

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
    data: { type: 'BOARD' },
  });

  const { updateBoard, removeBoard } = usePairingStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(board.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleRenameCommit = async () => {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== board.name) {
      await updateBoard(board.id, { name: trimmed });
    } else {
      setEditedName(board.name);
    }
    setIsEditing(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameCommit();
    if (e.key === 'Escape') {
      setEditedName(board.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        group flex min-h-[160px] flex-col rounded-2xl border bg-white p-5 shadow-xs transition-colors
        dark:bg-neutral-900 
        ${
          isOver
            ? 'border-brand-400 bg-brand-50/50 dark:border-brand-500/50 dark:bg-brand-950/20'
            : 'border-neutral-200 dark:border-neutral-800'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {board.isExempt ? (
          <ShieldX className="h-5 w-5 shrink-0 text-neutral-400" />
        ) : (
          <LayoutDashboard className="h-5 w-5 shrink-0 text-brand-500 dark:text-brand-400" />
        )}

        {isEditing ? (
          <div className="flex flex-1 items-center gap-1">
            <input
              ref={inputRef}
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameCommit}
              className="min-w-0 flex-1 rounded-md border border-brand-400 bg-white px-2 py-0.5 text-sm font-semibold text-neutral-900 outline-none ring-2 ring-brand-500/20 dark:border-brand-600 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <button
              onClick={handleRenameCommit}
              className="shrink-0 text-brand-500 hover:text-brand-700"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setEditedName(board.name);
                setIsEditing(false);
              }}
              className="shrink-0 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <h3 className="flex-1 font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {board.name}
            </h3>

            {board.isExempt && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                Exempt
              </span>
            )}

            {/* Board actions — visible on hover */}
            <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                title="Rename board"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() =>
                  updateBoard(board.id, { isExempt: !board.isExempt })
                }
                className={`rounded-md p-1 transition-colors ${
                  board.isExempt
                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                    : 'text-neutral-400 hover:bg-neutral-100 hover:text-amber-500 dark:hover:bg-neutral-800'
                }`}
                title={
                  board.isExempt
                    ? 'Remove Exempt status'
                    : 'Mark as Exempt (Out of Office)'
                }
              >
                <ShieldX className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => removeBoard(board.id)}
                className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                title="Delete board"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Goal / Meeting Link */}
      {(board.goalText || board.meetingLink) && (
        <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          {board.goalText && <p>{board.goalText}</p>}
          {board.meetingLink && (
            <a
              href={board.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 text-brand-600 hover:underline dark:text-brand-400"
            >
              Join Meeting
            </a>
          )}
        </div>
      )}

      {/* Draggable Zone */}
      <div
        className={`
          flex flex-1 flex-wrap gap-2 rounded-xl p-3 border-2 border-transparent transition-all
          ${
            isOver
              ? 'bg-brand-100/30 border-brand-300 border-dashed dark:bg-brand-900/10 dark:border-brand-700'
              : 'bg-neutral-50 dark:bg-neutral-950'
          }
          ${
            people.length === 0 && !isOver
              ? 'border-dashed border-neutral-200 dark:border-neutral-800'
              : ''
          }
        `}
      >
        <AnimatePresence>
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
        </AnimatePresence>
      </div>
    </div>
  );
}
