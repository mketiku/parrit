import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { Person, DragItem } from '../types';

interface DraggablePersonProps {
  person: Person;
  sourceId: string;
  isOverlay?: boolean;
}

export function DraggablePerson({
  person,
  sourceId,
  isOverlay,
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
    <motion.button
      layout={!isOverlay}
      layoutId={!isOverlay ? person.id : undefined}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-label={person.name}
      className={`
        relative flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-full 
        text-sm font-semibold text-white transition-all shadow-inner ring-1 ring-black/10 
        dark:ring-white/20
        ${isDragging ? 'z-50 scale-110 cursor-grabbing shadow-2xl opacity-80 ring-2' : 'hover:scale-105 hover:shadow-md'}
      `}
      style={{
        backgroundColor: person.avatarColorHex,
        // When drag overlay is active, the original node still renders.
        // We make the original node transparent so layout animations are smooth.
        opacity: isDragging && !isOverlay ? 0 : undefined,
      }}
    >
      {initials}
    </motion.button>
  );
}
