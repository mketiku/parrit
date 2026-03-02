import React, { useState } from 'react';
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
import { Users } from 'lucide-react';

const MOCK_PEOPLE: Person[] = [
  { id: '1', name: 'Alice Bob', avatarColorHex: '#6366f1' },
  { id: '2', name: 'Charlie Dave', avatarColorHex: '#ec4899' },
  { id: '3', name: 'Eve Foster', avatarColorHex: '#14b8a6' },
  { id: '4', name: 'Greg House', avatarColorHex: '#f59e0b' },
];

const MOCK_BOARDS: PairingBoard[] = [
  {
    id: 'board-1',
    name: 'Phoenix',
    isExempt: false,
    goalText: 'Auth UI',
    assignedPersonIds: ['1', '2'],
  },
  {
    id: 'board-2',
    name: 'Macaw',
    isExempt: false,
    goalText: 'API Fixes',
    assignedPersonIds: ['3'],
  },
  {
    id: 'board-ooo',
    name: 'Out of Office',
    isExempt: true,
    assignedPersonIds: [],
  },
];

export function PairingWorkspace() {
  // Setup Sensors for Dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag activates (helps with buttons vs drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Local state for demonstration
  const [people, setPeople] = useState<Person[]>(MOCK_PEOPLE);
  const [boards, setBoards] = useState<PairingBoard[]>(MOCK_BOARDS);
  const [activeDragItem, setActiveDragItem] = useState<DragItem | null>(null);

  // Derive who is Unpaired
  const allAssignedIds = new Set(
    boards.flatMap((b) => b.assignedPersonIds || [])
  );
  const unpairedPeople = people.filter((p) => !allAssignedIds.has(p.id));

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
    if (!over || active.data.current?.type !== 'PERSON') return;

    const personId = active.id as string;
    const sourceId = (active.data.current as DragItem).sourceId;
    const targetBoardId = over.id as string;

    // No change if dropped back where they started
    if (sourceId === targetBoardId) return;

    setBoards((prevBoards) => {
      return prevBoards.map((board) => {
        // Remove from old board if they were on one
        if (board.id === sourceId) {
          return {
            ...board,
            assignedPersonIds: (board.assignedPersonIds || []).filter(
              (id) => id !== personId
            ),
          };
        }

        // Add to new board (unless it is the 'unpaired' pool we dropped on)
        if (board.id === targetBoardId && targetBoardId !== 'unpaired') {
          return {
            ...board,
            assignedPersonIds: [...(board.assignedPersonIds || []), personId],
          };
        }

        return board;
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
                />
              );
            })}
          </div>
        </div>

        {/* Sidebar / Pool */}
        <div className="w-full shrink-0 xl:w-[350px]">
          <DroppableUnpairedPool people={unpairedPeople} />
        </div>
      </div>

      <DragOverlay>
        {activeDragItem ? (
          <DraggablePerson
            person={activeDragItem.person}
            sourceId={activeDragItem.sourceId}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// A slightly different droppable region for "Unpaired"
function DroppableUnpairedPool({ people }: { people: Person[] }) {
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
            ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-950/20'
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
          <span className="flex w-full items-center justify-center text-sm italic text-neutral-400 mt-10">
            Everyone is paired!
          </span>
        ) : (
          people.map((person) => (
            <DraggablePerson
              key={person.id}
              person={person}
              sourceId="unpaired"
            />
          ))
        )}
      </div>
    </div>
  );
}
