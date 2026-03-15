import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
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
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { DraggablePerson } from './DraggablePerson';
import { motion, AnimatePresence } from 'framer-motion';
import type { PairingBoard, Person } from '../types';

interface DroppableBoardProps {
  board: PairingBoard;
  people: Person[];
  selectedPersonIds?: Set<string>;
  onPersonClick?: (id: string, e: React.MouseEvent) => void;
  isDragActive?: boolean;
}

function DroppableBoardComponent({
  board,
  people,
  selectedPersonIds,
  onPersonClick,
  isDragActive,
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

  const { removeBoard, updateBoard, isRecentPair } = usePairingStore();
  const { stalePairHighlightingEnabled, meetingLinkEnabled } =
    useWorkspacePrefsStore();

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

  // Auto-close goals editor after 30s of inactivity
  useEffect(() => {
    if (!isEditingExtra) return;

    const timer = setTimeout(() => {
      setIsEditingExtra(false);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [isEditingExtra, extraData]);

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
            : isDragActive && !isDragging
              ? board.isExempt
                ? 'border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/20 ring-2 ring-brand-300/40 ring-offset-1'
                : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 ring-2 ring-brand-300/40 ring-offset-1'
              : board.isExempt
                ? 'border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/20'
                : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'
        }
        ${isDragging ? 'cursor-grabbing opacity-80 shadow-2xl z-50' : ''}
        [html[data-exporting='true']_&]:min-h-0 [html[data-exporting='true']_&]:p-5 [html[data-exporting='true']_&]:shadow-none
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
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-tight">
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
        {!isEditing && (
          <div className="ml-2 flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-10 sm:group-hover:opacity-100 transition-opacity [html[data-exporting='true']_&]:hidden">
            <button
              onClick={startEditingExtra}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              title="Edit goals & meeting link"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              title="Rename board"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() =>
                updateBoard(board.id, { isLocked: !board.isLocked })
              }
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                board.isLocked
                  ? 'text-brand-500 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:hover:bg-brand-500/20'
                  : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300'
              }`}
              title={board.isLocked ? 'Unlock board' : 'Lock board assignments'}
            >
              {board.isLocked ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Unlock className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={() => removeBoard(board.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
              title="Delete board"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div
              {...attributes}
              {...listeners}
              className="flex h-7 w-7 cursor-grab items-center justify-center rounded-lg text-neutral-300 hover:bg-neutral-100 hover:text-neutral-400 active:cursor-grabbing dark:text-neutral-600 dark:hover:bg-neutral-800"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>

      {/* Goals & Meeting Link Mini-Editor */}
      <AnimatePresence>
        {isEditingExtra && (
          <motion.div
            ref={extraEditRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden rounded-2xl bg-neutral-50 p-3 ring-1 ring-neutral-200 dark:bg-neutral-800/50 dark:ring-neutral-700 [html[data-exporting='true']_&]:hidden"
          >
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Focus / Goals
                </label>
                <textarea
                  value={extraData.goalsText}
                  onChange={(e) =>
                    setExtraData((prev) => ({
                      ...prev,
                      goalsText: e.target.value,
                    }))
                  }
                  placeholder="What is this pair working on?"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  rows={3}
                />
                <p className="mt-1 text-[9px] text-neutral-400">
                  One goal per line.
                </p>
              </div>

              {meetingLinkEnabled && (
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Meeting Link
                  </label>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-3 w-3 text-neutral-400" />
                    <input
                      type="url"
                      value={extraData.meetingLink}
                      onChange={(e) =>
                        setExtraData((prev) => ({
                          ...prev,
                          meetingLink: e.target.value,
                        }))
                      }
                      placeholder="Zoom, Meet, or Huddle URL..."
                      className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsEditingExtra(false)}
                className="w-full rounded-xl bg-neutral-900 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              >
                Close & Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board Content (Assigned People) */}
      <div className="flex flex-1 flex-col">
        {board.goals && board.goals.length > 0 && (
          <div className="mb-4 space-y-2">
            {board.goals.map((goal, gIdx) => (
              <div key={gIdx} className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <p className="text-[11px] font-medium leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {goal}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2.5">
          <AnimatePresence mode="popLayout">
            {people.map((person) => (
              <DraggablePerson
                key={person.id}
                person={person}
                sourceId={board.id}
                isSelected={selectedPersonIds?.has(person.id)}
                isExempt={board.isExempt}
                onClick={(e) => onPersonClick?.(person.id, e)}
              />
            ))}
          </AnimatePresence>
        </div>

        {people.length === 0 && !isOver && (
          <div className="flex flex-1 items-center justify-center p-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300 dark:text-neutral-700">
              Empty Board
            </span>
          </div>
        )}
      </div>

      {/* Meeting Link Preview (if not editing) */}
      {board.meetingLink && !isEditingExtra && (
        <a
          href={board.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50/50 px-3 py-2 text-[10px] font-bold text-brand-600 transition-colors hover:bg-brand-50 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 [html[data-exporting='true']_&]:hidden"
        >
          <LinkIcon className="h-3 w-3" />
          <span className="truncate">Join Pairing Session</span>
        </a>
      )}
    </div>
  );
}

export const DroppableBoard = memo(DroppableBoardComponent);
