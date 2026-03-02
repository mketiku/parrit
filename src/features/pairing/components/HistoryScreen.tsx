import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Calendar,
  ChevronRight,
  Inbox,
  Trash2,
  ArrowLeft,
  Bird,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useToastStore } from '../../../store/useToastStore';
import { usePairingStore } from '../store/usePairingStore';
import type { PairingBoard, Person } from '../types';

/**
 * Robust date parsing that treats YYYY-MM-DD as LOCAL time
 */
function parseInputDate(dateStr: string | null) {
  if (!dateStr) return new Date();
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
}

interface HistorySession {
  id: string;
  session_date: string;
  created_at: string;
}

interface HistoryDetail {
  person_name: string;
  board_name: string;
  avatar_color: string;
}

interface DbHistoryRow {
  person_id: string;
  board_id: string;
  people: { name: string; avatar_color_hex: string } | null;
  pairing_boards: { name: string } | null;
}

export function HistoryScreen() {
  const { user } = useAuthStore();
  const { people: storePeople, boards: storeBoards } = usePairingStore();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [details, setDetails] = useState<HistoryDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const { addToast } = useToastStore();

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this session snapshot?'))
      return;

    const { error } = await supabase
      .from('pairing_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      addToast('Failed to delete session', 'error');
    } else {
      addToast('Session deleted', 'success');
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
        setDetails([]);
      }
    }
  };

  const loadSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from('pairing_sessions')
      .select('id, session_date, created_at')
      .order('session_date', { ascending: false })
      .limit(20);

    if (!error && data) {
      setSessions(data);
    }
    setIsLoading(false);
  }, []);

  const loadSessionDetails = useCallback(
    async (sessionId: string) => {
      setIsLoadingDetails(true);
      setSelectedSessionId(sessionId);
      setDetails([]);

      try {
        const { data, error } = await supabase
          .from('pairing_history')
          .select(
            `
            person_id,
            board_id,
            people (name, avatar_color_hex),
            pairing_boards (name)
          `
          )
          .eq('session_id', sessionId);

        if (error) throw error;

        if (data) {
          const rows = data as unknown as DbHistoryRow[];
          const formatted = rows
            .filter((row) => row.board_id && row.person_id)
            .map((row) => {
              const storeBoard = storeBoards.find(
                (b: PairingBoard) => b.id === row.board_id
              );
              const storePerson = storePeople.find(
                (p: Person) => p.id === row.person_id
              );

              const board_name =
                row.pairing_boards?.name || storeBoard?.name || 'Unknown Board';
              const person_name =
                row.people?.name || storePerson?.name || 'Unknown Person';
              const avatar_color =
                row.people?.avatar_color_hex ||
                storePerson?.avatarColorHex ||
                '#94a3b8';

              return { person_name, board_name, avatar_color };
            });
          setDetails(formatted);
        }
      } catch (err: unknown) {
        console.error('Error loading session details:', err);
        addToast('Failed to load session details', 'error');
      } finally {
        setIsLoadingDetails(false);
      }
    },
    [addToast, storePeople, storeBoards]
  );

  useEffect(() => {
    if (!user) return;
    loadSessions();
  }, [user, loadSessions]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-12">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500 mb-4" />
        <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
          Searching Archives
        </span>
      </div>
    );
  }

  const detailsByBoard = details.reduce(
    (acc, curr) => {
      if (!acc[curr.board_name]) acc[curr.board_name] = [];
      acc[curr.board_name].push(curr);
      return acc;
    },
    {} as Record<string, HistoryDetail[]>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 selection:bg-brand-100 selection:text-brand-900">
      <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-xl shadow-brand-500/20">
            <History className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
              Pairing History
            </h1>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Archives of your team's tactical growth.
            </p>
          </div>
        </div>
        <Link
          to="/app"
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Workspace
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sessions List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
              Recent Snapshots
            </h2>
            <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-500 font-bold">
              {sessions.length} TOTAL
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {sessions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl p-10 text-center border border-dashed border-neutral-200 dark:border-neutral-800"
              >
                <div className="h-16 w-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6 text-neutral-300">
                  <Inbox className="h-8 w-8" />
                </div>
                <p className="text-sm font-bold text-neutral-500 mb-4">
                  The archives are empty.
                </p>
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:bg-brand-600"
                >
                  Start a Session
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session, idx) => (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative"
                  >
                    <button
                      onClick={() => loadSessionDetails(session.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        selectedSessionId === session.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 shadow-lg shadow-brand-500/5'
                          : 'border-neutral-200 bg-white hover:border-brand-200 dark:border-neutral-800 dark:bg-neutral-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                            selectedSessionId === session.id
                              ? 'bg-brand-500 text-white'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <p
                            className={`font-black tracking-tight ${selectedSessionId === session.id ? 'text-brand-900 dark:text-white' : 'text-neutral-900 dark:text-neutral-100'}`}
                          >
                            {format(
                              parseInputDate(session.session_date),
                              'MMM do, yyyy'
                            )}
                          </p>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                            {format(new Date(session.created_at), 'h:mm a')} •
                            snapshot
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 transition-all ${selectedSessionId === session.id ? 'text-brand-500 translate-x-1' : 'text-neutral-300'}`}
                      />
                    </button>
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      className="absolute -right-2 -top-2 flex h-8 w-8 scale-0 items-center justify-center rounded-xl bg-white text-neutral-400 shadow-xl border border-neutral-100 hover:text-red-500 hover:border-red-200 transition-all dark:bg-neutral-800 dark:border-neutral-700 group-hover:scale-100 active:scale-90"
                      title="Delete Session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected Session Details */}
        <div id="session-details" className="lg:col-span-8 scroll-mt-24">
          <AnimatePresence mode="wait">
            {!selectedSessionId ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-[500px] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white/30 dark:bg-neutral-900/20"
              >
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white text-neutral-200 shadow-xl dark:bg-neutral-900 dark:text-neutral-800">
                  <History className="h-12 w-12" />
                </div>
                <p className="text-xl font-black text-neutral-400 dark:text-neutral-600 tracking-tight">
                  Select a Snapshot
                </p>
                <p className="mt-2 text-sm font-medium text-neutral-400/60 max-w-xs text-center">
                  Pick a date from the left to explore who was pairing and what
                  they were working on.
                </p>
              </motion.div>
            ) : isLoadingDetails ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[500px] flex flex-col items-center justify-center rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/30 dark:bg-neutral-900/20"
              >
                <Loader2 className="h-10 w-10 animate-spin text-brand-500 mb-6" />
                <span className="text-sm font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Retrieving Data
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="relative overflow-hidden group">
                  <div className="absolute inset-0 bg-brand-500 rounded-[2rem] shadow-2xl shadow-brand-500/20" />
                  <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none transition-transform group-hover:scale-125 duration-1000" />

                  <div className="relative z-10 p-10 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-brand-200" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-100 opacity-80">
                          Workspace Snapshot
                        </span>
                      </div>
                      <h2 className="text-4xl font-black tracking-tight leading-none mb-2">
                        {format(
                          parseInputDate(
                            sessions.find((s) => s.id === selectedSessionId)
                              ?.session_date || null
                          ),
                          'EEEE'
                        )}
                      </h2>
                      <p className="text-lg font-bold text-brand-100 opacity-90">
                        {format(
                          parseInputDate(
                            sessions.find((s) => s.id === selectedSessionId)
                              ?.session_date || null
                          ),
                          'MMMM do, yyyy'
                        )}
                      </p>
                    </div>
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md border border-white/20">
                      <Bird className="h-10 w-10" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(detailsByBoard).map(
                    ([boardName, people], bIdx) => (
                      <motion.div
                        key={boardName}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: bIdx * 0.1 }}
                        className="bg-white dark:bg-neutral-900/60 rounded-[2rem] border border-neutral-100 dark:border-neutral-800/80 p-8 shadow-sm flex flex-col"
                      >
                        <div className="flex items-center gap-3 mb-8">
                          <div className="h-3 w-3 rounded-full bg-brand-500 shadow-sm ring-4 ring-brand-500/10" />
                          <h3 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                            {boardName}
                          </h3>
                          <span className="text-[9px] bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-xl text-neutral-500 font-black uppercase tracking-widest ml-auto border border-neutral-200/50 dark:border-neutral-800">
                            {people.length} PPL
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {people.map((p, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex items-center gap-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 pl-1 pr-4 py-1.5 border border-neutral-100/50 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all active:scale-95"
                            >
                              <div
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-black text-white shadow-xl shadow-black/5"
                                style={{ backgroundColor: p.avatar_color }}
                              >
                                {p.person_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                                {p.person_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  )}
                </div>

                <div className="py-12 flex flex-col items-center">
                  <div className="h-px w-24 bg-neutral-100 dark:bg-neutral-800 mb-8" />
                  <Link
                    to="/app"
                    className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-500 transition-all hover:gap-5"
                  >
                    End of Tape
                    <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-neutral-50 dark:bg-neutral-800 group transition-colors">
                      <Bird className="h-4 w-4" />
                    </div>
                    Back to Workspace
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
