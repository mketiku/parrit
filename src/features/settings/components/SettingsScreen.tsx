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
  AlertTriangle,
  Clock,
  Tag,
  Share2,
  HelpCircle,
  Copy,
  ExternalLink,
  MessageSquare,
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
    onboardingCompleted,
    setOnboardingCompleted,
    stalePairThreshold,
    setStalePairThreshold,
    meetingLinkEnabled,
    setMeetingLinkEnabled,
    slackWebhookUrl,
    setSlackWebhookUrl,
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
  const [includeHistoryInExport, setIncludeHistoryInExport] = useState(true);
  const [justCopied, setJustCopied] = useState(false);
  const [webhookError, setWebhookError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract the original Workspace Name from the pseudo-email
  const workspaceName = user?.email?.split('@')[0] || 'Unknown Workspace';

  const handleExport = async () => {
    const json = await exportWorkspace(includeHistoryInExport);
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

  const [activeTab, setActiveTab] = useState<
    'general' | 'pairing' | 'sharing' | 'integrations' | 'security'
  >('general');

  const TABS = [
    {
      id: 'general',
      label: 'General',
      icon: Palette,
      description: 'Branding & UI',
    },
    {
      id: 'pairing',
      label: 'Pairing',
      icon: Zap,
      description: 'Logic & History',
    },
    {
      id: 'sharing',
      label: 'Sharing',
      icon: Share2,
      description: 'Public Access',
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: MessageSquare,
      description: 'Chat & Webhooks',
    },
    {
      id: 'security',
      label: 'Security',
      icon: ShieldCheck,
      description: 'Data & Access',
    },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl pb-24 px-4 sm:px-6">
      {/* Page Header */}
      <header className="mb-10 pt-8">
        <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
          Settings
        </h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-300">
          Manage your {workspaceName} environment and team preferences.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar / Navigation */}
        <aside className="lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide sticky lg:top-8 z-10 bg-neutral-50 dark:bg-neutral-950 -mx-4 px-4 lg:mx-0 lg:px-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all shrink-0 lg:w-full ${
                  activeTab === tab.id
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <tab.icon
                  className={`h-5 w-5 ${activeTab === tab.id ? 'text-white' : 'text-neutral-500 dark:text-neutral-300'}`}
                />
                <div className="text-left hidden sm:block">
                  <span className="block text-sm font-black whitespace-nowrap">
                    {tab.label}
                  </span>
                  <span
                    className={`hidden lg:block text-[10px] font-medium ${activeTab === tab.id ? 'text-brand-50' : 'text-neutral-500 dark:text-neutral-300'}`}
                  >
                    {tab.description}
                  </span>
                </div>
                <span className="sm:hidden text-sm font-black">
                  {tab.label}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 max-w-3xl space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
          {activeTab === 'general' && (
            <section className="space-y-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                  General Appearance
                </h2>
                <p className="text-sm text-neutral-500">
                  Global visual preferences for your workspace.
                </p>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-white p-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      aria-label={`Switch to ${t.name} theme`}
                      aria-pressed={theme === t.id}
                      className={`group relative flex flex-col items-start gap-4 rounded-2xl border-2 p-6 transition-all ${
                        theme === t.id
                          ? 'border-brand-500 bg-brand-50/30 dark:border-brand-500 dark:bg-brand-500/5'
                          : 'border-transparent bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-950/50 dark:hover:bg-neutral-950'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex -space-x-2">
                          <div
                            className="h-8 w-8 rounded-full border-4 border-white dark:border-neutral-800"
                            style={{ backgroundColor: t.color }}
                          />
                          <div
                            className="h-8 w-8 rounded-full border-4 border-white dark:border-neutral-800"
                            style={{ backgroundColor: t.accent }}
                          />
                        </div>
                        {theme === t.id && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                          {t.name}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          {t.id === 'macaw-elite'
                            ? 'Azure & Gold'
                            : 'Slate & Rose'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-2 divide-y divide-neutral-100 dark:divide-neutral-800">
                  <SettingToggle
                    icon={<Tag className="h-5 w-5 text-neutral-400" />}
                    title="Display Names"
                    description="Show first names instead of initials on avatars."
                    checked={showFullName}
                    onChange={setShowFullName}
                  />
                </div>
              </div>
            </section>
          )}

          {activeTab === 'pairing' && (
            <section className="space-y-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                  Pairing Intelligence
                </h2>
                <p className="text-sm text-neutral-500">
                  Configure thresholds and onboarding flow.
                </p>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-white p-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                        Stale Pair Warning
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-300">
                        Alert when a pair has been together for consecutive
                        sessions.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pl-14 sm:pl-0">
                    {stalePairHighlightingEnabled && (
                      <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
                        {[2, 3, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() => setStalePairThreshold(val)}
                            aria-label={`Warn after ${val} consecutive sessions`}
                            aria-pressed={stalePairThreshold === val}
                            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                              stalePairThreshold === val
                                ? 'bg-amber-500 text-white shadow-md'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    )}
                    <ToggleSwitch
                      checked={stalePairHighlightingEnabled}
                      onChange={setStalePairHighlighting}
                      color="amber"
                    />
                  </div>
                </div>

                <div className="border-t border-neutral-100 dark:border-neutral-800">
                  <SettingToggle
                    icon={<HelpCircle className="h-5 w-5 text-neutral-400" />}
                    title="Product Tutorial Auto-Start"
                    description="Automatically start the tutorial for empty workspaces."
                    checked={!onboardingCompleted}
                    onChange={async (val) => {
                      const completed = !val;
                      setOnboardingCompleted(completed);
                      if (user) {
                        await supabase.from('workspace_settings').upsert({
                          user_id: user.id,
                          onboarding_completed: completed,
                          public_view_enabled: publicViewEnabled,
                        });
                      }
                    }}
                  />
                </div>
                <div className="border-t border-neutral-100 dark:border-neutral-800">
                  <SettingToggle
                    icon={<Tag className="h-5 w-5 text-neutral-400" />}
                    title="Meeting Links on Boards"
                    description="Show a meeting link field (Zoom, Meet, etc.) on each pairing board."
                    checked={meetingLinkEnabled}
                    onChange={setMeetingLinkEnabled}
                  />
                </div>
              </div>
            </section>
          )}

          {activeTab === 'sharing' && (
            <section className="space-y-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                  Sharing
                </h2>
                <p className="text-sm text-neutral-500">
                  Manage public access and live collaboration.
                </p>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-white p-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <SettingToggle
                  icon={<ExternalLink className="h-5 w-5 text-neutral-400" />}
                  title="Share Live Dashboard"
                  description="Public read-only link for stakeholders."
                  checked={publicViewEnabled}
                  onChange={async (val) => {
                    setPublicViewEnabled(val);
                    if (user) {
                      await supabase.from('workspace_settings').upsert({
                        user_id: user.id,
                        public_view_enabled: val,
                        onboarding_completed: onboardingCompleted,
                      });
                    }
                  }}
                />

                {publicViewEnabled && user && (
                  <div className="m-4 mt-0 overflow-hidden rounded-2xl bg-neutral-50 p-6 dark:bg-neutral-950/50 border border-neutral-100 dark:border-neutral-800">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="flex-1 space-y-1 text-center sm:text-left min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-500">
                          Public Link
                        </span>
                        <p className="font-mono text-xs text-neutral-500 truncate">
                          {window.location.origin}/view/{user.id}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(
                              `${window.location.origin}/view/${user.id}`
                            );
                            setJustCopied(true);
                            setTimeout(() => setJustCopied(false), 2000);
                          }}
                          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-bold text-neutral-600 transition-all hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-800"
                        >
                          {justCopied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white" />
                          )}
                          {justCopied ? 'Copied' : 'Copy'}
                        </button>
                        <a
                          href={`/view/${user.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-xs font-bold text-white transition-all hover:bg-neutral-800 dark:bg-brand-500 dark:hover:bg-brand-600"
                        >
                          Visit
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'integrations' && (
            <section className="space-y-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                  Integrations
                </h2>
                <p className="text-sm text-neutral-500">
                  Connect Parrit to your team's communication tools.
                </p>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/20 text-brand-500">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                      Chat Webhook
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-300">
                      Send daily board assignments to Slack, Discord, or Teams
                      when you click "Save Session".
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pl-0 sm:pl-14 relative">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                    Webhook URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackWebhookUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSlackWebhookUrl(val);
                      if (val && !val.startsWith('https://')) {
                        setWebhookError('Webhook URL must start with https://');
                      } else {
                        setWebhookError('');
                      }
                    }}
                    className={`w-full rounded-2xl border-2 bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-900 transition-all hover:bg-neutral-200 focus:bg-white focus:outline-none dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 focus:dark:bg-neutral-900 ${
                      webhookError
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-transparent focus:border-brand-500'
                    }`}
                  />
                  {webhookError ? (
                    <p className="text-[11px] font-bold text-red-500">
                      {webhookError}
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium text-neutral-400">
                      Leave blank to disable chat notifications.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'security' && (
            <section className="space-y-12">
              <div className="space-y-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                    Security & Backups
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Manage your data and access credentials.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-50 dark:bg-neutral-950 text-neutral-400">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                        Password
                      </h3>
                    </div>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                      {message && (
                        <div
                          className={`rounded-xl p-3 text-[11px] font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-500/10' : 'bg-green-50 text-green-600 dark:bg-green-500/10'}`}
                        >
                          {message.text}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-950"
                          placeholder="New"
                        />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-950"
                          placeholder="Confirm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading || !newPassword}
                        className="w-full rounded-xl bg-neutral-900 py-2.5 text-xs font-black uppercase tracking-widest text-white dark:bg-white dark:text-neutral-900"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        ) : (
                          'Save'
                        )}
                      </button>
                    </form>
                  </div>

                  <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-50 dark:bg-neutral-950 text-neutral-400">
                        <Download className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                        Backup
                      </h3>
                    </div>
                    <p className="mb-6 text-xs text-neutral-500">
                      Download your workspace JSON.
                    </p>
                    <div className="space-y-4">
                      <button
                        onClick={() =>
                          setIncludeHistoryInExport(!includeHistoryInExport)
                        }
                        className="flex w-full items-center justify-between rounded-xl bg-neutral-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:bg-neutral-950"
                      >
                        <span>History</span>
                        <div
                          className={`h-4 w-8 rounded-full transition-colors ${includeHistoryInExport ? 'bg-brand-500' : 'bg-neutral-300'}`}
                        >
                          <div
                            className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${includeHistoryInExport ? 'translate-x-4' : 'translate-x-0'}`}
                          />
                        </div>
                      </button>
                      <button
                        onClick={handleExport}
                        className="w-full rounded-xl border border-neutral-200 py-3 text-xs font-black uppercase tracking-widest text-neutral-700 dark:border-neutral-800 dark:text-white"
                      >
                        Run Export
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 space-y-6">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    Danger Zone
                  </h2>
                </div>
                <div className="rounded-3xl border-2 border-dashed border-red-200 bg-red-50/20 p-8 dark:border-red-900/10">
                  <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                    <div className="flex-1 space-y-2">
                      <h3 className="font-black text-red-600">
                        Import Workspace
                      </h3>
                      <p className="text-xs text-red-700/60 dark:text-red-400/60 leading-relaxed max-w-sm">
                        This will replace all current data.
                      </p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-2xl bg-red-600 px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all"
                    >
                      Import JSON
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {importConfirm && (
                    <div className="mt-8 rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-950 animate-in zoom-in-95">
                      <h4 className="flex items-center gap-2 font-black text-neutral-900 dark:text-white">
                        <ShieldCheck className="h-5 w-5 text-red-600" />
                        Destructive Action
                      </h4>
                      <p className="mt-2 text-sm text-neutral-500">
                        Are you sure? This cannot be undone.
                      </p>
                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={confirmImport}
                          className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-black uppercase tracking-widest text-white"
                        >
                          {isImporting
                            ? 'Importing...'
                            : 'Yes, Replace Everything'}
                        </button>
                        <button
                          onClick={() => setImportConfirm(false)}
                          className="px-6 py-3 text-xs font-black uppercase tracking-widest text-neutral-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

// ── UX HELPER COMPONENTS ───────────────────────────────────────────────────

function SettingToggle({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-6 transition-all hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20">
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-50 dark:bg-neutral-950">
          {icon}
        </div>
        <div id={`label-${title.replace(/\s+/g, '-').toLowerCase()}`}>
          <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-300">
            {description}
          </p>
        </div>
      </div>
      <ToggleSwitch
        checked={checked}
        onChange={onChange}
        ariaLabelledBy={`label-${title.replace(/\s+/g, '-').toLowerCase()}`}
      />
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  color = 'brand',
  ariaLabelledBy,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  color?: 'brand' | 'amber';
  ariaLabelledBy?: string;
}) {
  const bgClass =
    color === 'brand'
      ? checked
        ? 'bg-brand-500'
        : 'bg-neutral-200 dark:bg-neutral-700'
      : checked
        ? 'bg-amber-500'
        : 'bg-neutral-200 dark:bg-neutral-700';

  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-labelledby={ariaLabelledBy}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${bgClass}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
