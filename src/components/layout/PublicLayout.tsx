import React, { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Bird, Moon, Sun, Menu, X } from 'lucide-react';
import { Toaster } from '../ui/Toaster';
import { useAuthStore } from '../../features/auth/store/useAuthStore';

export default function PublicLayout() {
  const { user, workspaceName } = useAuthStore();
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

  return (
    <div className="flex min-h-screen w-full flex-col font-sans selection:bg-brand-500/30 bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 shrink-0 border-b border-neutral-200/60 bg-white/70 backdrop-blur-md dark:border-neutral-800/60 dark:bg-neutral-950/70">
        <div className="mx-auto flex h-16 w-full max-w-[2200px] items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-12">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm shadow-brand-500/20">
              <Bird className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-neutral-900 dark:text-white">
              Parrit
            </span>
          </Link>

          {/* Right side Desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/about"
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              to="/guide"
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
            >
              Guide
            </Link>
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            {user ? (
              <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
                <div className="h-6 w-6 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-[10px]">
                  {workspaceName.substring(0, 1).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 capitalize mr-2">
                  {workspaceName}
                </span>
                <Link
                  to="/app"
                  className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-600"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/login?signup=true"
                  className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 transition-all hover:bg-brand-600"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-4 shadow-lg flex flex-col gap-4">
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-neutral-600 hover:text-brand-600 dark:text-neutral-300 transition-colors"
            >
              About Parrit
            </Link>
            <Link
              to="/guide"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-neutral-600 hover:text-brand-600 dark:text-neutral-300 transition-colors"
            >
              Pairing Guide
            </Link>
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              {user ? (
                <Link
                  to="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl bg-brand-500 px-4 py-3 text-base font-semibold text-white shadow-sm shadow-brand-500/20 transition-all"
                >
                  Enter {workspaceName} Workspace
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base font-semibold text-neutral-700 shadow-sm transition-all dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login?signup=true"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-xl bg-brand-500 px-4 py-3 text-base font-semibold text-white shadow-sm shadow-brand-500/20 transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-neutral-200 bg-white/50 py-6 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/50">
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
    </div>
  );
}
