import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Person, DragItem } from '../types';

interface DraggablePersonProps {
  person: Person;
  sourceId: string;
}

export function DraggablePerson({ person, sourceId }: DraggablePersonProps) {
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
        text-sm font-semibold text-white shadow-sm ring-2 ring-white transition-all 
        dark:ring-neutral-900 
        ${isDragging ? 'z-50 scale-110 cursor-grabbing shadow-lg opacity-80' : 'hover:scale-105 hover:shadow-md'}
      `}
      style={{
        backgroundColor: person.avatarColorHex,
      }}
    >
      {initials}
    </button>
  );
}
