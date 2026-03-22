import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  History,
  MousePointer2,
} from 'lucide-react';

interface Person {
  id: string;
  name: string;
  color: string;
}

interface Board {
  id: string;
  name: string;
  people: string[]; // IDs
}

interface PairingState {
  boards: Board[];
  pool: string[];
}

const INITIAL_PEOPLE: Person[] = [
  { id: '1', name: 'Blu', color: '#6366F1' }, // Indigo
  { id: '2', name: 'Jewel', color: '#F59E0B' }, // Amber
  { id: '3', name: 'Roberto', color: '#10B981' }, // Emerald
  { id: '4', name: 'Edo', color: '#F43F5E' }, // Rose
  { id: '5', name: 'Mimi', color: '#8B5CF6' }, // Violet
  { id: '6', name: 'Nico', color: '#06B6D4' }, // Cyan
  { id: '7', name: 'Pedro', color: '#0EA5E9' }, // Sky
  { id: '8', name: 'Linda', color: '#EA580C' }, // Dark Orange
  { id: '9', name: 'Zara', color: '#D946EF' }, // Fuchsia
];

const INITIAL_BOARDS: Board[] = [
  { id: 'b1', name: 'Toco Toucan 🦤', people: ['1', '2'] },
  { id: 'b2', name: 'Canada Goose 🪿', people: ['3', '4'] },
  { id: 'b3', name: 'Bald Eagle 🦅', people: ['6', '5'] },
  { id: 'b4', name: 'Great Horned Owl 🦉', people: ['7'] },
];

const BOARD_COORDS: Record<string, { x: string; y: string }> = {
  pool: { x: '82%', y: '30%' },
  b1: { x: '30%', y: '40%' },
  b2: { x: '58%', y: '40%' },
  b3: { x: '30%', y: '65%' },
  b4: { x: '58%', y: '65%' },
};

