import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import type { PairingBoard, Person } from '../types';
import {
  Bird,
  Loader2,
  Users,
  Target,
  Lock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export function PublicView() {
  const { userId } = useParams<{ userId: string }>();
  const [boards, setBoards] = useState<PairingBoard[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      setIsLoading(true);

      try {
        // 1. Check if public view is enabled
        const { data: settingsList } = await supabase
          .from('workspace_settings')
          .select('public_view_enabled')
          .eq('user_id', userId);

        const isPublicEnabled = settingsList?.[0]?.public_view_enabled ?? false;

        if (!isPublicEnabled) {
          setIsPublic(false);
          setIsLoading(false);
          return;
        }

        setIsPublic(true);

        // 2. Fetch People and Boards
        const [peopleRes, boardsRes] = await Promise.all([
          supabase.from('people').select('*').eq('user_id', userId),
          supabase
            .from('pairing_boards')
            .select('*')
            .eq('user_id', userId)
            .order('sort_order'),
        ]);

        if (peopleRes.data) {
          interface PersonRow {
            id: string;
            name: string;
            avatar_color_hex: string;
            user_id: string;
            created_at: string;
          }
          setPeople(
            (peopleRes.data as PersonRow[]).map((p) => ({
              id: p.id,
              name: p.name,
              avatarColorHex: p.avatar_color_hex,
              userId: p.user_id,
              createdAt: p.created_at,
            }))
          );
        }
        if (boardsRes.data) {
          interface BoardRow {
            id: string;
            user_id: string;
            name: string;
            is_exempt: boolean;
            goals: string[];
            meeting_link: string;
            sort_order: number;
            assigned_person_ids: string[];
            created_at: string;
          }
          setBoards(
            (boardsRes.data as BoardRow[]).map((b) => ({
              id: b.id,
              userId: b.user_id,
              name: b.name,
              isExempt: b.is_exempt,
              goals: b.goals,
              meetingLink: b.meeting_link,
              sortOrder: b.sort_order,
              assignedPersonIds: b.assigned_person_ids,
              createdAt: b.created_at,
            }))
          );
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <span className="text-sm font-medium text-neutral-500">
            Syncing with workspace...
          </span>
        </motion.div>
      </div>
    );
  }

  if (isPublic === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-neutral-50 dark:bg-neutral-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-neutral-200 dark:bg-neutral-800 rounded-full opacity-50" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white text-neutral-400 shadow-xl dark:bg-neutral-900">
                <Lock className="h-10 w-10 text-neutral-400" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Access Restricted
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mb-10 leading-relaxed">
            This workspace dashboard is currently set to private by its owner.
            Reach out to the team for the current pairing status.
          </p>
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-8 py-4 text-sm font-bold text-white shadow-xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            Go to Homepage
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-8 dark:bg-neutral-950 font-sans selection:bg-brand-100 selection:text-brand-900">
      <div className="mx-auto max-w-7xl">
        {/* Floating Background Glows */}
        <div className="fixed top-0 left-1/4 h-64 w-64 rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
        <div className="fixed bottom-0 right-1/4 h-80 w-80 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

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
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mt-1" />
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
            <p className="text-lg font-black text-neutral-900 dark:text-neutral-100">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-500">
              Synced:{' '}
              {new Date().toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </header>

        <motion.div
          layout
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence initial={false}>
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
                  className="group flex flex-col rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-sm shadow-black/5 hover:shadow-xl hover:shadow-brand-500/5 transition-all dark:border-neutral-800/60 dark:bg-neutral-900/40 dark:backdrop-blur-sm"
                >
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`mt-1 h-3 w-3 shrink-0 rounded-full shadow-sm ring-4 ${
                          board.isExempt
                            ? 'bg-amber-500 ring-amber-500/10'
                            : 'bg-brand-500 ring-brand-500/10'
                        }`}
                      />
                      <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100 truncate">
                        {board.name}
                      </h3>
                    </div>
                    {board.isExempt && (
                      <span className="rounded-xl bg-amber-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:bg-amber-950/20 dark:text-amber-500 border border-amber-200/50 dark:border-amber-500/20">
                        OFF
                      </span>
                    )}
                  </div>

                  {board.goals && (board.goals as string[]).length > 0 ? (
                    <div className="mb-8 flex-1 space-y-3">
                      {(board.goals as string[]).map((goal, gIdx) => (
                        <div
                          key={gIdx}
                          className="flex items-start gap-3 group/goal"
                        >
                          <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-400 group-hover/goal:bg-brand-500 group-hover/goal:text-white transition-colors dark:bg-neutral-800 dark:text-neutral-600">
                            <Target className="h-2.5 w-2.5" />
                          </div>
                          <p className="text-[13px] font-medium leading-normal text-neutral-600 dark:text-neutral-400 group-hover/goal:text-neutral-900 dark:group-hover/goal:text-neutral-200 transition-colors">
                            {goal}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-8 flex-1 flex items-center justify-center rounded-2xl border border-dashed border-neutral-100 dark:border-neutral-800/50 py-10">
                      <span className="text-xs font-bold text-neutral-300 dark:text-neutral-700 uppercase tracking-widest">
                        No Goals Set
                      </span>
                    </div>
                  )}

                  <div className="mt-auto pt-6 border-t border-neutral-100/50 dark:border-neutral-800/30">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600">
                        Assignees
                      </span>
                      <div className="flex -space-x-2">
                        {assigned.map((p) => (
                          <div
                            key={p.id}
                            className="h-6 w-6 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm overflow-hidden"
                            style={{ backgroundColor: p.avatarColorHex }}
                          />
                        ))}
                        {assigned.length === 0 && (
                          <span className="h-6 w-6 rounded-full border-2 border-dashed border-neutral-200" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {assigned.length === 0 ? (
                        <span className="text-xs font-medium italic text-neutral-400/60 py-1">
                          Available for work
                        </span>
                      ) : (
                        assigned.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-2 rounded-2xl bg-neutral-100/80 pl-1 pr-3 py-1.5 dark:bg-neutral-800/40 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-md transition-all border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 group/avatar"
                          >
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded-xl text-[10px] font-black text-white shadow-xl transition-transform group-hover/avatar:scale-110"
                              style={{ backgroundColor: p.avatarColorHex }}
                            >
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                              {p.name.split(' ')[0]}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {boards.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-neutral-200/50 py-32 dark:border-neutral-800/50 bg-white/30 dark:bg-neutral-900/20 backdrop-blur-sm"
          >
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white text-neutral-200 shadow-xl dark:bg-neutral-900 dark:text-neutral-800">
              <Users className="h-12 w-12" />
            </div>
            <p className="text-xl font-black text-neutral-400 dark:text-neutral-600 tracking-tight">
              Quiet Workspace...
            </p>
            <p className="mt-2 text-sm font-medium text-neutral-400/60 max-w-xs text-center leading-relaxed">
              We couldn't find any active pairing boards for this team right
              now.
            </p>
          </motion.div>
        )}

        <footer className="mt-24 space-y-10 border-t border-neutral-200/50 pt-16 dark:border-neutral-800/50 px-4">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-brand-500 transition-colors"
              >
                Home
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-brand-500 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Open Source
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                System Operational
              </span>
            </div>
          </div>
          <div className="pb-16 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-300 dark:text-neutral-700">
              Crafted for Modern Engineering Teams • Parrit
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
