import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Bird, Moon, Sun } from 'lucide-react';

export default function AppLayout() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        document.documentElement.classList.contains('dark') ||
        (window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className="flex min-h-screen w-full flex-col font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 shrink-0 border-b border-neutral-200 bg-white/50 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="flex items-center gap-6 sm:gap-8">
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

          {/* User Context (Placeholder for Auth) & Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-400 ring-1 ring-neutral-300 dark:ring-neutral-700">
              MK
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