export function LiveDemoShowcase() {
  const [state, setState] = useState<PairingState>({
    boards: INITIAL_BOARDS,
    pool: ['8', '9'],
  });
  const [cursorPos, setCursorPos] = useState({ x: '50%', y: '50%' });
  const [cursorLabel, setCursorLabel] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  const isHoveredRef = React.useRef(isHovered);
  const stateRef = React.useRef(state);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let mounted = true;
    let timeout: NodeJS.Timeout;
    let lastRecommendTime = Date.now();
    let startTime = Date.now();

    const wait = (ms: number) =>
      new Promise((resolve) => {
        timeout = setTimeout(resolve, ms);
      });

    const runSequence = async () => {
      while (mounted) {
        await wait(2500);
        if (!mounted) break;
        if (isHoveredRef.current) {
          await wait(1000);
          continue;
        }

        const now = Date.now();
        const currentState = stateRef.current;

        // 3-MINUTE HARD RESET
        if (now - startTime > 180000) {
          setState({ boards: INITIAL_BOARDS, pool: ['8', '9'] });
          startTime = now;
          lastRecommendTime = now;
          continue;
        }

        // TRIGGER RECOMMEND + SAVE SEQUENCE every 20 seconds
        if (now - lastRecommendTime > 20000) {
          // 1. RECOMMEND: Move to Recommend Button
          setCursorPos({ x: '52%', y: '23%' });
          await wait(1200);
          if (!mounted) break;

          setCursorLabel('Auto-pairing...');
          await wait(800);
          if (!mounted) break;

          setState((prev) => {
            const allIds = INITIAL_PEOPLE.map((p) => p.id);
            const shuffled = [...allIds].sort(() => Math.random() - 0.5);
            return {
              boards: [
                { ...prev.boards[0], people: shuffled.slice(0, 3) },
                { ...prev.boards[1], people: shuffled.slice(3, 5) },
                { ...prev.boards[2], people: shuffled.slice(5, 7) },
                { ...prev.boards[3], people: shuffled.slice(7, 9) },
              ],
              pool: [],
            } as PairingState;
          });

          await wait(1500);
          if (!mounted) break;

          // 2. SAVE: Move to Save Session Button
          setCursorLabel('Saving...');
          setCursorPos({ x: '62%', y: '23%' });
          await wait(1000);
          if (!mounted) break;

          setCursorLabel('Saved!');
          await wait(500);
          if (!mounted) break;

          setShowSaveToast(true);
          await wait(2500);
          setShowSaveToast(false);

          lastRecommendTime = Date.now();
          setCursorLabel('');
          setCursorPos({ x: '50%', y: '50%' });
          continue;
        }

        // Step 1: Move Pool -> Empty/Light Board
        if (currentState.pool.length > 0) {
          const targetBoard =
            currentState.boards.find((b) => b.people.length === 0) ||
            currentState.boards.find((b) => b.people.length < 2) ||
            currentState.boards[3];

          setCursorPos(BOARD_COORDS.pool);
          await wait(1000);
          if (!mounted || isHoveredRef.current) continue;

          setCursorLabel('Pairing...');
          setState((prev) => {
            const pid = prev.pool[0];
            if (!pid) return prev;
            return {
              pool: prev.pool.slice(1),
              boards: prev.boards.map((b) =>
                b.id === targetBoard.id
                  ? { ...b, people: [...b.people, pid] }
                  : b
              ),
            };
          });
          setCursorPos(BOARD_COORDS[targetBoard.id]);
          await wait(3000);
          setCursorLabel('');
          continue;
        }

        // Step 2: Inter-Board Move (Dynamic source/target)
        const sourceBoard = currentState.boards.find(
          (b) => b.people.length > 1
        );
        const targetBoard = currentState.boards.find(
          (b) => b.people.length < 3 && b.id !== sourceBoard?.id
        );

        if (sourceBoard && targetBoard) {
          setCursorPos(BOARD_COORDS[sourceBoard.id]);
          await wait(1000);
          if (!mounted || isHoveredRef.current) continue;

          setCursorLabel('Swapping...');
          const pid = sourceBoard.people[0];
          setState((prev) => ({
            ...prev,
            boards: prev.boards.map((b) => {
              if (b.id === sourceBoard.id)
                return { ...b, people: b.people.slice(1) };
              if (b.id === targetBoard.id)
                return { ...b, people: [...b.people, pid] };
              return b;
            }),
          }));
          setCursorPos(BOARD_COORDS[targetBoard.id]);
          await wait(3000);
          setCursorLabel('');
        }

        if (currentState.pool.length === 0 && now - lastRecommendTime > 40000) {
          setState({ boards: INITIAL_BOARDS, pool: ['8', '9'] });
          lastRecommendTime = now;
        }
      }
    };

    runSequence();
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      className="relative rounded-[2.5rem] border border-neutral-200 bg-white/50 p-2 shadow-2xl shadow-black/10 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/50 overflow-hidden group/showcase"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {showSaveToast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-neutral-900 dark:bg-brand-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-bold shadow-2xl shadow-black/20 flex items-center gap-2 border border-white/10"
          >
            <div className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
            Pairing session saved successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <p className="sr-only">
        An animated demonstration showing users being dragged between pairing
        boards.
      </p>

      <div aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/5 to-transparent opacity-0 group-hover/showcase:opacity-100 transition-opacity duration-1000" />

        <motion.div
          animate={{ left: cursorPos.x, top: cursorPos.y }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="hidden xl:block pointer-events-none absolute z-[70] text-brand-500 drop-shadow-md"
        >
          <MousePointer2 className="h-6 w-6 fill-current" />
          <AnimatePresence mode="wait">
            {cursorLabel && (
              <motion.div
                key={cursorLabel}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-2 rounded-lg bg-neutral-900 px-2 py-1 text-[8px] font-bold text-white shadow-xl dark:bg-brand-500 whitespace-nowrap"
              >
                {cursorLabel}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex items-center justify-between border-b border-neutral-200/50 dark:border-neutral-800/50 px-6 py-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex gap-1.5 shrink-0">
              <div className="h-3 w-3 rounded-full bg-red-400/50" />
              <div className="h-3 w-3 rounded-full bg-amber-400/50" />
              <div className="h-3 w-3 rounded-full bg-green-400/50" />
            </div>
            <div className="ml-4 flex-1 max-w-md rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-400 tracking-tight flex items-center justify-between gap-4">
              <span className="truncate">parrit.org/app</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] uppercase tracking-widest opacity-50">
                  Live
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-neutral-900/5 dark:bg-white/10 px-2 py-0.5 backdrop-blur-md border border-black/5 dark:border-white/10 shrink-0 ml-2">
            <span className="h-1 w-1 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-[9px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.15em]">
              Demo
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-8 flex flex-col xl:flex-row gap-8 relative">
          <div className="flex-1 order-last xl:order-first">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-black tracking-tight text-neutral-900 dark:text-neutral-100">
                Pairing Boards
              </p>
              <div className="flex gap-2">
                <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white/50 border border-neutral-200 px-3 py-1.5 text-[10px] font-bold text-neutral-500 dark:bg-neutral-800/50 dark:border-neutral-700">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Recommend Pairs
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-brand-500 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg shadow-brand-500/20">
                  <History className="h-3 w-3" />
                  Save Session
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {state.boards.map((board) => (
                <div
                  key={board.id}
                  className="group flex flex-col rounded-[2.5rem] border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/40 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <LayoutDashboard className="h-4 w-4 text-brand-500" />
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {board.name}
                    </h3>
                  </div>

                  <motion.div
                    layout
                    className="flex flex-1 flex-wrap gap-2 rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-950/50 border-2 border-transparent h-[100px] overflow-hidden content-start"
                  >
                    <AnimatePresence mode="popLayout">
                      {board.people.map((pid) => {
                        const p = INITIAL_PEOPLE.find(
                          (pers) => pers.id === pid
                        )!;
                        return (
                          <motion.div
                            key={p.id}
                            layoutId={`person-${p.id}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 30,
                            }}
                            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 shadow-sm relative shrink-0 h-8"
                            style={{
                              willChange: 'transform',
                              backgroundColor: `${p.color}15`,
                              borderColor: `${p.color}30`,
                              color: p.color,
                            }}
                          >
                            <span className="text-[10px] font-black tracking-tight whitespace-nowrap">
                              {p.name}
                            </span>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>

                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/50 space-y-2">
                    <div className="h-1.5 w-2/3 rounded-full bg-neutral-100 dark:bg-neutral-800/50" />
                    <div className="h-1.5 w-1/2 rounded-full bg-neutral-200/50 dark:bg-neutral-800/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="xl:w-64 shrink-0 flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900/40 order-first xl:order-last">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-4 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-neutral-400" />
                <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                  Unpaired Pool
                </h3>
              </div>
              <span className="h-5 w-5 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-500 dark:bg-neutral-800">
                {state.pool.length}
              </span>
            </div>
            <motion.div layout className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {state.pool.map((pid) => {
                  const p = INITIAL_PEOPLE.find((pers) => pers.id === pid)!;
                  return (
                    <motion.div
                      key={p.id}
                      layoutId={`person-${p.id}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 shadow-sm relative shrink-0 h-8"
                      style={{
                        willChange: 'transform',
                        backgroundColor: `${p.color}15`,
                        borderColor: `${p.color}30`,
                        color: p.color,
                      }}
                    >
                      <span className="text-[10px] font-black tracking-tight whitespace-nowrap">
                        {p.name}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
