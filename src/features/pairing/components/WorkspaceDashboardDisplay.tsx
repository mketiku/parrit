import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PairingBoard, Person } from '../types';
import { Bird, Target, ShieldCheck } from 'lucide-react';

interface WorkspaceDashboardDisplayProps {
  boards: PairingBoard[];
  people: Person[];
  isAdminView?: boolean;
}

export function WorkspaceDashboardDisplay({
  boards,
  people,
  isAdminView,
}: WorkspaceDashboardDisplayProps) {
  return (
    <div className="mx-auto max-w-7xl">
      <header className="relative mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ rotate: -15, scale: 0.8, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            className="flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-500 text-white shadow-2xl shadow-brand-500/20"
          >
            <Bird className="h-8 w-8" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              Live Overview
              {isAdminView ? (
                <div className="flex items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-[10px] font-black text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 border border-brand-500/20">
                  <ShieldCheck className="h-3 w-3" /> SECURE ADMIN VIEW
                </div>
              ) : (
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mt-1" />
              )}
            </h1>
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand-500">
              Team Dashboard
              <span className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-neutral-400 dark:text-neutral-600">
                Read-Only
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end">
          <p className="text-lg font-black text-neutral-900 dark:text-neutral-100 italic">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </header>

      <motion.div
        layout
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <AnimatePresence>
          {boards.map((board, idx) => {
            const assigned = (board.assignedPersonIds ?? [])
              .map((id: string) => people.find((p) => p.id === id))
              .filter(Boolean) as Person[];

            return (
              <motion.div
                key={board.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex flex-col rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:border-neutral-800/60 dark:bg-neutral-900/40"
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`mt-1 h-3 w-3 shrink-0 rounded-full ${board.isExempt ? 'bg-amber-500' : 'bg-brand-500'}`}
                    />
                    <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100 truncate">
                      {board.name}
                    </h3>
                  </div>
                </div>

                {board.goals?.length > 0 ? (
                  <div className="mb-8 flex-1 space-y-3">
                    {board.goals.map((goal, gIdx) => (
                      <div key={gIdx} className="flex items-start gap-3">
                        <Target className="h-3.5 w-3.5 text-brand-400 mt-1 shrink-0" />
                        <p className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300">
                          {goal}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-8 flex-1 flex items-center justify-center border-2 border-dashed border-neutral-100 rounded-2xl dark:border-neutral-800/20 py-10">
                    <span className="text-[10px] font-black tracking-widest text-neutral-300">
                      NO ACTIVE FOCUS
                    </span>
                  </div>
                )}

                <div className="mt-auto pt-6 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex flex-wrap gap-2">
                    {assigned.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 rounded-2xl bg-neutral-100 pl-1 pr-3 py-1.5 dark:bg-neutral-800"
                      >
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-xl text-[10px] font-black text-white"
                          style={{ backgroundColor: p.avatarColorHex }}
                        >
                          {p.name.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          {p.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Unpaired People (Eliminate "Ghost" members) */}
      {(() => {
        const assignedIds = new Set(
          boards.flatMap((b) => b.assignedPersonIds || [])
        );
        const unpaired = people.filter((p) => !assignedIds.has(p.id));

        if (unpaired.length === 0) return null;

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-16 border-t border-neutral-100 pt-12 dark:border-neutral-800"
          >
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="h-5 w-5 rounded-lg bg-neutral-100 flex items-center justify-center dark:bg-neutral-800">
                <div className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
                Teammates on Standby
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-50 text-neutral-400 dark:bg-neutral-900/50">
                {unpaired.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 px-2">
              {unpaired.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl bg-white border border-neutral-100 pl-1.5 pr-4 py-1.5 shadow-sm dark:bg-neutral-900/40 dark:border-neutral-800"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-black text-white shadow-sm"
                    style={{ backgroundColor: p.avatarColorHex }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
}
