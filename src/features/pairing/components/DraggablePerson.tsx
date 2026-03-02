import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Person, DragItem } from '../types';

interface DraggablePersonProps {
  person: Person;
  sourceId: string;
  isOverlay?: boolean;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function DraggablePerson({
  person,
  sourceId,
  isOverlay,
  isSelected,
  onClick,
}: DraggablePersonProps) {
  // Construct the drag item payload
  const dragData: DragItem = {
    type: 'PERSON',
    person,
    sourceId,
  };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: person.id,
    data: dragData,
  });

  // Extract initials (e.g., "Michael Ketiku" -> "MK")
  const initials = person.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-label={person.name}
      className={`
        relative flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-full 
        text-sm font-semibold text-white transition-all shadow-inner
        ${
          isSelected && !isOverlay
            ? 'ring-4 ring-indigo-500 scale-110 shadow-md outline-none'
            : 'ring-1 ring-black/10 dark:ring-white/20'
        }
        ${isDragging ? 'z-[100] scale-110 cursor-grabbing shadow-2xl ring-2' : 'hover:scale-105 hover:shadow-md'}
      `}
      onClick={(e) => {
        if (e.defaultPrevented) return;
        onClick?.(e);
      }}
      style={{
        backgroundColor: person.avatarColorHex,
        // Hide the original node while dragging so only the overlay is visible
        opacity: isDragging && !isOverlay ? 0 : 1,
      }}
    >
      {initials}
    </button>
  );
}
