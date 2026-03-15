import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  History as HistoryIcon,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import type { PersonStats } from '../hooks/useHistoryAnalytics';
import { format } from 'date-fns';

interface PersonInsightsSidebarProps {
  stats: PersonStats | null;
  onClose: () => void;
}

export function PersonInsightsSidebar({
  stats,
  onClose,
}: PersonInsightsSidebarProps) {
  if (!stats) return null;

  const topPartners = Object.entries(stats.partnerCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 3);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-white dark:bg-neutral-900 shadow-2xl pointer-events-auto flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg"
                style={{ backgroundColor: stats.avatarColor }}
              >
                {stats.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                  {stats.name}
                </h2>
                <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  Team Member Insights
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Close highlights"
            >
              <X className="h-5 w-5 text-neutral-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-brand-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                    Total Pairings
                  </span>
                </div>
                <div className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
                  {stats.totalPairings}
                </div>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                    Unique Partners
                  </span>
                </div>
                <div className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
                  {Object.keys(stats.partnerCounts).length}
                </div>
              </div>
            </div>

            {/* Top Partners */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
                  Favorite Partners
                </h3>
              </div>
              <div className="space-y-3">
                {topPartners.length > 0 ? (
                  topPartners.map(([id, info], idx) => (
                    <div
                      key={id}
                      className="flex items-center justify-between bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 shadow-sm relative overflow-hidden group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50 dark:bg-neutral-800 font-black text-neutral-900 dark:text-neutral-100">
                          {idx + 1}
                        </div>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                          {info.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                          {info.count}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-widest">
                          Sessions
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">
                    No pairings recorded yet.
                  </p>
                )}
              </div>
            </section>

            {/* Timeline */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <HistoryIcon className="h-4 w-4 text-brand-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
                  Pairing Timeline
                </h3>
              </div>
              <div className="space-y-4 relative">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-neutral-100 dark:bg-neutral-800" />
                {stats.timeline.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="flex gap-6 relative">
                    <div className="h-8 w-8 rounded-full border-4 border-white dark:border-neutral-900 bg-brand-500 flex items-center justify-center z-10">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">
                        {format(new Date(item.date), 'MMM do, yyyy')}
                      </p>
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        Paired with {item.partnerName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
