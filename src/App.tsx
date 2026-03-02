import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { AuthScreen } from './features/auth/components/AuthScreen';
import { useAuthStore } from './features/auth/store/useAuthStore';
import { Loader2 } from 'lucide-react';
import { SettingsScreen } from './features/settings/components/SettingsScreen';
import { TeamScreen } from './features/team/components/TeamScreen';
import { AboutScreen } from './features/static/components/AboutScreen';
import { PairingWorkspace } from './features/pairing/components/PairingWorkspace';
import { usePairingStore } from './features/pairing/store/usePairingStore';

// Placeholder views
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
  const { loadWorkspaceData } = usePairingStore();

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  // Load workspace data whenever a user session is established
  React.useEffect(() => {
    if (user) {
      loadWorkspaceData();
    }
  }, [user, loadWorkspaceData]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardView />} />
          <Route path="/team" element={<TeamScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/about" element={<AboutScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
