import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown, X, Bird } from 'lucide-react';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { FeatherBurst } from '../../../components/ui/FeatherBurst';
import type { Person, PairingBoard } from '../types';

interface GettingStartedCardProps {
  people: Person[];
  boards: PairingBoard[];
  hasSessionSaved: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  done: boolean;
}

export function GettingStartedCard({
  people,
  boards,
  hasSessionSaved,
}: GettingStartedCardProps) {
  const { gettingStartedDismissed, setGettingStartedDismissed } =
    useWorkspacePrefsStore();
  const [collapsed, setCollapsed] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [showCelebration, setShowCelebration] = useState(false);
  const hasCelebrated = React.useRef(false);

  const hasPeople = people.length > 0;
  const hasBoard = boards.filter((b) => !b.isExempt).length > 0;
  const hasPairedSomeone = boards.some(
    (b) => (b.assignedPersonIds || []).length > 0
  );
  const hasGoalAdded = boards.some(
    (b) => !b.isExempt && (b.goals || []).length > 0
  );

  const items: ChecklistItem[] = [
    {
      id: 'add-people',
      label: 'Add your teammates',
      detail: 'Click the + button in the Unpaired Pool to add people.',
      done: hasPeople,
    },
    {
      id: 'create-board',
      label: 'Create a pairing board',
      detail:
        'Click "Add Board" in the main area to set up a squad or project.',
      done: hasBoard,
    },
    {
      id: 'assign-pair',
      label: 'Drag someone onto a board',
      detail: 'Drag a teammate from the pool and drop them onto any board.',
      done: hasPairedSomeone,
    },
    {
      id: 'add-goal',
      label: 'Add a goal to a board',
      detail: 'Click the goals area on any board to add focus items.',
      done: hasGoalAdded,
    },
    {
      id: 'save-session',
      label: 'Save your first session',
      detail:
        'Click "Save Session" once pairings look good to build your history.',
      done: hasSessionSaved,
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const allDone = completedCount === items.length;

  React.useEffect(() => {
    if (allDone && !hasCelebrated.current && completedCount > 0) {
      setShowCelebration(true);
      hasCelebrated.current = true;
    }
  }, [allDone, completedCount]);

  const handleDismiss = () => {
    setGettingStartedDismissed(true);
  };

  // Hide once dismissed
  if (gettingStartedDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="flex h-full min-h-[160px] flex-col rounded-[2.5rem] border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40 [html[data-exporting='true']_&]:hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Bird className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-brand-600 dark:text-brand-400 leading-none">
                Getting Started
              </p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">
                {completedCount} of {items.length} done
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title={collapsed ? 'Expand' : 'Collapse'}
              aria-label={
                collapsed
                  ? 'Expand getting started'
                  : 'Collapse getting started'
              }
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
              />
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Dismiss"
              aria-label="Dismiss getting started guide"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-neutral-100 dark:bg-neutral-800">
          <motion.div
            className="h-full bg-brand-500 rounded-r-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / items.length) * 100}%` }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
          />
        </div>

        {/* Checklist */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <ul className="p-3 space-y-1 overflow-y-auto custom-scrollbar">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      item.done
                        ? 'opacity-50'
                        : 'bg-neutral-50 dark:bg-neutral-800/50'
                    }`}
                  >
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-brand-500" />
                    ) : (
                      <Circle className="h-4 w-4 mt-0.5 shrink-0 text-neutral-300 dark:text-neutral-600" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold leading-tight ${
                          item.done
                            ? 'line-through text-neutral-400'
                            : 'text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        {item.label}
                      </p>
                      {!item.done && (
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed font-medium">
                          {item.detail}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {allDone && (
                <div className="px-3 pb-3">
                  <button
                    onClick={handleDismiss}
                    className="w-full rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 active:scale-95 transition-all"
                  >
                    The flock is ready. Let's fly! 🦜
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {showCelebration && (
        <FeatherBurst onComplete={() => setShowCelebration(false)} />
      )}
    </AnimatePresence>
  );
}
