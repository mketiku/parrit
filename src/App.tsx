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
import { LandingPage } from './features/static/components/LandingPage';
import { PairingWorkspace } from './features/pairing/components/PairingWorkspace';
import { HistoryScreen } from './features/pairing/components/HistoryScreen';
import { usePairingStore } from './features/pairing/store/usePairingStore';

// Authenticated dashboard wrapper
function DashboardView() {
  const { workspaceName } = useAuthStore();
  const { isLoading: dataLoading } = usePairingStore();
  const displayName = workspaceName
    ? workspaceName.charAt(0).toUpperCase() + workspaceName.slice(1)
    : 'Workspace';

  if (dataLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {displayName} Workspace
        </h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          Drag and drop team members to configure today's pairing sessions.
        </p>
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

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  // Load workspace data and subscribe to live updates when authenticated
  React.useEffect(() => {
    if (!user) return;
    loadWorkspaceData();
    const unsubscribe = subscribeToRealtime();
    return unsubscribe;
  }, [user, loadWorkspaceData, subscribeToRealtime]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes (no login required) ── */}
        <Route element={<PublicLayout />}>
          <Route
            path="/"
            element={user ? <Navigate to="/app" replace /> : <LandingPage />}
          />
          <Route path="/about" element={<AboutScreen />} />
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
            <Route path="/app/settings" element={<SettingsScreen />} />
          </Route>
        ) : (
          /* Redirect any /app/* requests to login when unauthenticated */
          <Route path="/app/*" element={<Navigate to="/login" replace />} />
        )}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
