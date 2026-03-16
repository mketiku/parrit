import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
} from '@floating-ui/react-dom';

interface ContextualHintProps {
  targetId: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  onDismiss: () => void;
  /** Accent color for the indicator dot */
  color?: 'brand' | 'amber';
}

export function ContextualHint({
  targetId,
  title,
  description,
  placement = 'bottom',
  onDismiss,
  color = 'brand',
}: ContextualHintProps) {
  const [hasTarget, setHasTarget] = useState(false);

  const { x, y, refs, strategy } = useFloating({
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({ fallbackAxisSideDirection: 'end' }),
      shift({ padding: 12 }),
    ],
  });

  useEffect(() => {
    // Use rAF so the DOM element exists before we try to find it
    const handle = requestAnimationFrame(() => {
      const el = document.getElementById(targetId);
      if (el) {
        refs.setReference(el);
        setHasTarget(true);
      }
    });
    return () => cancelAnimationFrame(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  if (!hasTarget) return null;

  const { setFloating } = refs;

  const dotColor =
    color === 'amber'
      ? 'bg-amber-500 shadow-amber-500/50'
      : 'bg-brand-500 shadow-brand-500/50';

  return (
    <AnimatePresence>
      <motion.div
        ref={setFloating}
        initial={{ opacity: 0, scale: 0.92, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 6 }}
        transition={{ type: 'spring', damping: 24, stiffness: 320 }}
        style={{ position: strategy, top: y ?? 0, left: x ?? 0 }}
        className="z-50 w-64 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 [html[data-exporting='true']_&]:hidden"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full shadow-md animate-pulse ${dotColor}`}
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Tip
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Dismiss tip"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mb-0.5 text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
          {title}
        </p>
        <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
