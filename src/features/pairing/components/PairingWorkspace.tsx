import React, { useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
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
import {
  Users,
  X,
  Plus,
  ShieldX,
  Sparkles,
  History,
  Loader2,
} from 'lucide-react';

export function PairingWorkspace() {
  const {
    people,
    boards,
    setBoards,
    addBoard,
    saveSession,
    recommendPairs,
    isLoading: isStoreLoading,
  } = usePairingStore();

  const [isAddingBoard, setIsAddingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardIsExempt, setNewBoardIsExempt] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<DragItem | null>(null);
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<string>>(
    new Set()
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handlePersonClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedPersonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        {/* Main Workspaces Column */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Pairing Boards
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <TemplateManager />

              <button
                onClick={() => recommendPairs()}
                disabled={isStoreLoading}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm border border-neutral-200 hover:bg-neutral-50 transition-all dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 disabled:opacity-50"
              >
                {isStoreLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                ) : (
                  <Sparkles className="h-4 w-4 text-amber-500" />
                )}
                Recommend Pairs
              </button>

              <button
                onClick={saveSession}
                disabled={isStoreLoading}
                className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isStoreLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <History className="h-4 w-4" />
                )}
                Save Session
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => {
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
            {!isAddingBoard ? (
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
            ) : (
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

                <label className="flex items-center gap-2 mb-4 cursor-pointer group">
                  <div
                    onClick={() => setNewBoardIsExempt(!newBoardIsExempt)}
                    className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                      newBoardIsExempt
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  >
                    {newBoardIsExempt && <ShieldX className="h-3 w-3" />}
                  </div>
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    Mark as Exempt (OOO)
                  </span>
                </label>

                <div className="mt-auto flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-brand-500 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingBoard(false);
                      setNewBoardName('');
                      setNewBoardIsExempt(false);
                    }}
                    className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar Pool Column */}
        <div className="xl:w-80">
          <DroppableUnpairedPool
            people={unpairedPeople}
            selectedPersonIds={selectedPersonIds}
            onPersonClick={handlePersonClick}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDragItem ? (
          <div className="relative">
            <DraggablePerson
              person={activeDragItem.person}
              sourceId={activeDragItem.sourceId}
              isOverlay
            />
            {selectedPersonIds.has(activeDragItem.person.id) &&
              selectedPersonIds.size > 1 && (
                <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-neutral-900">
                  {selectedPersonIds.size}
                </div>
              )}
          </div>
        ) : null}
      </DragOverlay>

      {/* Bulk Action / Click-to-Move Bar */}
      {selectedPersonIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full bg-white/95 px-6 py-4 shadow-2xl ring-1 ring-neutral-200 backdrop-blur-md transition-all dark:bg-neutral-900/95 dark:ring-neutral-800">
          <span className="whitespace-nowrap font-semibold text-neutral-900 dark:text-neutral-100">
            {selectedPersonIds.size} selected
          </span>
          <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

          <div className="flex max-w-[50vw] items-center gap-2 overflow-x-auto pb-1 sm:max-w-[60vw]">
            <button
              onClick={() => handleBulkMove('unpaired')}
              className="whitespace-nowrap rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              Move to Pool
            </button>
            {boards.map((b) => (
              <button
                key={b.id}
                onClick={() => handleBulkMove(b.id)}
                className="whitespace-nowrap rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-900/50"
              >
                {b.name}
              </button>
            ))}
          </div>

          <div className="h-6 w-px shrink-0 bg-neutral-200 dark:bg-neutral-700" />
          <button
            onClick={() => setSelectedPersonIds(new Set())}
            className="shrink-0 p-1 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            aria-label="Clear selection"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </DndContext>
  );
}

// A slightly different droppable region for "Unpaired"
function DroppableUnpairedPool({
  people,
  selectedPersonIds,
  onPersonClick,
}: {
  people: Person[];
  selectedPersonIds?: Set<string>;
  onPersonClick?: (id: string, e: React.MouseEvent) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'unpaired',
    data: { type: 'POOL' },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        sticky top-6 flex min-h-[400px] flex-col rounded-2xl border p-5 shadow-xs transition-colors
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

      <div className="flex flex-wrap content-start gap-3 flex-1">
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
      </div>
    </div>
  );
}
