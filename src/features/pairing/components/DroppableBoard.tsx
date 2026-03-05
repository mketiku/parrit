import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  LayoutDashboard,
  ShieldX,
  Pencil,
  Trash2,
  Plus,
  Lock,
  Unlock,
  Link as LinkIcon,
  GripVertical,
  AlertTriangle,
} from 'lucide-react';
import { usePairingStore } from '../store/usePairingStore';
import { useStalePairsDetector } from './useStalePairsDetector';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { DraggablePerson } from './DraggablePerson';
import { AnimatePresence } from 'framer-motion';
import type { PairingBoard, Person } from '../types';

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: board.id,
    data: { type: 'BOARD' },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.3 : 1,
  };

  const { removeBoard, updateBoard } = usePairingStore();
  const { stalePairHighlightingEnabled, meetingLinkEnabled } =
    useWorkspacePrefsStore();
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
  const extraEditRef = useRef<HTMLDivElement>(null);

  // Sync internal state with board props only when entering edit mode
  const startEditingExtra = () => {
    setExtraData({
      goalsText: (board.goals || []).join('\n'),
      meetingLink: board.meetingLink || '',
    });
    setIsEditingExtra(true);
  };

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  // Click outside to close extra editing area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isEditingExtra &&
        extraEditRef.current &&
        !extraEditRef.current.contains(event.target as Node)
      ) {
        setIsEditingExtra(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditingExtra]);

  // Auto-save helper — checks for actual content changes before hitting DB
  const autoSave = useCallback(
    (goalsText: string, meetingLink: string) => {
      const parsedGoals = goalsText
        .split('\n')
        .map((g) => g.trim())
        .filter(Boolean);

      const trimmedLink = meetingLink.trim() || undefined;

      // Only update if something actually changed to prevent loops/blanking
      const hasGoalsChanged =
        JSON.stringify(parsedGoals) !== JSON.stringify(board.goals || []);
      const hasLinkChanged = trimmedLink !== board.meetingLink;

      if (hasGoalsChanged || hasLinkChanged) {
        updateBoard(board.id, {
          goals: parsedGoals,
          meetingLink: trimmedLink,
        });
      }
    },
    [board.id, board.goals, board.meetingLink, updateBoard]
  );

  // Trigger save when finishing the "extra" edit session (clickaway or manual close)
  const prevIsEditingExtra = useRef(isEditingExtra);
  useEffect(() => {
    if (prevIsEditingExtra.current === true && isEditingExtra === false) {
      autoSave(extraData.goalsText, extraData.meetingLink);
    }
    prevIsEditingExtra.current = isEditingExtra;
  }, [isEditingExtra, extraData, autoSave]);

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
      style={style}
      className={`group relative flex min-h-[200px] sm:min-h-[240px] flex-col rounded-3xl border-2 p-4 sm:p-5 shadow-sm transition-all duration-300
        ${
          isOver
            ? 'border-brand-500 bg-brand-50/20 shadow-lg shadow-brand-500/10 ring-4 ring-brand-500/5'
            : board.isExempt
              ? 'border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/20'
              : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'
        }
        ${isDragging ? 'cursor-grabbing opacity-80 shadow-2xl z-50' : ''}
        [html[data-exporting='true']_&]:min-h-0 [html[data-exporting='true']_&]:p-5 [html[data-exporting='true']_&]:bg-white [html[data-exporting='true']_&]:shadow-none [html[data-exporting='true']_&]:border-neutral-200
      `}
    >
      {/* Stale Pair Banner */}
      {hasStalePairs && !isOver && !isDragging && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 dark:bg-amber-900/20">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Stale pair — consider rotating
          </span>
        </div>
      )}

      {/* Board Header */}
      <div className="mb-3 sm:mb-4 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {board.isExempt ? (
              <ShieldX className="h-4 w-4 shrink-0 text-neutral-400" />
            ) : (
              <LayoutDashboard className="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" />
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
              </div>
            ) : (
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100 truncate leading-tight">
                {board.name}
              </h3>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {board.isExempt && (
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-400 leading-none">
                Off-Duty
              </span>
            )}
            {board.isLocked && !board.isExempt && (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-brand-500 dark:text-brand-400">
                <Lock className="h-2 w-2" />
                Locked
              </span>
            )}
          </div>
        </div>

        {/* Board actions + Drag Handle */}
        <div className="ml-2 flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-10 sm:group-hover:opacity-100 transition-opacity [html[data-exporting='true']_&]:hidden">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
            title="Drag to reorder"
            aria-label={`Drag to reorder board ${board.name}`}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => updateBoard(board.id, { isExempt: !board.isExempt })}
            className={`rounded-md p-1 transition-colors ${board.isExempt ? 'text-amber-500' : 'text-neutral-500 hover:text-amber-500'}`}
          >
            <ShieldX className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => updateBoard(board.id, { isLocked: !board.isLocked })}
            disabled={board.isExempt}
            className={`rounded-md p-1 transition-colors ${board.isLocked ? 'text-brand-500' : 'text-neutral-500 hover:text-brand-600'}`}
          >
            {board.isLocked ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => removeBoard(board.id)}
            className="rounded-md p-1 text-neutral-500 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!board.isExempt && (
        <div className="mb-4">
          {isEditingExtra ? (
            <div
              ref={extraEditRef}
              className="flex flex-col gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-950/50 border border-neutral-100 dark:border-neutral-800"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Daily Goals
                </label>
                <textarea
                  value={extraData.goalsText}
                  onChange={(e) =>
                    setExtraData((prev) => ({
                      ...prev,
                      goalsText: e.target.value,
                    }))
                  }
                  placeholder="- Ship feature..."
                  className="w-full min-h-[80px] rounded-lg border border-neutral-200 bg-white py-2 px-3 text-xs outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900"
                />
              </div>
              {meetingLinkEnabled && (
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
                      placeholder="Zoom / Meet..."
                      className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={startEditingExtra}
              className="group/extra cursor-pointer space-y-2 rounded-xl border border-transparent p-2 hover:bg-neutral-50 dark:hover:bg-neutral-950/50"
            >
              {(board.goals || []).length > 0 && (
                <ul className="flex flex-col gap-1">
                  {board.goals.map((g, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300"
                    >
                      <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                      <div className="flex-1 leading-relaxed break-words">
                        {g}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
                    requestAnimationFrame(() => input.focus());
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className={`flex items-center gap-1.5 ${(board.goals || []).length > 0 ? 'opacity-0 group-hover/extra:opacity-100' : ''}`}
              >
                <Plus className="h-3 w-3 text-neutral-400" />
                <input
                  name="quick-goal"
                  placeholder="Add daily goal..."
                  className="w-full bg-transparent text-[10px] font-medium text-neutral-600 outline-none"
                />
              </form>
              {meetingLinkEnabled && board.meetingLink && (
                <div className="flex items-center gap-1.5 pt-1">
                  <a
                    href={board.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
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
        </div>
      )}

      {/* Draggable Zone */}
      <div
        className={`flex flex-1 flex-wrap gap-1.5 sm:gap-2 rounded-xl p-2 sm:p-3 border-2 border-transparent transition-all ${
          isOver
            ? 'bg-brand-100/30 border-brand-300 border-dashed dark:bg-brand-900/10'
            : board.isExempt
              ? 'bg-neutral-100/50 dark:bg-neutral-950/20'
              : 'bg-neutral-50 dark:bg-neutral-950'
        }`}
      >
        <AnimatePresence>
          {people.length === 0 ? (
            <span className="flex w-full min-h-[48px] items-center justify-center text-sm font-medium text-neutral-400">
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
