import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import PublicLayout from './components/layout/PublicLayout';
import { AuthScreen } from './features/auth/components/AuthScreen';
import { useAuthStore } from './features/auth/store/useAuthStore';
import { Loader2 } from 'lucide-react';
import { SettingsScreen } from './features/settings/components/SettingsScreen';
import { TeamScreen } from './features/team/components/TeamScreen';
import { AboutScreen } from './features/static/components/AboutScreen';
import { PairingGuide } from './features/static/components/PairingGuide';
import { LandingPage } from './features/static/components/LandingPage';
import { PairingWorkspace } from './features/pairing/components/PairingWorkspace';
import { HistoryScreen } from './features/pairing/components/HistoryScreen';
import { usePairingStore } from './features/pairing/store/usePairingStore';
import { useThemeStore } from './store/useThemeStore';
import { PublicView } from './features/pairing/components/PublicView';
import { AdminPortal } from './features/admin/components/AdminPortal';
import { AdminShortcutListener } from './features/admin/components/AdminShortcutListener';
import { formatToday } from './features/pairing/utils/dateUtils';

// Authenticated dashboard wrapper
function DashboardView() {
  const workspaceName = useAuthStore((s) => s.workspaceName);
  const dataLoading = usePairingStore((s) => s.isLoading);
  const displayName = workspaceName
    ? workspaceName.charAt(0).toUpperCase() + workspaceName.slice(1)
    : 'Workspace';

  if (dataLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              {displayName} Workspace
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
            Pairing Dashboard
          </h1>
          <p className="mt-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Drag and drop team members to configure today's pairing sessions.
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
            Today
          </p>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 italic">
            {formatToday()}
          </p>
        </div>
      </div>
      <div className="flex-1">
        <PairingWorkspace />
      </div>
    </div>
  );
}

function App() {
  const { user, isLoading, initialize } = useAuthStore();
  const { loadWorkspaceData, subscribeToRealtime } = usePairingStore();
  const { theme, setTheme, isDark, applyDark } = useThemeStore();

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle theme application separately
  React.useEffect(() => {
    setTheme(theme);
    applyDark(isDark);
  }, [theme, setTheme, isDark, applyDark]);

  // Load workspace data and subscribe to live updates when authenticated
  const userId = user?.id;
  React.useEffect(() => {
    if (!userId) return;
    loadWorkspaceData();
    const unsubscribe = subscribeToRealtime();
    return unsubscribe;
  }, [userId, loadWorkspaceData, subscribeToRealtime]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <>
      <BrowserRouter>
        <AdminShortcutListener />
        <Routes>
          {/* ── Public routes (no login required) ── */}
          <Route element={<PublicLayout />}>
            <Route
              path="/"
              element={user ? <Navigate to="/app" replace /> : <LandingPage />}
            />
            <Route path="/about" element={<AboutScreen />} />
            <Route path="/guide" element={<PairingGuide />} />
            <Route path="/view/:shareToken" element={<PublicView />} />
            <Route
              path="/login"
              element={user ? <Navigate to="/app" replace /> : <AuthScreen />}
            />
          </Route>

          {/* ── Authenticated app routes ── */}
          {user ? (
            <Route element={<AppLayout />}>
              <Route path="/app" element={<DashboardView />} />
              <Route path="/app/team" element={<TeamScreen />} />
              <Route path="/app/history" element={<HistoryScreen />} />
              <Route path="/app/guide" element={<PairingGuide />} />
              <Route path="/app/settings" element={<SettingsScreen />} />
              <Route path="/app/admin" element={<AdminPortal />} />
            </Route>
          ) : (
            /* Redirect any /app/* requests to login when unauthenticated */
            <Route path="/app/*" element={<Navigate to="/login" replace />} />
          )}

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
