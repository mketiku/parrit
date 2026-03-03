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
  Link as LinkIcon,
  Target,
  ChevronUp,
  ChevronDown,
  RefreshCcw,
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

  const { removeBoard, updateBoard, rotateBoardPair } = usePairingStore();
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
    goals: board.goals || [],
    meetingLink: board.meetingLink || '',
  });
  const [newGoal, setNewGoal] = useState('');
  const [editedName, setEditedName] = useState(board.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  // Auto-save helper — called immediately after any goals/link mutation
  const autoSave = useCallback(
    (goals: string[], meetingLink: string) => {
      updateBoard(board.id, {
        goals,
        meetingLink: meetingLink.trim() || undefined,
      });
    },
    [board.id, updateBoard]
  );

  const addGoal = () => {
    if (!newGoal.trim()) return;
    const updated = [...extraData.goals, newGoal.trim()];
    setExtraData((prev) => ({ ...prev, goals: updated }));
    setNewGoal('');
    autoSave(updated, extraData.meetingLink);
  };

  const removeGoal = (index: number) => {
    const updated = extraData.goals.filter((_, i) => i !== index);
    setExtraData((prev) => ({ ...prev, goals: updated }));
    autoSave(updated, extraData.meetingLink);
  };

  const moveGoal = (index: number, direction: 'up' | 'down') => {
    const other = direction === 'up' ? index - 1 : index + 1;
    if (other < 0 || other >= extraData.goals.length) return;
    const updated = [...extraData.goals];
    [updated[index], updated[other]] = [updated[other], updated[index]];
    setExtraData((prev) => ({ ...prev, goals: updated }));
    autoSave(updated, extraData.meetingLink);
  };

  const [editingGoalIndex, setEditingGoalIndex] = useState<number | null>(null);
  const [editingGoalText, setEditingGoalText] = useState('');

  const startEditGoal = (index: number) => {
    setEditingGoalIndex(index);
    setEditingGoalText(extraData.goals[index]);
  };

  const commitEditGoal = (index: number) => {
    const trimmed = editingGoalText.trim();
    if (!trimmed) {
      // If cleared, remove it
      removeGoal(index);
    } else {
      const updated = extraData.goals.map((g, i) =>
        i === index ? trimmed : g
      );
      setExtraData((prev) => ({ ...prev, goals: updated }));
      autoSave(updated, extraData.meetingLink);
    }
    setEditingGoalIndex(null);
    setEditingGoalText('');
  };

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
        group flex min-h-[120px] sm:min-h-[160px] flex-col rounded-2xl border bg-white p-3 sm:p-5 shadow-xs transition-colors
        dark:bg-neutral-900 
        ${
          isOver
            ? 'border-brand-400 bg-brand-50/50 dark:border-brand-500/50 dark:bg-brand-950/20'
            : hasStalePairs
              ? 'border-amber-300 dark:border-amber-700/60'
              : 'border-neutral-200 dark:border-neutral-800'
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
                onClick={() => rotateBoardPair(board.id)}
                disabled={people.length === 0}
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-brand-500 dark:hover:bg-neutral-800 dark:hover:text-brand-400 disabled:opacity-30"
                title="Rotate pair (Swap one person randomly)"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
              </button>
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

      {!board.isExempt && (
        <>
          {/* Goal / Meeting Link Section */}
          <div className="mb-4">
            {isEditingExtra ? (
              <div className="space-y-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-950/50 border border-neutral-100 dark:border-neutral-800">
                {/* Goals List */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Daily Goals
                  </label>
                  {extraData.goals.map((g, i) => (
                    <div key={i} className="flex items-center gap-1 group/goal">
                      {/* Priority arrows */}
                      <div className="flex flex-col opacity-0 group-hover/goal:opacity-100 transition-opacity">
                        <button
                          onClick={() => moveGoal(i, 'up')}
                          disabled={i === 0}
                          className="p-0.5 text-neutral-300 hover:text-neutral-600 disabled:opacity-20 dark:hover:text-neutral-300"
                          title="Move up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveGoal(i, 'down')}
                          disabled={i === extraData.goals.length - 1}
                          className="p-0.5 text-neutral-300 hover:text-neutral-600 disabled:opacity-20 dark:hover:text-neutral-300"
                          title="Move down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Goal text / inline editor */}
                      {editingGoalIndex === i ? (
                        <input
                          autoFocus
                          value={editingGoalText}
                          onChange={(e) => setEditingGoalText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEditGoal(i);
                            if (e.key === 'Escape') {
                              setEditingGoalIndex(null);
                              setEditingGoalText('');
                            }
                          }}
                          onBlur={() => commitEditGoal(i)}
                          className="flex-1 rounded-lg border border-brand-400 bg-white px-3 py-1.5 text-xs text-neutral-700 outline-none ring-2 ring-brand-500/20 dark:border-brand-600 dark:bg-neutral-900 dark:text-neutral-300"
                        />
                      ) : (
                        <div className="flex flex-1 items-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                          <span className="flex-1 leading-snug">{g}</span>
                        </div>
                      )}

                      {/* Edit & Delete */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/goal:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditGoal(i)}
                          className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800"
                          title="Edit goal"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeGoal(i)}
                          className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                          title="Remove goal"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Target className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                      <input
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && (e.preventDefault(), addGoal())
                        }
                        placeholder="Add a goal..."
                        className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900"
                      />
                    </div>
                    <button
                      onClick={addGoal}
                      className="rounded-lg bg-neutral-200 px-3 text-xs font-bold text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Meeting Link */}
                <div className="space-y-1.5 pt-1">
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
                        autoSave(extraData.goals, extraData.meetingLink)
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
                {board.goals.length > 0 ? (
                  <ul className="space-y-1">
                    {board.goals.map((g, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                        <span className="leading-tight">{g}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] italic text-neutral-400 group-hover/extra:text-neutral-500 flex items-center gap-1.5">
                    <Plus className="h-3 w-3" /> Add daily goals...
                  </p>
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
