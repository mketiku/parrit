import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/store/useAuthStore';
import {
  History,
  Calendar,
  LayoutDashboard,
  ChevronRight,
  Inbox,
  Trash2,
  ArrowDownCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useToastStore } from '../../../store/useToastStore';
import { usePairingStore } from '../store/usePairingStore';
import type { PairingBoard, Person } from '../types';

/**
 * Robust date parsing that treats YYYY-MM-DD as LOCAL time, avoiding the UTC offset
 * that causes "Sunday" to appear instead of "Monday" in many timezones.
 */
function parseInputDate(dateStr: string | null) {
  if (!dateStr) return new Date();
  // Handle ISO timestamp or just YYYY-MM-DD
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
  _count?: {
    people: number;
  };
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
      .select(
        `
        id,
        session_date,
        created_at
      `
      )
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
      setDetails([]); // Clear previous details

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
            .filter((row) => row.board_id && row.person_id) // skip fully null rows
            .map((row) => {
              // Try joined data first, fall back to in-memory store data
              const storeBoard = storeBoards.find(
                (b: PairingBoard) => b.id === row.board_id
              );
              const storePerson = storePeople.find(
                (p: Person) => p.id === row.person_id
              );

              const board_name =
                row.pairing_boards?.name ||
                storeBoard?.name ||
                `Board (${row.board_id.slice(0, 6)})…`;

              const person_name =
                row.people?.name ||
                storePerson?.name ||
                `Person (${row.person_id.slice(0, 6)})…`;

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
        const message = err instanceof Error ? err.message : 'Unknown error';
        addToast(`Failed to load session details: ${message}`, 'error');
      } finally {
        setIsLoadingDetails(false);
      }
    },
    [addToast, storePeople, storeBoards]
  );

  useEffect(() => {
    (async () => {
      if (!user) return;
      await loadSessions();
    })();
  }, [user, loadSessions]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  // Group details by board
  const detailsByBoard = details.reduce(
    (acc, curr) => {
      if (!acc[curr.board_name]) acc[curr.board_name] = [];
      acc[curr.board_name].push(curr);
      return acc;
    },
    {} as Record<string, HistoryDetail[]>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-brand-500 rounded-2xl text-white shadow-lg shadow-brand-500/20">
          <History className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Pairing History
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Review past configurations and track your team's rotation.
          </p>
        </div>
      </div>

      <div
        id="history-content"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Sessions List */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4 px-2">
            Past Sessions
          </h2>
          {sessions.length === 0 ? (
            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800">
              <Inbox className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">No sessions saved yet.</p>
              <Link
                to="/app"
                className="text-brand-500 text-sm font-medium hover:underline mt-2 inline-block"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="group relative">
                <button
                  onClick={() => {
                    loadSessionDetails(session.id);
                    // On mobile, scroll to details
                    if (window.innerWidth < 1024) {
                      setTimeout(() => {
                        document
                          .getElementById('session-details')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    selectedSessionId === session.id
                      ? 'border-brand-500 bg-brand-50/50 shadow-md ring-1 ring-brand-500 dark:bg-brand-950/20'
                      : 'border-neutral-200 bg-white hover:border-brand-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl scale-90 ${selectedSessionId === session.id ? 'bg-brand-500 text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'}`}
                    >
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p
                        className={`font-semibold ${selectedSessionId === session.id ? 'text-brand-900 dark:text-brand-100' : 'text-neutral-900 dark:text-neutral-100'}`}
                      >
                        {format(
                          parseInputDate(session.session_date),
                          'MMMM do, yyyy'
                        )}
                      </p>
                      <p className="text-xs text-neutral-500 italic">
                        Snapshot at{' '}
                        {format(new Date(session.created_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 ${selectedSessionId === session.id ? 'text-brand-500' : 'text-neutral-300'} transition-transform group-hover:translate-x-1`}
                  />
                </button>
                <button
                  onClick={(e) => deleteSession(e, session.id)}
                  className="absolute -right-2 -top-2 hidden h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-400 shadow-sm border border-neutral-200 hover:text-red-500 hover:border-red-200 transition-all dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-500 group-hover:flex"
                  title="Delete Snapshot"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Selected Session Details */}
        <div id="session-details" className="lg:col-span-8 scroll-mt-24">
          {!selectedSessionId ? (
            <div className="h-[400px] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/20">
              <History className="h-12 w-12 text-neutral-300 mb-4" />
              <p className="text-neutral-500 font-medium">
                Select a session from the left to see who was pairing.
              </p>
            </div>
          ) : isLoadingDetails ? (
            <div className="h-[400px] flex items-center justify-center rounded-3xl bg-neutral-50 dark:bg-neutral-900/40">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-brand-500 rounded-3xl p-6 text-white shadow-xl shadow-brand-500/20 overflow-hidden relative">
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold italic">
                      Session Snapshot
                    </h2>
                    <p className="opacity-90 text-sm">
                      {(() => {
                        const session = sessions.find(
                          (s) => s.id === selectedSessionId
                        );
                        if (!session) return 'Unknown Session';
                        try {
                          return format(
                            parseInputDate(session.session_date),
                            'EEEE, MMMM do, yyyy'
                          );
                        } catch {
                          return 'Invalid Date';
                        }
                      })()}
                    </p>
                  </div>
                  <History className="h-10 w-10 opacity-20" />
                </div>
                {/* Decorative circle */}
                <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(detailsByBoard).map(([boardName, people]) => (
                  <div
                    key={boardName}
                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <LayoutDashboard className="h-4 w-4 text-brand-500" />
                      <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                        {boardName}
                      </h3>
                      <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-500 font-bold uppercase tracking-wider ml-auto">
                        {people.length} People
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {people.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800/50 px-3 py-1.5 rounded-xl border border-neutral-100 dark:border-neutral-800"
                        >
                          <div
                            className="h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                            style={{ backgroundColor: p.avatar_color }}
                          >
                            {p.person_name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {p.person_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Proactive: Add a way to hint that they can go back to Dashboard */}
              <div className="flex justify-center pt-4">
                <Link
                  to="/app"
                  className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-brand-500 transition-colors"
                >
                  <ArrowDownCircle className="h-4 w-4 rotate-90" />
                  Back to current workspace
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
