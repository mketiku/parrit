import React, { useEffect, useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { Bird, Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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
                className={({ isActive }: { isActive: boolean }) =>
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

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 z-[60] bg-neutral-900/20 backdrop-blur-sm dark:bg-black/40 sm:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-[70] w-full max-w-[300px] bg-white shadow-2xl dark:bg-neutral-900 sm:hidden"
              >
                <div className="flex h-full flex-col">
                  {/* Drawer Header */}
                  <div className="flex h-16 items-center justify-between border-b border-neutral-100 px-6 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
                        <Bird className="h-5 w-5" />
                      </div>
                      <span className="font-bold">Parrit</span>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto px-4 py-6">
                    <p className="mb-4 px-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      Menu
                    </p>
                    <div className="space-y-1">
                      {[
                        { to: '/app', label: 'Dashboard', end: true },
                        { to: '/app/team', label: 'Team' },
                        { to: '/app/history', label: 'History' },
                        { to: '/app/settings', label: 'Settings' },
                      ].map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }: { isActive: boolean }) =>
                            `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                              isActive
                                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 text-base'
                                : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'
                            }`
                          }
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>

                  {/* Drawer Footer */}
                  <div className="border-t border-neutral-100 p-6 dark:border-neutral-800">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-sm font-bold text-red-600 transition-all active:scale-95 dark:bg-red-500/10 dark:text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
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
