import React, { useEffect, useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { Bird, Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { Toaster } from '../ui/Toaster';

export default function AppLayout() {
  const { signOut } = useAuthStore();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <div className="flex items-center gap-4 sm:gap-8">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 sm:hidden items-center justify-center rounded-xl bg-neutral-100/50 text-neutral-600 hover:bg-neutral-100 transition-colors dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:bg-neutral-800"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

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

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
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

          {/* User Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white/50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
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
              className="flex h-10 items-center gap-2 shrink-0 rounded-xl bg-neutral-900 px-4 text-xs font-bold text-white shadow-xl transition-all hover:bg-neutral-800 active:scale-95 dark:bg-brand-500 dark:hover:bg-brand-600 sm:h-9"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Sidebar/Menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-[65px] z-[60] sm:hidden">
            <div
              className="absolute inset-0 bg-neutral-900/20 backdrop-blur-sm dark:bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-0 h-full w-[280px] border-r border-neutral-200 bg-white p-6 shadow-2xl animate-in slide-in-from-left duration-300 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  Navigation
                </p>
                <NavLink
                  to="/app"
                  end
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                        : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'
                    }`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/app/team"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                        : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'
                    }`
                  }
                >
                  Team
                </NavLink>
                <NavLink
                  to="/app/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                        : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'
                    }`
                  }
                >
                  History
                </NavLink>
                <NavLink
                  to="/app/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                        : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'
                    }`
                  }
                >
                  Settings
                </NavLink>

                <div className="mt-6 border-t border-neutral-100 pt-6 dark:border-neutral-800">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition-all active:scale-95 dark:bg-red-500/10 dark:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
