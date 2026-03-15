import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  LayoutDashboard,
  Pencil,
  Trash2,
  Plus,
  Lock,
  Unlock,
  Link as LinkIcon,
  GripVertical,
  AlertTriangle,
  Moon,
} from 'lucide-react';
import { usePairingStore } from '../store/usePairingStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { useToastStore } from '../../../store/useToastStore';
import { DraggablePerson } from './DraggablePerson';
import { AnimatePresence } from 'framer-motion';
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

  const { removeBoard, updateBoard, pairRecency } = usePairingStore();
  const { stalePairHighlightingEnabled, stalePairThreshold } =
    useWorkspacePrefsStore();
  const { addToast } = useToastStore();

  const hasStalePairs = useMemo(() => {
    if (!stalePairHighlightingEnabled || board.isExempt || people.length < 2)
      return false;
    const threshold = stalePairThreshold || 3;
    const boardPeopleIds = new Set(people.map((p) => p.id));
    // O(s): iterate the stale pairs set and check if both members are on this board,
    // rather than checking all O(n²) board-member combinations.
    for (const [key, count] of Object.entries(pairRecency)) {
      if (count < threshold) continue;
      const sep = key.indexOf(':');
      const a = key.slice(0, sep);
      const b = key.slice(sep + 1);
      if (boardPeopleIds.has(a) && boardPeopleIds.has(b)) return true;
    }
    return false;
  }, [
    stalePairHighlightingEnabled,
    board.isExempt,
    people,
    pairRecency,
    stalePairThreshold,
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [goalsText, setGoalsText] = useState((board.goals || []).join('\n'));
  const [editedName, setEditedName] = useState(board.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const goalsTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  useEffect(() => {
    if (isEditingGoals) goalsTextareaRef.current?.focus();
  }, [isEditingGoals]);

  // Auto-save goals on blur
  const handleGoalsSave = useCallback(() => {
    const parsedGoals = goalsText
      .split('\n')
      .map((g) => g.trim())
      .filter(Boolean);

    // Only update if something actually changed
    if (JSON.stringify(parsedGoals) !== JSON.stringify(board.goals || [])) {
      updateBoard(board.id, { goals: parsedGoals });
      addToast('Goals updated', 'success');
    }
    setIsEditingGoals(false);
  }, [goalsText, board.goals, board.id, updateBoard, addToast]);

  const handleRenameCommit = async () => {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== board.name) {
      try {
        await updateBoard(board.id, { name: trimmed });
        addToast('Board renamed', 'success');
      } catch {
        setEditedName(board.name);
        addToast('Failed to rename board', 'error');
      }
    } else {
      setEditedName(board.name);
    }
    // Only close title editing if not also editing goals
    setIsEditing(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameCommit();
    if (e.key === 'Escape') {
      setEditedName(board.name);
      setIsEditing(false);
      setIsEditingGoals(false);
      setGoalsText((board.goals || []).join('\n'));
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
                ? 'border-neutral-200 bg-neutral-100/50 dark:border-neutral-700 dark:bg-neutral-800/20 ring-2 ring-brand-300/40 ring-offset-1'
                : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 ring-2 ring-brand-300/40 ring-offset-1'
              : board.isExempt
                ? 'border-neutral-200/60 bg-neutral-50 dark:border-neutral-800/60 dark:bg-neutral-900/40'
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
            <button
              onClick={() =>
                updateBoard(board.id, { isExempt: !board.isExempt })
              }
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${
                board.isExempt
                  ? 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
                  : 'text-brand-500 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20'
              }`}
              title={
                board.isExempt
                  ? 'Mark as Active'
                  : 'Mark as Out of Office / Exempt'
              }
            >
              {board.isExempt ? (
                <Moon className="h-4 w-4" />
              ) : (
                <LayoutDashboard className="h-4 w-4" />
              )}
            </button>

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
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-neutral-100 text-[9px] font-bold uppercase tracking-widest text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
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
        {!isEditing && !isEditingGoals && (
          <div className="ml-2 flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-10 sm:group-hover:opacity-100 transition-opacity [html[data-exporting='true']_&]:hidden">
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
              onClick={() => setDeleteConfirmOpen(true)}
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

      {/* Board Content (Goals & Assigned People) */}
      <div className="flex flex-1 flex-col">
        {/* Goals Section - Inline Editable */}
        {isEditingGoals ? (
          <div className="mb-4">
            <textarea
              ref={goalsTextareaRef}
              value={goalsText}
              onChange={(e) => setGoalsText(e.target.value)}
              onBlur={handleGoalsSave}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setGoalsText((board.goals || []).join('\n'));
                  setIsEditingGoals(false);
                }
              }}
              placeholder="What is this pair working on? (one goal per line)"
              className="w-full rounded-xl border-2 border-brand-400 bg-white px-3 py-2 text-[11px] text-neutral-900 outline-none focus:border-brand-500 dark:border-brand-600 dark:bg-neutral-900 dark:text-neutral-100"
              rows={Math.max(3, goalsText.split('\n').length + 1)}
            />
          </div>
        ) : board.goals && board.goals.length > 0 ? (
          <div
            className="mb-4 space-y-2 cursor-pointer group/goals relative rounded-xl p-2 -m-2 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            onClick={() => setIsEditingGoals(true)}
          >
            {board.goals.map((goal, gIdx) => (
              <div key={gIdx} className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <p className="text-[11px] font-medium leading-relaxed text-neutral-600 dark:text-neutral-400 pr-6">
                  {goal}
                </p>
              </div>
            ))}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/goals:opacity-40 transition-opacity">
              <Pencil className="h-3.5 w-3.5 text-neutral-400" />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingGoals(true)}
            className="mb-4 group/add-goal flex items-center gap-2 px-2 py-1 rounded-lg text-[11px] font-medium text-neutral-400 hover:text-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition-all"
          >
            <Plus className="h-3 w-3 transition-transform group-hover/add-goal:rotate-90" />
            <span>Add board focus...</span>
          </button>
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

      {/* Meeting Link Preview */}
      {board.meetingLink && (
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

      {/* Delete Board Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-neutral-900 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="mt-4 text-lg font-black text-neutral-900 dark:text-neutral-100">
              Delete Board?
            </h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-300">
              This will permanently delete{' '}
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                {board.name}
              </span>{' '}
              and move all its members back to the unassigned pool. This cannot
              be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  removeBoard(board.id);
                }}
                className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-red-700 transition-colors"
              >
                Delete Board
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-6 py-3 text-xs font-black uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const DroppableBoard = memo(DroppableBoardComponent);
