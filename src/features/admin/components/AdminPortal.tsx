import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/store/useAuthStore';
import {
  Users,
  ShieldAlert,
  Loader2,
  Search,
  Eye,
  EyeOff,
  Lock,
  MessageSquare,
  Bug,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';

interface WorkspaceInfo {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  public_view_enabled: boolean;
  member_count: number;
  board_count: number;
}

interface FeedbackItem {
  id: string;
  created_at: string;
  user_id: string | null;
  type: 'bug' | 'idea' | 'general';
  message: string;
  page: string | null;
  is_read: boolean;
}

const FEEDBACK_TYPE_CONFIG = {
  bug: {
    label: 'Bug',
    icon: <Bug className="h-3.5 w-3.5" />,
    className:
      'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  },
  idea: {
    label: 'Idea',
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    className:
      'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
  },
  general: {
    label: 'General',
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    className:
      'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700',
  },
} as const;

type Tab = 'workspaces' | 'feedback';

export function AdminPortal() {
  const { isAdmin } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('workspaces');

  // Workspaces state
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(true);
  const [workspacesError, setWorkspacesError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Feedback state
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    if (!isAdmin) return;
    setWorkspacesLoading(true);
    setWorkspacesError(null);
    try {
      const { data, error } = await supabase.rpc('admin_get_workspaces');
      if (error) throw error;
      if (data) setWorkspaces(data as WorkspaceInfo[]);
    } catch (err: unknown) {
      console.error('Admin fetch error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setWorkspacesError(
        message || 'Failed to fetch workspaces. Check SQL instructions.'
      );
    } finally {
      setWorkspacesLoading(false);
    }
  }, [isAdmin]);

  const fetchFeedback = useCallback(async () => {
    if (!isAdmin) return;
    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      const { data, error } = await supabase.rpc('admin_get_feedback');
      if (error) throw error;
      if (data) setFeedback(data as FeedbackItem[]);
    } catch (err: unknown) {
      console.error('Feedback fetch error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setFeedbackError(message || 'Failed to fetch feedback.');
    } finally {
      setFeedbackLoading(false);
    }
  }, [isAdmin]);

  const markAsRead = async (id: string) => {
    if (!isAdmin) return;
    try {
      const { error } = await supabase.rpc('admin_mark_feedback_read', {
        feedback_id: id,
      });
      if (error) throw error;
      setFeedback((prev) => prev.filter((f) => f.id !== id));
    } catch (err: unknown) {
      console.error('Mark as Read error:', err);
      // Fallback: update local state anyway so user sees it "gone"
      setFeedback((prev) => prev.filter((f) => f.id !== id));
    }
  };

  useEffect(() => {
    if (isAdmin) fetchWorkspaces();
  }, [isAdmin, fetchWorkspaces]);

  useEffect(() => {
    if (
      isAdmin &&
      activeTab === 'feedback' &&
      feedback.length === 0 &&
      !feedbackError
    ) {
      fetchFeedback();
    }
  }, [isAdmin, activeTab, feedback.length, feedbackError, fetchFeedback]);

  const filteredWorkspaces = workspaces.filter((w) =>
    (w.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 text-red-600 dark:bg-red-500/20">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Restricted Access
        </h1>
        <p className="mt-2 max-w-sm text-neutral-500 dark:text-neutral-300">
          This portal is restricted to the system administrator.
        </p>
        <a
          href="/app"
          className="mt-8 rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
        >
          Return to App
        </a>
      </div>
    );
  }

  if (workspacesLoading && workspaces.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-neutral-500">Scanning workspaces...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <Lock className="h-8 w-8 text-brand-500" />
            Admin Control
          </h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-300">
            Secure audit view via RBAC. Action logs are recorded.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-neutral-100 p-1 w-fit dark:bg-neutral-800">
        {(['workspaces', 'feedback'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Workspaces Tab */}
      {activeTab === 'workspaces' && (
        <>
          <div className="mb-6">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Filter by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900"
              />
            </div>
          </div>

          {workspacesError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
              <ShieldAlert className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-900 dark:text-red-400">
                System Error
              </h2>
              <p className="mt-2 text-red-700 dark:text-red-500 max-w-md mx-auto">
                {workspacesError}
              </p>
              <button
                onClick={fetchWorkspaces}
                className="mt-6 rounded-xl bg-neutral-900 px-6 py-2 text-sm font-bold text-white hover:bg-neutral-800"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredWorkspaces.length > 0 ? (
                filteredWorkspaces.map((w) => {
                  return (
                    <div
                      key={w.id}
                      className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-brand-500/50 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                          {w.public_view_enabled ? (
                            <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                              <Eye className="h-3 w-3" /> Public
                            </span>
                          ) : (
                            <span className="text-neutral-400 flex items-center gap-1">
                              <EyeOff className="h-3 w-3" /> Private
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3
                          className="text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate"
                          title={w.email || ''}
                        >
                          {w.email
                            ? `${w.email.split('@')[0].slice(0, 1)}***@${w.email.split('@')[1]}`
                            : `Workspace ${w.id.slice(0, 5)}`}
                        </h3>
                        <p className="text-[10px] font-mono text-neutral-400 mt-1 uppercase">
                          ID: {w.id.slice(0, 8)}...
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                            Team
                          </span>
                          <span className="text-lg font-bold text-neutral-900 dark:text-white">
                            {w.member_count}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                            Boards
                          </span>
                          <span className="text-lg font-bold text-neutral-900 dark:text-white">
                            {w.board_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-20 text-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800">
                  <Users className="mx-auto h-10 w-10 text-neutral-300 mb-4" />
                  <p className="text-neutral-500">
                    No workspaces found matching your search.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <>
          {feedbackLoading ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
              <p className="text-neutral-500">Loading feedback...</p>
            </div>
          ) : feedbackError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
              <ShieldAlert className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="mt-2 text-red-700 dark:text-red-500">
                {feedbackError}
              </p>
              <button
                onClick={fetchFeedback}
                className="mt-6 rounded-xl bg-neutral-900 px-6 py-2 text-sm font-bold text-white hover:bg-neutral-800"
              >
                Retry
              </button>
            </div>
          ) : feedback.length === 0 ? (
            <div className="py-20 text-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800">
              <MessageSquare className="mx-auto h-10 w-10 text-neutral-300 mb-4" />
              <p className="text-neutral-500">No feedback submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item) => {
                const config = FEEDBACK_TYPE_CONFIG[item.type];
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 flex-1">
                        {item.message}
                      </p>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`shrink-0 flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold ${config.className}`}
                        >
                          {config.icon}
                          {config.label}
                        </span>
                        <button
                          onClick={() => markAsRead(item.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-neutral-500 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-400 dark:hover:border-brand-900 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                          title="Mark as handled"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Mark as Read
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                      <span>
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {item.page && (
                        <span className="font-mono">{item.page}</span>
                      )}
                      {item.user_id && (
                        <span className="font-mono">
                          uid:{item.user_id.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
