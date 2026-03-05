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
  Workflow,
  Copy,
  CheckSquare,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useToastStore } from '../../../store/useToastStore';
import { usePairingStore } from '../store/usePairingStore';
import type { PairingBoard, Person } from '../types';
import { useHistoryAnalytics } from '../hooks/useHistoryAnalytics';
import { PairingMatrixView } from './PairingMatrixView';
import { PersonInsightsSidebar } from './PersonInsightsSidebar';
import { ProductTutorial } from './ProductTutorial';
import {
  useTutorialStore,
  HISTORY_TUTORIAL_STEPS,
} from '../store/useTutorialStore';

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
  person_name?: string | null;
  board_name?: string | null;
  people: { name: string; avatar_color_hex: string } | null;
  pairing_boards: { name: string } | null;
}

interface HistoryRowData {
  person_id: string;
  session_id: string;
  person_name?: string | null;
  board_name?: string | null;
  pairing_boards: { name: string }[] | { name: string } | null;
  people:
    | { name: string; avatar_color_hex: string }[]
    | { name: string; avatar_color_hex: string }
    | null;
}

export function HistoryScreen() {
  const { user } = useAuthStore();
  const { people: storePeople, boards: storeBoards } = usePairingStore();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [details, setDetails] = useState<HistoryDetail[]>([]);
  const [fullHistory, setFullHistory] = useState<HistoryRowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editDateValue, setEditDateValue] = useState('');
  const [editTimeValue, setEditTimeValue] = useState('');
  const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string>>(
    new Set()
  );
  const { addToast } = useToastStore();
  const {
    personStats,
    matrix,
    isLoading: isAnalyzing,
  } = useHistoryAnalytics(storePeople);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const { startTutorial } = useTutorialStore();

  const handleUpdateDate = async () => {
    if (!selectedSessionId || !editDateValue || !editTimeValue) return;

    // Combine date and time and convert to ISO string for precise DB storage
    const newTimestamp = new Date(
      `${editDateValue}T${editTimeValue}:00`
    ).toISOString();

    const { data, error } = await supabase
      .from('pairing_sessions')
      .update({
        session_date: editDateValue,
        created_at: newTimestamp,
      })
      .eq('id', selectedSessionId)
      .select();

    if (error || !data || data.length === 0) {
      addToast('Failed to update session', 'error');
    } else {
      addToast('Session updated', 'success');
      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSessionId
            ? { ...s, session_date: editDateValue, created_at: newTimestamp }
            : s
        )
      );
      setIsEditingDate(false);
    }
  };

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
    const { data: sessionData, error: sessionErr } = await supabase
      .from('pairing_sessions')
      .select('id, session_date, created_at')
      .order('session_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10); // Limit to top 10 for performance

    if (!sessionErr && sessionData) {
      setSessions(sessionData);

      // Load assignment summary for flow visualization
      const { data: historyData } = await supabase
        .from('pairing_history')
        .select(
          `
          person_id,
          board_id,
          session_id,
          person_name,
          board_name,
          people (name, avatar_color_hex),
          pairing_boards (name)
        `
        )
        .in(
          'session_id',
          sessionData.map((s) => s.id)
        );

      if (historyData) {
        setFullHistory(historyData);
      }
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
            person_name,
            board_name,
            people (name, avatar_color_hex),
            pairing_boards (name)
          `
          )
          .eq('session_id', sessionId);

        if (error) throw error;

        if (data) {
          const rows = data as unknown as DbHistoryRow[];
          const formatted = rows
            .filter(
              (row) =>
                (row.board_id || row.board_name) &&
                (row.person_id || row.person_name)
            )
            .map((row) => {
              const storeBoard = storeBoards.find(
                (b: PairingBoard) => b.id === row.board_id
              );
              const storePerson = storePeople.find(
                (p: Person) => p.id === row.person_id
              );

              const board_name =
                row.board_name ||
                row.pairing_boards?.name ||
                storeBoard?.name ||
                'Unknown Board';
              const person_name =
                row.person_name ||
                row.people?.name ||
                storePerson?.name ||
                'Unknown Person';
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

  const handleCloneSession = async () => {
    if (!selectedSessionId || details.length === 0) return;

    const confirmClone = confirm(
      'This will replace your current workspace boards with the configuration from this snapshot. People will be reassigned where possible. Continue?'
    );
    if (!confirmClone) return;

    try {
      // 1. Group details by board
      const boardGroups = details.reduce(
        (acc, curr) => {
          const bName = curr.board_name.trim();
          if (!acc[bName]) acc[bName] = [];
          acc[bName].push(curr.person_name.trim());
          return acc;
        },
        {} as Record<string, string[]>
      );

      // 2. Prepare boards and map people by name
      const {
        people: storePeople,
        applyBuiltinTemplate,
        setBoards,
      } = usePairingStore.getState();

      const newBoards = Object.entries(boardGroups).map(([name, pNames]) => {
        const assignedIds = pNames
          .map(
            (name) => storePeople.find((p) => p.name.trim() === name.trim())?.id
          )
          .filter((id): id is string => !!id);

        return {
          name,
          isExempt: false,
          assignedPersonIds: assignedIds,
        };
      });

      // 3. Apply via store (using applyBuiltinTemplate as a base for clean replacement)
      await applyBuiltinTemplate(
        `Clone of ${format(parseInputDate(sessions.find((s) => s.id === selectedSessionId)?.session_date || null), 'MMM d')}`,
        newBoards.map((nb) => ({ name: nb.name, isExempt: nb.isExempt }))
      );

      // 4. Re-assign people (applyBuiltinTemplate doesn't handle people)
      const { boards: createdBoards, people: latestPeople } =
        usePairingStore.getState();
      const remappedBoards = createdBoards.map((cb) => {
        const bName = cb.name.trim();
        const originalPeople = boardGroups[bName] || [];
        const newIds = originalPeople
          .map(
            (pName) =>
              latestPeople.find((p) => p.name.trim() === pName.trim())?.id
          )
          .filter((id): id is string => !!id);

        return { ...cb, assignedPersonIds: newIds };
      });

      setBoards(remappedBoards);
      addToast('Snapshot cloned to workspace!', 'success');
    } catch (err) {
      console.error('Clone error:', err);
      addToast('Failed to clone snapshot.', 'error');
    }
  };

  const deleteBulkSessions = async () => {
    if (selectedBulkIds.size === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedBulkIds.size} session snapshots?`
      )
    )
      return;

    const ids = Array.from(selectedBulkIds);
    const { error } = await supabase
      .from('pairing_sessions')
      .delete()
      .in('id', ids);

    if (error) {
      addToast('Failed to delete sessions', 'error');
    } else {
      addToast(`${selectedBulkIds.size} sessions deleted`, 'success');
      setSessions((prev) => prev.filter((s) => !selectedBulkIds.has(s.id)));
      if (selectedSessionId && selectedBulkIds.has(selectedSessionId)) {
        setSelectedSessionId(null);
        setDetails([]);
      }
      setSelectedBulkIds(new Set());
    }
  };

  useEffect(() => {
    if (!user) return;
    loadSessions();
  }, [user, loadSessions]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessions.length === 0) return;

      const currentIndex = sessions.findIndex(
        (s) => s.id === selectedSessionId
      );

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = (currentIndex + 1) % sessions.length;
        loadSessionDetails(sessions[nextIdx].id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx =
          currentIndex <= 0 ? sessions.length - 1 : currentIndex - 1;
        loadSessionDetails(sessions[prevIdx].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessions, selectedSessionId, loadSessionDetails]);

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
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-300">
              Archives of your team's tactical growth.
            </p>
          </div>
        </div>
        <Link
          to="/app"
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Workspace
        </Link>
      </header>

      {/* Team Evolution Flow */}
      {sessions.length > 1 && (
        <section id="history-timeline" className="mb-12">
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-2">
              <Workflow className="h-4 w-4 text-brand-500" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                Team Evolution Flow
              </h2>
            </div>
            <button
              id="history-insights"
              onClick={() => setShowInsights(!showInsights)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all
                ${
                  showInsights
                    ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'bg-white border-neutral-200 text-neutral-400 hover:border-brand-500 hover:text-brand-600 dark:bg-neutral-900 dark:border-neutral-800'
                }
              `}
            >
              <BarChart3 className="h-3 w-3" />
              {showInsights ? 'Hide Insights' : 'Show Insights'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <AnimatePresence>
              {showInsights && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    id="history-matrix"
                    className="rounded-[2.5rem] border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900/40 mb-8 overflow-x-auto"
                  >
                    <div className="flex items-center gap-2 mb-8">
                      <BarChart3 className="h-4 w-4 text-brand-500" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">
                        Pairing Frequency Matrix
                      </h3>
                    </div>
                    {isAnalyzing ? (
                      <div className="h-48 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                      </div>
                    ) : (
                      <PairingMatrixView matrix={matrix} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="rounded-[2.5rem] border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Workflow className="h-64 w-64 rotate-12" />
              </div>
              <TeamFlowVisualizer
                sessions={[...sessions].reverse()}
                history={fullHistory}
                onSessionSelect={loadSessionDetails}
                currentSessionId={selectedSessionId}
                onPersonClick={setSelectedPersonId}
              />
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sessions List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (
                      selectedBulkIds.size === sessions.length &&
                      sessions.length > 0
                    ) {
                      setSelectedBulkIds(new Set());
                    } else {
                      setSelectedBulkIds(new Set(sessions.map((s) => s.id)));
                    }
                  }}
                  className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${
                    selectedBulkIds.size === sessions.length &&
                    sessions.length > 0
                      ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                      : 'border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-800 text-neutral-300'
                  }`}
                  aria-label={
                    selectedBulkIds.size === sessions.length
                      ? 'Deselect all sessions'
                      : 'Select all sessions'
                  }
                  title={
                    selectedBulkIds.size === sessions.length
                      ? 'Deselect all'
                      : 'Select all'
                  }
                >
                  <CheckSquare
                    className={`h-4 w-4 ${selectedBulkIds.size === sessions.length ? 'opacity-100' : 'opacity-0'}`}
                  />
                </button>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                  Recent Snapshots
                </h2>
              </div>
              {selectedBulkIds.size > 0 && (
                <button
                  onClick={deleteBulkSessions}
                  className="text-[10px] font-black uppercase text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-lg active:scale-95"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete ({selectedBulkIds.size})
                </button>
              )}
            </div>
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedBulkIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(session.id)) next.delete(session.id);
                            else next.add(session.id);
                            return next;
                          });
                        }}
                        role="checkbox"
                        aria-checked={selectedBulkIds.has(session.id)}
                        className={`p-1 rounded-md transition-colors ${
                          selectedBulkIds.has(session.id)
                            ? 'text-brand-500 bg-brand-500/10'
                            : 'text-neutral-300 hover:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        aria-label={`Select session from ${format(parseInputDate(session.session_date), 'MMM do')} for bulk action`}
                        title="Select for bulk action"
                      >
                        <CheckSquare
                          className={`h-5 w-5 transition-transform ${selectedBulkIds.has(session.id) ? 'scale-110' : 'scale-100 opacity-40'}`}
                        />
                      </button>

                      <button
                        onClick={() => loadSessionDetails(session.id)}
                        aria-label={`View details for session on ${format(parseInputDate(session.session_date), 'MMM do, yyyy')}`}
                        aria-selected={selectedSessionId === session.id}
                        className={`flex-1 flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          selectedSessionId === session.id
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 shadow-lg shadow-brand-500/5'
                            : selectedBulkIds.has(session.id)
                              ? 'border-brand-200 bg-brand-50/30 dark:border-brand-900/40 dark:bg-brand-950/10'
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
                    </div>
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      className="absolute -right-2 -top-2 flex h-8 w-8 scale-0 items-center justify-center rounded-xl bg-white text-neutral-400 shadow-xl border border-neutral-100 hover:text-red-500 hover:border-red-200 transition-all dark:bg-neutral-800 dark:border-neutral-700 group-hover:scale-100 active:scale-90"
                      title="Delete Session"
                      aria-label={`Delete session on ${format(parseInputDate(session.session_date), 'MMM do')}`}
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
                      <div className="flex items-center gap-3">
                        {isEditingDate ? (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex flex-col gap-1">
                              <label
                                htmlFor="edit-session-date"
                                className="text-[10px] font-bold text-white/60 uppercase"
                              >
                                Date
                              </label>
                              <input
                                id="edit-session-date"
                                type="date"
                                value={editDateValue}
                                onChange={(e) =>
                                  setEditDateValue(e.target.value)
                                }
                                className="bg-white/20 border border-white/30 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label
                                htmlFor="edit-session-time"
                                className="text-[10px] font-bold text-white/60 uppercase"
                              >
                                Time
                              </label>
                              <input
                                id="edit-session-time"
                                type="time"
                                value={editTimeValue}
                                onChange={(e) =>
                                  setEditTimeValue(e.target.value)
                                }
                                className="bg-white/20 border border-white/30 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                              />
                            </div>
                            <div className="flex gap-2 self-end mt-4 sm:mt-0">
                              <button
                                onClick={handleUpdateDate}
                                className="text-[10px] font-black uppercase tracking-widest bg-white text-brand-500 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setIsEditingDate(false)}
                                className="text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h2 className="text-4xl font-black tracking-tight leading-none mb-2">
                              {format(
                                parseInputDate(
                                  sessions.find(
                                    (s) => s.id === selectedSessionId
                                  )?.session_date || null
                                ),
                                'EEEE'
                              )}
                            </h2>
                            <button
                              onClick={() => {
                                const session = sessions.find(
                                  (s) => s.id === selectedSessionId
                                );
                                if (session) {
                                  setEditDateValue(session.session_date);
                                  // Extract time in HH:mm format for the input
                                  const date = new Date(session.created_at);
                                  const hours = String(
                                    date.getHours()
                                  ).padStart(2, '0');
                                  const minutes = String(
                                    date.getMinutes()
                                  ).padStart(2, '0');
                                  setEditTimeValue(`${hours}:${minutes}`);
                                  setIsEditingDate(true);
                                }
                              }}
                              className="ml-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all border border-white/10"
                              title="Edit Date/Time"
                              aria-label="Edit Date/Time"
                            >
                              <Calendar className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                      {!isEditingDate && (
                        <p className="text-lg font-bold text-brand-100 opacity-90">
                          {format(
                            parseInputDate(
                              sessions.find((s) => s.id === selectedSessionId)
                                ?.session_date || null
                            ),
                            'MMMM do, yyyy'
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleCloneSession}
                        className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all group/clone"
                      >
                        <Copy className="h-4 w-4 group-hover/clone:scale-110 transition-transform" />
                        Clone Snapshot
                      </button>
                      <div className="mt-auto self-end flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                        <Bird className="h-7 w-7" />
                      </div>
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
                          {people.map((p, pIdx) => {
                            const personInStore = storePeople.find(
                              (sp) => sp.name === p.person_name
                            );
                            const isRemoved = !personInStore;
                            return (
                              <button
                                key={pIdx}
                                onClick={() =>
                                  personInStore &&
                                  setSelectedPersonId(personInStore.id)
                                }
                                aria-label={
                                  isRemoved
                                    ? `${p.person_name} (Removed)`
                                    : `View insights for ${p.person_name}`
                                }
                                className={`flex items-center gap-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 pl-1 pr-4 py-1.5 border shadow-sm transition-all group/person ${
                                  isRemoved
                                    ? 'opacity-60 grayscale cursor-not-allowed border-neutral-100/30 dark:border-neutral-800/30'
                                    : 'border-neutral-100/50 dark:border-neutral-800 hover:shadow-md active:scale-95'
                                }`}
                              >
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-black text-white shadow-xl shadow-black/5 transition-transform ${
                                    !isRemoved && 'group-hover/person:scale-110'
                                  }`}
                                  style={{ backgroundColor: p.avatar_color }}
                                >
                                  {p.person_name.charAt(0).toUpperCase()}
                                </div>
                                <span
                                  className={`text-sm font-bold ${isRemoved ? 'text-neutral-500 line-through decoration-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}
                                >
                                  {p.person_name}
                                  {isRemoved && (
                                    <span className="ml-1 text-[9px] uppercase tracking-widest no-underline inline-block">
                                      (Removed)
                                    </span>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )
                  )}
                </div>

                <div className="py-12 flex flex-col items-center">
                  <div className="h-px w-24 bg-neutral-100 dark:bg-neutral-800 mb-8" />
                  <Link
                    to="/app"
                    className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-600 transition-all hover:gap-5"
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
      {/* Person Insights Sidebar */}
      <PersonInsightsSidebar
        stats={selectedPersonId ? personStats[selectedPersonId] : null}
        onClose={() => setSelectedPersonId(null)}
      />

      {/* Floating Action Button for Help/Tutorial (Only if history exists to target) */}
      {sessions.length > 1 && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40 [html[data-exporting='true']_&]:hidden">
          <button
            id="help-btn"
            onClick={() => startTutorial(HISTORY_TUTORIAL_STEPS)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-500 shadow-xl border border-neutral-200 transition-all hover:text-brand-600 hover:scale-110 active:scale-95 dark:text-neutral-300 dark:bg-neutral-900 dark:border-neutral-800"
            title="Help & Tutorial"
            aria-label="Help & Tutorial"
          >
            <HelpCircle className="h-6 w-6" />
          </button>
        </div>
      )}

      <ProductTutorial />
    </div>
  );
}
interface TeamFlowProps {
  sessions: HistorySession[];
  history: HistoryRowData[];
  onSessionSelect: (id: string) => void;
  currentSessionId: string | null;
  onPersonClick: (id: string) => void;
}

function TeamFlowVisualizer({
  sessions,
  history,
  onSessionSelect,
  currentSessionId,
  onPersonClick,
}: TeamFlowProps) {
  // Aggregate history by session
  const sessionData = sessions.map((s) => {
    const assignments = history.filter((h) => h.session_id === s.id);
    const boards: Record<
      string,
      { id: string; name: string; color: string }[]
    > = {};
    assignments.forEach((a) => {
      const bNode = a.pairing_boards;
      const bData = Array.isArray(bNode) ? bNode[0] : bNode;
      const bName = a.board_name || bData?.name || 'Unknown';

      if (!boards[bName]) boards[bName] = [];

      const pNode = a.people;
      const pData = Array.isArray(pNode) ? pNode[0] : pNode;

      boards[bName].push({
        id: a.person_id,
        name: a.person_name || pData?.name || 'Unknown',
        color: pData?.avatar_color_hex || '#94a3b8',
      });
    });
    return { ...s, boards };
  });

  return (
    <div className="flex gap-12 overflow-x-auto no-scrollbar pb-6">
      {sessionData.map(
        (
          s: {
            id: string;
            session_date: string;
            created_at: string;
            boards: Record<
              string,
              { id: string; name: string; color: string }[]
            >;
          },
          sIdx: number
        ) => (
          <div key={s.id} className="flex-1 min-w-[200px] relative group/col">
            <button
              onClick={() => onSessionSelect(s.id)}
              className={`w-full mb-6 py-2 px-4 rounded-xl border text-left transition-all ${
                currentSessionId === s.id
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10'
                  : 'border-transparent hover:border-neutral-200 dark:hover:border-neutral-800'
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                {format(parseInputDate(s.session_date), 'MMM d')}
              </p>
              <p className="text-[9px] font-bold text-neutral-300 dark:text-neutral-600 mt-0.5">
                {format(new Date(s.created_at), 'h:mm a')}
              </p>
            </button>

            <div className="space-y-6">
              {Object.entries(s.boards).map(([bName, people]) => (
                <div key={bName} className="relative">
                  <p className="text-[9px] font-black uppercase tracking-tight text-neutral-400 mb-2 truncate">
                    {bName}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {people.map(
                      (p: {
                        id: string | null;
                        color: string;
                        name: string;
                      }) => (
                        <motion.button
                          key={p.id || p.name}
                          layoutId={`flow-${p.id || p.name}`}
                          onClick={() => p.id && onPersonClick(p.id)}
                          className={`h-6 w-6 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm transition-transform ${
                            p.id
                              ? 'hover:scale-125 hover:z-10 cursor-pointer'
                              : 'opacity-50 grayscale hover:opacity-100 cursor-not-allowed'
                          }`}
                          style={{ backgroundColor: p.color }}
                          title={p.id ? p.name : `${p.name} (Removed)`}
                        />
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Connection Lines (Visual Polish) */}
            {sIdx < sessionData.length - 1 && (
              <div className="absolute top-[60px] -right-[24px] z-0 pointer-events-none opacity-20 group-hover/col:opacity-100 transition-opacity">
                <ChevronRight className="h-6 w-6 text-neutral-200 dark:text-neutral-800" />
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
