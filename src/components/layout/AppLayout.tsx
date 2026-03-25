import React, { useEffect, useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { Bird, Moon, Sun, LogOut, Menu, X } from 'lucide-react';

import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { Toaster } from '../ui/Toaster';
import { useThemeStore } from '../../store/useThemeStore';
import { FeedbackModal } from '../../features/feedback/components/FeedbackModal';

export default function AppLayout() {
  const { signOut, isAdmin } = useAuthStore();
  const { isDark, toggleDark } = useThemeStore();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

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

  // Close drawer on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { to: '/app', label: 'Dashboard', end: true },
    { to: '/app/team', label: 'Team' },
    { to: '/app/history', label: 'History' },
    ...(isAdmin ? [{ to: '/app/admin', label: 'Admin' }] : []),
    { to: '/app/settings', label: 'Settings' },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col font-sans selection:bg-brand-500/30">
      {/* ── Mobile Drawer — rendered at root, covers EVERYTHING including header ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[200] flex sm:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Full-screen backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div className="relative z-10 flex h-full w-[280px] flex-col bg-white shadow-2xl dark:bg-neutral-900">
            {/* Drawer header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-100 px-5 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
                  <Bird className="h-5 w-5" />
                </div>
                <span className="font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  Parrit
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
              <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Navigation
              </p>
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                        : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Sign out footer */}
            <div className="shrink-0 border-t border-neutral-100 p-4 dark:border-neutral-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition-all hover:bg-red-100 active:scale-95 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                title="Sign Out Mobile"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 shrink-0 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex h-16 w-full max-w-[2200px] items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="flex items-center gap-3 sm:gap-8">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="sm:hidden flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors dark:text-neutral-300 dark:hover:bg-neutral-800"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
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

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                      isActive
                        ? 'bg-neutral-100 text-brand-600 dark:bg-neutral-800 dark:text-brand-400'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            {/* Desktop sign out only — mobile sign out is in the drawer */}
            <button
              onClick={() => signOut()}
              className="hidden sm:flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-neutral-700 active:scale-95 dark:bg-brand-500 dark:hover:bg-brand-600"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
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

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto max-w-[2200px] px-4 sm:px-6 lg:px-10 xl:px-12 py-6 md:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-neutral-200 bg-white/50 py-6 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="mx-auto flex flex-col md:flex-row w-full max-w-[2200px] items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-12 gap-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-start">
            <Link
              to="/about"
              className="text-xs font-medium text-neutral-500 hover:text-brand-600 transition-colors"
            >
              About
            </Link>
            <Link
              to="/guide"
              className="text-xs font-medium text-neutral-500 hover:text-brand-600 transition-colors"
            >
              Guide
            </Link>
            <a
              href="https://github.com/mketiku/parrit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-neutral-500 hover:text-brand-600 transition-colors"
            >
              GitHub
            </a>
            <Link
              to="/privacy"
              className="text-xs font-medium text-neutral-500 hover:text-brand-600 transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-xs font-medium text-neutral-500 hover:text-brand-600 transition-colors"
            >
              Terms
            </Link>
            <a
              href="/about#contact"
              className="text-xs font-medium text-neutral-500 hover:text-brand-600 transition-colors"
            >
              Contact
            </a>
            <button
              onClick={() => setFeedbackOpen(true)}
              className="text-xs font-medium text-neutral-600 hover:text-brand-600 transition-colors dark:text-neutral-400 dark:hover:text-brand-400"
            >
              Feedback
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              v{__APP_VERSION__}
            </span>
            <p className="text-xs text-neutral-400 dark:text-neutral-600">
              &copy; {new Date().getFullYear()} Michael Ketiku
            </p>
          </div>
        </div>
      </footer>
      <Toaster />
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
}
