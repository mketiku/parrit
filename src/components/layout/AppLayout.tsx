import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Bird } from 'lucide-react';

export default function AppLayout() {
  return (
    <div className="flex h-screen w-full flex-col bg-neutral-50 dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-100 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="sticky top-0 z-10 shrink-0 border-b border-neutral-200 bg-white/50 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-sm shadow-indigo-500/20">
                <Bird className="h-5 w-5" />
              </div>
              <span className="font-bold tracking-tight">Parrit</span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1 text-sm font-medium">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                    isActive
                      ? 'bg-neutral-100 text-indigo-600 dark:bg-neutral-800 dark:text-indigo-400'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/team"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                    isActive
                      ? 'bg-neutral-100 text-indigo-600 dark:bg-neutral-800 dark:text-indigo-400'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`
                }
              >
                Team
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                    isActive
                      ? 'bg-neutral-100 text-indigo-600 dark:bg-neutral-800 dark:text-indigo-400'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`
                }
              >
                Settings
              </NavLink>
            </nav>
          </div>

          {/* User Context (Placeholder for Auth) */}
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-400 ring-1 ring-neutral-300 dark:ring-neutral-700">
              MK
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-[1600px] p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
