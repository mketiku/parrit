import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Plus,
  Lock,
  Unlock,
  Link as LinkIcon,
} from 'lucide-react';
import { usePairingStore } from '../store/usePairingStore';
import { useStalePairsDetector } from './useStalePairsDetector';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { AlertTriangle } from 'lucide-react';

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

  const { removeBoard, updateBoard } = usePairingStore();
  const { stalePairHighlightingEnabled } = useWorkspacePrefsStore();
  const { isRecentPair } = useStalePairsDetector();

  const hasStalePairs =
    stalePairHighlightingEnabled &&
    !board.isExempt &&
    people.length >= 2 &&
    people.some((p1, i) =>
      people.slice(i + 1).some((p2) => isRecentPair(p1.id, p2.id))
    );

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingExtra, setIsEditingExtra] = useState(false);
  const [extraData, setExtraData] = useState({
    goalsText: (board.goals || []).join('\n'),
    meetingLink: board.meetingLink || '',
  });
  const [editedName, setEditedName] = useState(board.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal state with board props during rendering
  const [prevBoardProps, setPrevBoardProps] = useState({
    goals: board.goals,
    meetingLink: board.meetingLink,
  });

  if (
    board.goals !== prevBoardProps.goals ||
    board.meetingLink !== prevBoardProps.meetingLink
  ) {
    setPrevBoardProps({ goals: board.goals, meetingLink: board.meetingLink });
    setExtraData({
      goalsText: (board.goals || []).join('\n'),
      meetingLink: board.meetingLink || '',
    });
  }

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  // Auto-save helper — called immediately after any goals/link mutation
  const autoSave = useCallback(
    (goalsText: string, meetingLink: string) => {
      const parsedGoals = goalsText
        .split('\n')
        .map((g) => g.trim())
        .filter(Boolean);

      updateBoard(board.id, {
        goals: parsedGoals,
        meetingLink: meetingLink.trim() || undefined,
      });
    },
    [board.id, updateBoard]
  );

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
        group flex min-h-[200px] sm:min-h-[240px] flex-col rounded-3xl border p-4 sm:p-6 shadow-xs transition-all duration-300
        ${
          board.isExempt
            ? 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 grayscale-[0.5]'
            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
        }
        ${
          isOver
            ? '!border-brand-500 !bg-brand-50/50 dark:!border-brand-500/10 !scale-[1.02] shadow-[0_20px_50px_-12px_rgba(59,130,246,0.25)] ring-4 ring-brand-500/10 !grayscale-0'
            : hasStalePairs
              ? 'border-amber-300 dark:border-amber-700/60'
              : ''
        }
      `}
    >
      {/* Stale Pair Banner */}
      {hasStalePairs && !isOver && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 dark:bg-amber-900/20">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Stale pair — consider rotating
          </span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
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
            <div className="flex-1 min-w-0 flex flex-col">
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100 truncate leading-tight">
                {board.name}
              </h3>
              {board.isExempt && (
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-400 mt-0.5 leading-none">
                  Off-Duty
                </span>
              )}
              {board.isLocked && !board.isExempt && (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-brand-500 dark:text-brand-400 mt-0.5">
                  <Lock className="h-2 w-2" />
                  Locked
                </span>
              )}
            </div>

            {/* Board actions — visible on hover on desktop, always visible on mobile */}
            <div className="ml-auto flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity [html[data-exporting='true']_&]:hidden">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                title="Rename board"
                aria-label={`Rename board ${board.name}`}
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
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-amber-500 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
                title={
                  board.isExempt
                    ? 'Remove Exempt status'
                    : 'Mark as Exempt (Out of Office)'
                }
                aria-label={
                  board.isExempt ? 'Remove Exempt status' : 'Mark as Exempt'
                }
                aria-pressed={board.isExempt}
              >
                <ShieldX className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() =>
                  updateBoard(board.id, { isLocked: !board.isLocked })
                }
                disabled={board.isExempt}
                className={`rounded-md p-1 transition-colors disabled:opacity-30 ${
                  board.isLocked
                    ? 'text-brand-500 hover:bg-brand-50 dark:hover:bg-amber-900/20'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-brand-600 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
                title={
                  board.isLocked
                    ? 'Unlock board (Allow rotation)'
                    : 'Lock board (Prevent rotation)'
                }
                aria-label={board.isLocked ? 'Unlock board' : 'Lock board'}
                aria-pressed={board.isLocked}
              >
                {board.isLocked ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Unlock className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => removeBoard(board.id)}
                className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-neutral-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                title="Delete board"
                aria-label={`Delete board ${board.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {!board.isExempt && (
        <>
          {/* Goal / Meeting Link Section */}
          <div className="mb-4">
            {isEditingExtra ? (
              <div className="flex flex-col gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-950/50 border border-neutral-100 dark:border-neutral-800">
                {/* Goals List */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Daily Goals (One per line)
                  </label>
                  <textarea
                    value={extraData.goalsText}
                    onChange={(e) =>
                      setExtraData((prev) => ({
                        ...prev,
                        goalsText: e.target.value,
                      }))
                    }
                    onBlur={() =>
                      autoSave(extraData.goalsText, extraData.meetingLink)
                    }
                    placeholder="- Ship the new feature..."
                    className="w-full min-h-[80px] rounded-lg border border-neutral-200 bg-white py-2 px-3 text-xs leading-relaxed outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900 resize-y text-neutral-700 dark:text-neutral-300"
                  />
                </div>

                {/* Meeting Link */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Meeting Link
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                    <input
                      value={extraData.meetingLink}
                      onChange={(e) =>
                        setExtraData((prev) => ({
                          ...prev,
                          meetingLink: e.target.value,
                        }))
                      }
                      onBlur={() =>
                        autoSave(extraData.goalsText, extraData.meetingLink)
                      }
                      placeholder="Zoom / Meet link..."
                      className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setIsEditingExtra(false)}
                    className="rounded-md px-2 py-1 text-[10px] font-bold uppercase text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingExtra(true)}
                className="group/extra cursor-pointer space-y-2 rounded-xl border border-transparent p-2 transition-colors hover:border-neutral-100 hover:bg-neutral-50 dark:hover:border-neutral-800 dark:hover:bg-neutral-950/50"
              >
                {(board.goals || []).length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <ul className="flex flex-col gap-1">
                      {board.goals.map((g, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300"
                        >
                          <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                          <div className="flex-1 min-w-0 leading-relaxed break-words whitespace-pre-wrap">
                            {g}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.currentTarget.elements.namedItem(
                          'quick-goal'
                        ) as HTMLInputElement;
                        if (input.value.trim()) {
                          updateBoard(board.id, {
                            goals: [...board.goals, input.value.trim()],
                          });
                          input.value = '';
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 opacity-0 group-hover/extra:opacity-100 transition-opacity [html[data-exporting='true']_&]:hidden"
                    >
                      <Plus className="h-3 w-3 text-neutral-400" />
                      <input
                        name="quick-goal"
                        placeholder="Add another..."
                        aria-label="Add individual goal"
                        className="w-full bg-transparent text-[10px] font-medium text-neutral-600 outline-none placeholder:italic placeholder:text-neutral-400 dark:text-neutral-300"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') e.currentTarget.blur();
                        }}
                      />
                    </form>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.namedItem(
                        'quick-goal'
                      ) as HTMLInputElement;
                      if (input.value.trim()) {
                        updateBoard(board.id, {
                          goals: [...board.goals, input.value.trim()],
                        });
                        input.value = '';
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5"
                  >
                    <Plus className="h-3 w-3 text-neutral-400" />
                    <input
                      name="quick-goal"
                      placeholder="Add daily goal..."
                      className="w-full bg-transparent text-[10px] font-medium text-neutral-600 outline-none placeholder:italic placeholder:text-neutral-400 dark:text-neutral-300"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') e.currentTarget.blur();
                      }}
                    />
                  </form>
                )}
                {board.meetingLink && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <a
                      href={board.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-brand-600 transition-colors hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
                    >
                      <LinkIcon className="h-3 w-3" />
                      <span className="text-[10px] font-extrabold uppercase tracking-tighter hover:underline">
                        Join Meeting
                      </span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>{' '}
          {/* Closes div.mb-4 */}
        </>
      )}

      {/* Draggable Zone */}
      <div
        className={`
          flex flex-1 flex-wrap gap-1.5 sm:gap-2 rounded-xl p-2 sm:p-3 border-2 border-transparent transition-all
          ${
            isOver
              ? 'bg-brand-100/30 border-brand-300 border-dashed dark:bg-brand-900/10 dark:border-brand-700'
              : board.isExempt
                ? 'bg-neutral-100/50 dark:bg-neutral-950/20 border-neutral-200/50 dark:border-neutral-800/50'
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
            <span className="flex w-full min-h-[48px] items-center justify-center text-sm font-medium text-neutral-400 dark:text-neutral-400">
              {isOver ? 'Drop to assign' : 'Empty Board'}
            </span>
          ) : (
            people.map((person) => (
              <DraggablePerson
                key={person.id}
                person={person}
                sourceId={board.id}
                isExempt={board.isExempt}
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
