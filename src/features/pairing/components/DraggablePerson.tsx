import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { Person, DragItem } from '../types';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';

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
  const { showFullName } = useWorkspacePrefsStore();
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

  const trimmedName = person.name.trim();

  const initials = trimmedName
    .split(' ')
    .filter(Boolean)
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
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="relative flex items-center justify-center"
    >
      <button
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        aria-label={trimmedName}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          relative flex shrink-0 cursor-grab items-center justify-center rounded-full 
          text-sm font-semibold text-white transition-all shadow-inner
          ${showFullName ? 'h-8 w-auto min-w-[2rem] px-1' : 'h-10 w-10'}
          ${
            isSelected && !isOverlay
              ? 'ring-4 ring-brand-500 scale-110 shadow-md outline-none'
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
        {showFullName ? (
          <span className="px-2 text-[11px] font-bold tracking-tight whitespace-nowrap">
            {trimmedName.split(' ')[0]}
          </span>
        ) : (
          initials
        )}
      </button>

      {/* Hover Tooltip */}
      {showTooltip && !isDragging && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute -top-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg dark:bg-white dark:text-neutral-900"
          role="tooltip"
        >
          {person.name}
          {/* Arrow */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-neutral-900 dark:border-t-white" />
        </motion.div>
      )}
    </motion.div>
  );
}
