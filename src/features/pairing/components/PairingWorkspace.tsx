import React, { useState, useRef, useEffect } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import { DroppableBoard } from './DroppableBoard';
import { DraggablePerson } from './DraggablePerson';
import { TemplateManager } from './TemplateManager';
import type { Person, DragItem, PairingBoard } from '../types';
import { usePairingStore } from '../store/usePairingStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { motion } from 'framer-motion';

import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import {
  Users,
  X,
  Plus,
  Sparkles,
  History,
  Loader2,
  HelpCircle,
  LayoutDashboard,
} from 'lucide-react';
import { useTutorialStore } from '../store/useTutorialStore';
import { ProductTutorial } from './ProductTutorial';

export function PairingWorkspace() {
  const {
    people,
    boards,
    setBoards,
    addBoard,
    saveSession,
    recommendPairs,
    isLoading: isStoreLoading,
    isSaving,
  } = usePairingStore();
  const { user } = useAuthStore();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [isAddingBoard, setIsAddingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardIsExempt, setNewBoardIsExempt] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<DragItem | null>(null);
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<string>>(
    new Set()
  );

  const { startTutorial } = useTutorialStore();
  const { onboardingCompleted } = useWorkspacePrefsStore();

  useEffect(() => {
    // Auto-start tutorial if not completed and workspace is empty (likely first visit)
    if (!onboardingCompleted && people.length === 0 && !isStoreLoading) {
      startTutorial();
    }
  }, [onboardingCompleted, people.length, isStoreLoading, startTutorial]);

  const username = user?.email?.split('@')[0] || 'Workspace';
  const workspaceTitle =
    username.charAt(0).toUpperCase() + username.slice(1) + ' Workspace';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handlePersonClick = (personId: string, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      setSelectedPersonIds((prev) => {
        const next = new Set(prev);
        if (next.has(personId)) {
          next.delete(personId);
        } else {
          next.add(personId);
        }
        return next;
      });
    } else {
      setSelectedPersonIds(new Set([personId]));
    }
  };

  const handleBulkMove = (targetBoardId: string) => {
    if (selectedPersonIds.size === 0) return;

    setBoards((prevBoards: PairingBoard[]) => {
      return prevBoards.map((board) => {
        // Remove selected people from their current boards
        const newAssigned = (board.assignedPersonIds || []).filter(
          (id) => !selectedPersonIds.has(id)
        );

        // Add them to the new board
        if (board.id === targetBoardId && targetBoardId !== 'unpaired') {
          return {
            ...board,
            assignedPersonIds: [
              ...newAssigned,
              ...Array.from(selectedPersonIds),
            ],
          };
        }

        return {
          ...board,
          assignedPersonIds: newAssigned,
        } as PairingBoard;
      });
    });

    // Clear selection after moving
    setSelectedPersonIds(new Set());
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'PERSON') {
      setActiveDragItem(active.data.current as DragItem);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    setActiveDragItem(null);

    if (!over) return;

    const dragItem = active.data.current as DragItem;
    const targetBoardId = over.id as string;

    // If we're dragging one of the selected people, move the whole selection
    if (selectedPersonIds.has(dragItem.person.id)) {
      handleBulkMove(targetBoardId);
      return;
    }

    // Standard single-person move
    setBoards((prevBoards: PairingBoard[]) => {
      return prevBoards.map((board) => {
        const isSource = board.id === dragItem.sourceId;
        const isTarget = board.id === targetBoardId;

        let nextAssigned = [...(board.assignedPersonIds || [])];

        if (isSource) {
          nextAssigned = nextAssigned.filter((id) => id !== dragItem.person.id);
        }

        if (isTarget && targetBoardId !== 'unpaired') {
          if (!nextAssigned.includes(dragItem.person.id)) {
            nextAssigned.push(dragItem.person.id);
          }
        }

        return { ...board, assignedPersonIds: nextAssigned } as PairingBoard;
      });
    });
  };

  const handleDragCancel = () => {
    setActiveDragItem(null);
  };

  const handleAddBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    await addBoard(newBoardName.trim(), newBoardIsExempt);
    setNewBoardName('');
    setNewBoardIsExempt(false);
    setIsAddingBoard(false);
  };

  const allAssignedIds = new Set(
    boards.flatMap((b) => b.assignedPersonIds || [])
  );
  const unpairedPeople = people.filter((p) => !allAssignedIds.has(p.id));

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start pb-24 sm:pb-0">
          {/* Main Workspaces Column */}
          <div
            ref={dashboardRef}
            className="flex-1 min-w-0 space-y-4 sm:space-y-6"
          >
            {/* 
              Visible only in Screenshot: Show full workspace identity 
              Hidden in App: Prevents repetition with the page-level H1
            */}
            <div className="hidden [html[data-exporting='true']_&]:block mb-8">
              <h2 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
                {workspaceTitle}
              </h2>
              <div className="h-1 w-20 bg-brand-500 mt-2" />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8">
              <div className="flex flex-col">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  Active Pairing Boards
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Live Session
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <TemplateManager />

                <button
                  id="recommend-btn"
                  onClick={() => recommendPairs()}
                  disabled={isStoreLoading}
                  className="flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-neutral-700 shadow-sm border border-neutral-200 hover:bg-neutral-50 transition-all dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isStoreLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  )}
                  Recommend Pairs
                </button>

                <button
                  id="save-session-btn"
                  onClick={saveSession}
                  disabled={isSaving}
                  className="flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl bg-brand-500 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <History className="h-4 w-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Session'}
                </button>
              </div>
            </div>

            <div
              id="board-list"
              className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            >
              {/* Loading State: Skeleton Screens */}
              {isStoreLoading && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <BoardSkeleton key={`skeleton-${i}`} index={i} />
                  ))}
                </>
              )}

              {boards.length === 0 && !isAddingBoard && !isStoreLoading && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/40 animate-in fade-in zoom-in-95 duration-700">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 animate-ping rounded-full bg-brand-500/10" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
                      <LayoutDashboard className="h-10 w-10 text-brand-500" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                    Your Workspace is Ready
                  </h2>
                  <p className="mt-2 text-neutral-500 dark:text-neutral-400 max-w-xs text-center font-medium">
                    Start by creating your first pairing board. Drag people onto
                    boards to build your team.
                  </p>
                  <button
                    onClick={() => setIsAddingBoard(true)}
                    className="mt-8 flex items-center gap-2 rounded-2xl bg-brand-500 px-6 py-3 font-bold text-white shadow-[0_10px_30px_-10px_rgba(59,130,246,0.5)] transition-all hover:bg-brand-600 active:scale-95"
                  >
                    <Plus className="h-5 w-5" />
                    Create First Board
                  </button>
                </div>
              )}
              {!isStoreLoading &&
                boards.map((board) => {
                  const assignedPeople = (board.assignedPersonIds || [])
                    .map((id) => people.find((p) => p.id === id))
                    .filter((p): p is Person => !!p);

                  return (
                    <DroppableBoard
                      key={board.id}
                      board={board}
                      people={assignedPeople}
                      selectedPersonIds={selectedPersonIds}
                      onPersonClick={handlePersonClick}
                    />
                  );
                })}

              {/* Add Board Trigger */}
              {boards.length > 0 && !isAddingBoard && !isStoreLoading && (
                <button
                  onClick={() => setIsAddingBoard(true)}
                  className="group flex min-h-[160px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 p-5 transition-all hover:border-brand-400 hover:bg-brand-50/30 dark:border-neutral-800 dark:hover:border-brand-500/50 dark:hover:bg-brand-950/10"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 transition-colors group-hover:bg-brand-100 group-hover:text-brand-500 dark:bg-neutral-800 dark:group-hover:bg-brand-900/40">
                    <Plus className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-neutral-500 group-hover:text-brand-600 dark:text-neutral-400 dark:group-hover:text-brand-400">
                    Add Board
                  </span>
                </button>
              )}

              {/* Add Board Form */}
              {isAddingBoard && (
                <form
                  onSubmit={handleAddBoard}
                  className="flex min-h-[160px] flex-col rounded-2xl border-2 border-brand-400 bg-white p-5 shadow-lg ring-4 ring-brand-500/10 animate-in zoom-in-95 duration-200 dark:bg-neutral-900 dark:border-brand-500/50"
                >
                  <input
                    autoFocus
                    placeholder="Board name..."
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    className="mb-4 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100"
                  />
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newBoardIsExempt}
                        onChange={(e) => setNewBoardIsExempt(e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500/20"
                      />
                      <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        Exempt/Off-Duty
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingBoard(false)}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-600 transition-colors"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar Pool Column */}
          <DroppableUnpairedPool
            people={unpairedPeople}
            selectedPersonIds={selectedPersonIds}
            onPersonClick={handlePersonClick}
            isLoading={isStoreLoading}
          />

          {/* Manual Tutorial Trigger */}
          <button
            onClick={() => startTutorial()}
            className="fixed bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-400 shadow-xl border border-neutral-200 transition-all hover:text-brand-500 hover:scale-110 active:scale-95 z-40 dark:bg-neutral-900 dark:border-neutral-800"
            title="Help & Tutorial"
          >
            <HelpCircle className="h-6 w-6" />
          </button>

          {selectedPersonIds.size > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-neutral-900 text-white px-6 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 border border-white/10 dark:bg-neutral-800">
              <span className="text-sm font-bold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                {selectedPersonIds.size} teammate
                {selectedPersonIds.size > 1 ? 's' : ''} selected
              </span>
              <div className="h-4 w-px bg-white/20 mx-2" />
              <button
                onClick={() => setSelectedPersonIds(new Set())}
                className="shrink-0 p-1 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                aria-label="Clear selection"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </DndContext>

      <ProductTutorial />

      {/* Global Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {activeDragItem ? (
          <DraggablePerson
            person={activeDragItem.person}
            sourceId={activeDragItem.sourceId}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </>
  );
}

// A slightly different droppable region for "Unpaired"
function DroppableUnpairedPool({
  people,
  selectedPersonIds,
  onPersonClick,
  isLoading,
}: {
  people: Person[];
  selectedPersonIds?: Set<string>;
  onPersonClick?: (id: string, e: React.MouseEvent) => void;
  isLoading?: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'unpaired',
    data: { type: 'POOL' },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        xl:sticky xl:top-6 flex xl:min-h-[400px] flex-col rounded-2xl border p-3 sm:p-4 xl:p-5 shadow-xs transition-colors
        ${
          isOver
            ? 'border-brand-400 border-dashed bg-brand-50 dark:border-brand-500/50 dark:bg-brand-950/20'
            : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
        }
      `}
    >
      <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-4 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Unpaired Pool
          </h3>
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          {people.length}
        </span>
      </div>

      <div className="flex max-h-[150px] overflow-y-auto no-scrollbar xl:max-h-none xl:overflow-visible flex-wrap content-start gap-2 sm:gap-3 flex-1">
        {isLoading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <PersonSkeleton key={`person-skeleton-${i}`} />
            ))}
          </>
        ) : (
          <AnimatePresence>
            {people.length === 0 ? (
              <span className="flex w-full items-center justify-center text-sm font-medium text-neutral-400 mt-10 dark:text-neutral-500">
                {isOver ? 'Drop to unpair' : 'Everyone is paired!'}
              </span>
            ) : (
              people.map((person) => (
                <DraggablePerson
                  key={person.id}
                  person={person}
                  sourceId="unpaired"
                  isSelected={selectedPersonIds?.has(person.id)}
                  onClick={(e) => onPersonClick?.(person.id, e)}
                />
              ))
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function BoardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex min-h-[240px] flex-col rounded-[2rem] border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        <div className="h-4 w-32 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-12 w-24 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/50 animate-pulse" />
        <div className="h-12 w-32 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/50 animate-pulse" />
      </div>
      <div className="mt-auto pt-6 border-t border-neutral-100 dark:border-neutral-800/50">
        <div className="h-3 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      </div>
    </motion.div>
  );
}

function PersonSkeleton() {
  return (
    <div className="h-12 w-32 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse border border-neutral-200/50 dark:border-neutral-700/30" />
  );
}
