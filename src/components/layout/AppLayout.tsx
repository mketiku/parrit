import React, { useEffect, useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { Bird, Moon, Sun, LogOut } from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { Toaster } from '../ui/Toaster';

export default function AppLayout() {
  const { signOut } = useAuthStore();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className="flex min-h-screen w-full flex-col font-sans selection:bg-brand-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 shrink-0 border-b border-neutral-200 bg-white/50 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="flex items-center gap-6 sm:gap-8">
            {/* Logo */}
            <Link
              to="/app"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm shadow-brand-500/20">
                <Bird className="h-5 w-5" />
              </div>
              <span className="font-bold tracking-tight">Parrit</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1 text-sm font-medium overflow-x-auto whitespace-nowrap no-scrollbar hide-scrollbar">
              <NavLink
                to="/app"
                end
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                    isActive
                      ? 'bg-neutral-100 text-brand-600 dark:bg-neutral-800 dark:text-brand-400'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/app/team"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                    isActive
                      ? 'bg-neutral-100 text-brand-600 dark:bg-neutral-800 dark:text-brand-400'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`
                }
              >
                Team
              </NavLink>
              <NavLink
                to="/app/history"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                    isActive
                      ? 'bg-neutral-100 text-brand-600 dark:bg-neutral-800 dark:text-brand-400'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`
                }
              >
                History
              </NavLink>
              <NavLink
                to="/app/settings"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                    isActive
                      ? 'bg-neutral-100 text-brand-600 dark:bg-neutral-800 dark:text-brand-400'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`
                }
              >
                Settings
              </NavLink>
            </nav>
          </div>

          {/* User Context (Placeholder for Auth) & Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-4 pl-2">
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => signOut()}
              className="flex h-8 items-center gap-2 shrink-0 rounded-lg bg-neutral-200 px-3 text-xs font-semibold text-neutral-600 ring-1 ring-neutral-300 transition-all hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700 dark:hover:bg-neutral-700"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          ⚠️ You are currently offline. Parrit is running in read-only mode and
          changes cannot be saved.
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-6 md:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-neutral-200 bg-white/50 py-6 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="mx-auto flex flex-col md:flex-row w-full items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-12 gap-4">
          <div className="flex items-center gap-6">
            <Link
              to="/about"
              className="text-xs font-medium text-neutral-500 hover:text-brand-500 transition-colors"
            >
              About
            </Link>
            <a
              href="/about#contact"
              className="text-xs font-medium text-neutral-500 hover:text-brand-500 transition-colors"
            >
              Contact
            </a>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-600">
            &copy; {new Date().getFullYear()} Parrit.
          </p>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
