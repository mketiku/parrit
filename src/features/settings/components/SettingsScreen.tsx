import React, { useState, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useThemeStore, type AppTheme } from '../../../store/useThemeStore';
import { usePairingStore } from '../../pairing/store/usePairingStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import {
  Loader2,
  ShieldCheck,
  KeyRound,
  Palette,
  Check,
  Zap,
  Download,
  Upload,
  AlertTriangle,
  Package,
  Clock,
  Tag,
  Share2,
} from 'lucide-react';

const THEMES: { id: AppTheme; name: string; color: string; accent: string }[] =
  [
    {
      id: 'macaw-elite',
      name: 'Macaw Elite',
      color: '#3b82f6',
      accent: '#f59e0b',
    },
    {
      id: 'night-parrot',
      name: 'Night Parrot',
      color: '#64748b',
      accent: '#f43f5e',
    },
  ];

export function SettingsScreen() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const {
    stalePairHighlightingEnabled,
    setStalePairHighlighting,
    showFullName,
    setShowFullName,
    publicViewEnabled,
    setPublicViewEnabled,
  } = useWorkspacePrefsStore();
  const {
    exportWorkspace,
    importWorkspace,
    isLoading: isImporting,
  } = usePairingStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [importConfirm, setImportConfirm] = useState(false);
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract the original Workspace Name from the pseudo-email
  const workspaceName = user?.email?.split('@')[0] || 'Unknown Workspace';

  const handleExport = async () => {
    const json = await exportWorkspace();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parrit-workspace-${workspaceName}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setPendingImportJson(text);
      setImportConfirm(true);
    };
    reader.readAsText(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!pendingImportJson) return;
    await importWorkspace(pendingImportJson);
    setPendingImportJson(null);
    setImportConfirm(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Password successfully updated! Your workspace is secure.',
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ type: 'error', text: err.message });
      } else {
        setMessage({
          type: 'error',
          text: 'An error occurred while updating the password.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Workspace Settings
        </h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          Manage your security credentials and team configurations here.
        </p>
      </div>

      {/* Appearance Section */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/50">
          <Palette className="h-5 w-5 text-brand-500 dark:text-brand-400" />
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Appearance & Theme
          </h2>
        </div>
        <div className="p-6">
          <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
            Choose a flavor that suits your team's vibe.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`group relative flex flex-col items-start gap-3 rounded-2xl border-2 p-5 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  theme === t.id
                    ? 'border-brand-500 bg-brand-50/30 dark:border-brand-500 dark:bg-brand-500/5'
                    : 'border-neutral-100 bg-white hover:border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex gap-2">
                    <div
                      className="h-5 w-5 rounded-full shadow-inner ring-2 ring-white dark:ring-neutral-800"
                      style={{ backgroundColor: t.color }}
                    />
                    <div
                      className="h-5 w-5 rounded-full shadow-inner ring-2 ring-white dark:ring-neutral-800"
                      style={{ backgroundColor: t.accent }}
                    />
                  </div>
                  {theme === t.id && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <h3
                    className={`font-bold ${theme === t.id ? 'text-brand-900 dark:text-brand-100' : 'text-neutral-900 dark:text-neutral-100'}`}
                  >
                    {t.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t.id === 'macaw-elite' && 'Azure Blue & Gold Amber'}
                    {t.id === 'night-parrot' && 'Midnight Slate & Rose'}
                  </p>
                </div>

                {t.id === 'macaw-elite' && (
                  <span className="absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
                    <Zap className="h-2.5 w-2.5" />
                    DEFAULT
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Show Full Name toggle */}
          <div className="mx-6 mb-4 flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-950/30">
            <div className="flex items-start gap-3">
              <Tag className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
              <div>
                <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Show Full Name on Avatars
                </p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  Display first names instead of initials on person chips.
                </p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={showFullName}
              onClick={() => setShowFullName(!showFullName)}
              className={`relative ml-4 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                showFullName
                  ? 'bg-brand-500'
                  : 'bg-neutral-200 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                  showFullName ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Stale Pair Highlighting toggle */}
          <div className="mx-6 mb-6 flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-950/30">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Stale Pair Highlighting
                </p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  Show a warning on boards where teammates have paired in the
                  last 3 sessions, prompting rotation.
                </p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={stalePairHighlightingEnabled}
              onClick={() =>
                setStalePairHighlighting(!stalePairHighlightingEnabled)
              }
              className={`relative ml-4 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                stalePairHighlightingEnabled
                  ? 'bg-amber-500'
                  : 'bg-neutral-200 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                  stalePairHighlightingEnabled
                    ? 'translate-x-5'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="mx-6 mb-6 flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-950/30">
            <div className="flex items-start gap-3">
              <Share2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
              <div>
                <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Public View-Only Access
                </p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  Allow anyone with the link to see your current boards
                  (read-only).
                </p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={publicViewEnabled}
              onClick={async () => {
                const nextVal = !publicViewEnabled;
                setPublicViewEnabled(nextVal);
                if (user) {
                  await supabase
                    .from('workspace_settings')
                    .upsert({ user_id: user.id, public_view_enabled: nextVal });
                }
              }}
              className={`relative ml-4 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                publicViewEnabled
                  ? 'bg-brand-500'
                  : 'bg-neutral-200 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                  publicViewEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Export / Import Section */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/50">
          <Package className="h-5 w-5 text-brand-500 dark:text-brand-400" />
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Workspace Export / Import
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Export your workspace configuration as JSON — people, boards, goals,
            and assignments. Import it into any workspace to restore or
            duplicate.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Export */}
            <button
              onClick={handleExport}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 shadow-sm transition-all hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <Download className="h-4 w-4 text-brand-500" />
              Export as JSON
            </button>

            {/* Import */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 transition-all hover:bg-brand-600 disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import from JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Import confirmation modal */}
          {importConfirm && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800/50 dark:bg-amber-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-900 dark:text-amber-300">
                    This will replace your entire workspace
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    All current people and boards will be deleted and replaced
                    with the imported data. This cannot be undone.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={confirmImport}
                      disabled={isImporting}
                      className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-amber-700 disabled:opacity-50"
                    >
                      {isImporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Yes, replace workspace
                    </button>
                    <button
                      onClick={() => {
                        setImportConfirm(false);
                        setPendingImportJson(null);
                      }}
                      className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 transition-all hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Section */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/50">
          <ShieldCheck className="h-5 w-5 text-brand-500 dark:text-brand-400" />
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Account Security
          </h2>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Current Authenticated Workspace
            </h3>
            <p className="mt-1 flex items-center gap-2 font-mono text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {workspaceName}
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-green-700 dark:bg-green-500/20 dark:text-green-400">
                Active
              </span>
            </p>
          </div>

          <form onSubmit={handlePasswordUpdate} className="max-w-md space-y-5">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-neutral-400" />
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                Update Workspace Password
              </h3>
            </div>

            {message && (
              <div
                className={`mb-6 rounded-xl p-4 text-sm ${
                  message.type === 'error'
                    ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                    : 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-700 dark:bg-neutral-950/50 dark:focus:border-brand-400 dark:focus:bg-neutral-900"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-700 dark:bg-neutral-950/50 dark:focus:border-brand-400 dark:focus:bg-neutral-900"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus:ring-white dark:focus:ring-offset-neutral-900"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Save New Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
