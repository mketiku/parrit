import React, { useState, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DroppableBoard } from './DroppableBoard';
import { DraggablePerson } from './DraggablePerson';
import type { PairingBoard, Person, DragItem } from '../types';
import { usePairingStore } from '../store/usePairingStore';
import { Users, X, Plus, ShieldX } from 'lucide-react';

export function PairingWorkspace() {
  const { people, boards, setBoards, addBoard } = usePairingStore();
  const [isAddingBoard, setIsAddingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardIsExempt, setNewBoardIsExempt] = useState(false);
  const addBoardInputRef = useRef<HTMLInputElement>(null);

  const handleAddBoard = async () => {
    const name = newBoardName.trim();
    if (!name) {
      setIsAddingBoard(false);
      setNewBoardIsExempt(false);
      return;
    }
    await addBoard(name, newBoardIsExempt);
    setNewBoardName('');
    setNewBoardIsExempt(false);
    setIsAddingBoard(false);
  };

  const handleAddBoardKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddBoard();
    if (e.key === 'Escape') {
      setNewBoardName('');
      setNewBoardIsExempt(false);
      setIsAddingBoard(false);
    }
  };

  // Setup Sensors for Dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeDragItem, setActiveDragItem] = useState<DragItem | null>(null);
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<string>>(
    new Set()
  );
  const [lastClickedPersonId, setLastClickedPersonId] = useState<string | null>(
    null
  );

  // Derive who is Unpaired
  const allAssignedIds = new Set(
    boards.flatMap((b) => b.assignedPersonIds || [])
  );
  const unpairedPeople = people.filter((p) => !allAssignedIds.has(p.id));

  const getDisplayedPeopleIds = () => {
    const ids: string[] = [];
    boards.forEach((b) => {
      const assigned = people.filter((p) =>
        (b.assignedPersonIds || []).includes(p.id)
      );
      assigned.forEach((p) => ids.push(p.id));
    });
    unpairedPeople.forEach((p) => ids.push(p.id));
    return ids;
  };

  const handlePersonClick = (personId: string, e: React.MouseEvent) => {
    setSelectedPersonIds((prev) => {
      const next = new Set(prev);

      if (e.shiftKey && lastClickedPersonId) {
        // Range selection
        const displayedIds = getDisplayedPeopleIds();
        const startIdx = displayedIds.indexOf(lastClickedPersonId);
        const endIdx = displayedIds.indexOf(personId);

        if (startIdx !== -1 && endIdx !== -1) {
          const min = Math.min(startIdx, endIdx);
          const max = Math.max(startIdx, endIdx);
          for (let i = min; i <= max; i++) {
            next.add(displayedIds[i]);
          }
        } else {
          // fallback if something went wrong
          next.add(personId);
        }
      } else {
        // Standard toggle behavior
        if (next.has(personId)) {
          next.delete(personId);
        } else {
          next.add(personId);
        }
      }

      return next;
    });

    setLastClickedPersonId(personId);
  };

  const handleBulkMove = (targetBoardId: string) => {
    if (selectedPersonIds.size === 0) return;

    setBoards((prevBoards) => {
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
        };
      });
    });

    // Clear selection after moving
    setSelectedPersonIds(new Set());
  };

  // Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'PERSON') {
      setActiveDragItem(active.data.current as DragItem);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    // If dropped nowhere, or didn't drop a person
    if (!over || active.data.current?.type !== 'PERSON') {
      if (selectedPersonIds.size > 0) {
        setSelectedPersonIds(new Set());
      }
      return;
    }

    const personId = active.id as string;
    const sourceId = (active.data.current as DragItem).sourceId;
    const targetBoardId = over.id as string;

    const isMultiDrag =
      selectedPersonIds.has(personId) && selectedPersonIds.size > 1;
    const payloadIds = isMultiDrag ? Array.from(selectedPersonIds) : [personId];

    // Clear selection smoothly
    if (selectedPersonIds.size > 0) {
      setSelectedPersonIds(new Set());
    }

    // No change if dropped back where they started (for single item drag scenarios)
    if (!isMultiDrag && sourceId === targetBoardId) return;

    setBoards((prevBoards) => {
      return prevBoards.map((board) => {
        // Remove everyone in payload from their current board
        const newAssigned = (board.assignedPersonIds || []).filter(
          (id) => !payloadIds.includes(id)
        );

        // Add payload to new board (unless it is the 'unpaired' pool we dropped on)
        if (board.id === targetBoardId && targetBoardId !== 'unpaired') {
          return {
            ...board,
            assignedPersonIds: Array.from(
              new Set([...newAssigned, ...payloadIds])
            ),
          };
        }

        return {
          ...board,
          assignedPersonIds: newAssigned,
        };
      });
    });
  };

  const handleDragCancel = () => {
    setActiveDragItem(null);
  };

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
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Pairing Boards
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => {
              const assignedPeople = people.filter((p) =>
                (board.assignedPersonIds || []).includes(p.id)
              );
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

            {/* Add Board card */}
            {isAddingBoard ? (
              <div className="flex min-h-[160px] flex-col justify-center gap-3 rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50/50 p-5 dark:border-indigo-600 dark:bg-indigo-950/20">
                <input
                  ref={addBoardInputRef}
                  autoFocus
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyDown={handleAddBoardKey}
                  placeholder="Board name…"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-2 ring-indigo-500/20 focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-900"
                />
                {/* Exempt toggle */}
                <button
                  onClick={() => setNewBoardIsExempt((v) => !v)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    newBoardIsExempt
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  <ShieldX className="h-3.5 w-3.5" />
                  {newBoardIsExempt
                    ? 'Exempt (e.g. Out of Office)'
                    : 'Mark as Exempt'}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddBoard}
                    className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setNewBoardName('');
                      setNewBoardIsExempt(false);
                      setIsAddingBoard(false);
                    }}
                    className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingBoard(true)}
                className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-200 bg-transparent p-5 text-neutral-400 transition-colors hover:border-indigo-400 hover:text-indigo-500 dark:border-neutral-800 dark:hover:border-indigo-600"
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Add Board</span>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar / Pool */}
        <div className="w-full shrink-0 xl:w-[350px]">
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
                <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-neutral-900">
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
                className="whitespace-nowrap rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
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
            ? 'border-indigo-400 border-dashed bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-950/20'
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
      </div>
    </div>
  );
}
