import React, { useState } from 'react';
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
  const dragData: DragItem = {
    type: 'PERSON',
    person,
    sourceId,
  };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: person.id,
    data: dragData,
  });

  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTimer, setTooltipTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const initials = person.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleMouseEnter = () => {
    const timer = setTimeout(() => setShowTooltip(true), 600);
    setTooltipTimer(timer);
  };

  const handleMouseLeave = () => {
    if (tooltipTimer) clearTimeout(tooltipTimer);
    setShowTooltip(false);
  };

  return (
    <div className="relative flex items-center justify-center">
      <button
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        aria-label={person.name}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
          opacity: isDragging && !isOverlay ? 0 : 1,
        }}
      >
        {initials}
      </button>

      {/* Hover Tooltip */}
      {showTooltip && !isDragging && (
        <div
          className="pointer-events-none absolute -top-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg dark:bg-white dark:text-neutral-900"
          role="tooltip"
        >
          {person.name}
          {/* Arrow */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-neutral-900 dark:border-t-white" />
        </div>
      )}
    </div>
  );
}
