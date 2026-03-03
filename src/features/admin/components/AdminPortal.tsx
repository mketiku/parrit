import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/store/useAuthStore';
import {
  Users,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Search,
  Eye,
  EyeOff,
  Lock,
  ChevronRight,
} from 'lucide-react';

interface WorkspaceInfo {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  public_view_enabled: boolean;
}

export function AdminPortal() {
  const { isAdmin } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('admin_get_workspaces');
      if (error) throw error;
      if (data) setWorkspaces(data as WorkspaceInfo[]);
    } catch (err: unknown) {
      console.error('Admin fetch error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(
        message || 'Failed to fetch workspaces. Check SQL instructions.'
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchWorkspaces();
    }
  }, [isAdmin, fetchWorkspaces]);

  const filteredWorkspaces = workspaces.filter((w) =>
    w.email?.toLowerCase().includes(search.toLowerCase())
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
        <p className="mt-2 max-w-sm text-neutral-500 dark:text-neutral-400">
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

  if (loading && workspaces.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-neutral-500">Scanning workspaces...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <Lock className="h-8 w-8 text-brand-500" />
            Admin Control
          </h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Secure audit view via RBAC. Action logs are recorded.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Filter by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-900 dark:text-red-400">
            System Error
          </h2>
          <p className="mt-2 text-red-700 dark:text-red-500 max-w-md mx-auto">
            {error}
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
          {filteredWorkspaces.map((w) => {
            const workspaceName = w.email?.split('@')[0] || 'Unknown';
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
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate">
                    {workspaceName}
                  </h3>
                  <p className="text-[10px] font-mono text-neutral-400 mt-1 uppercase">
                    ID: {w.id.slice(0, 8)}...
                  </p>
                </div>

                <div className="flex flex-col gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                  <a
                    href={`/view/${w.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2 text-xs font-bold text-neutral-600 transition-all hover:bg-brand-50 hover:text-brand-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Inspect Workspace
                    </div>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
