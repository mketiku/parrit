import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';

import { PairingWorkspace } from './features/pairing/components/PairingWorkspace';

// Placeholder views
function DashboardView() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Phoenix Workspace
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

function TeamView() {
  return <div>Team Settings Placeholder</div>;
}

function SettingsView() {
  return <div>Application Settings Placeholder</div>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardView />} />
          <Route path="/team" element={<TeamView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
