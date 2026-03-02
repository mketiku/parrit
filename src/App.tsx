import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';

// Placeholder views
function DashboardView() {
    return (
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Current Pairing Workspace: Phoenix
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2">
                Manage your team's pairings here.
            </p>
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
