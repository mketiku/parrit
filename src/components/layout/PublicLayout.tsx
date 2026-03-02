import React, { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Bird, Moon, Sun } from 'lucide-react';
import { Toaster } from '../ui/Toaster';

export default function PublicLayout() {
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
    <div className="flex min-h-screen w-full flex-col font-sans selection:bg-indigo-500/30 bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 shrink-0 border-b border-neutral-200/60 bg-white/70 backdrop-blur-md dark:border-neutral-800/60 dark:bg-neutral-950/70">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-sm shadow-indigo-500/20">
              <Bird className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-neutral-900 dark:text-white">
              Parrit
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              to="/about"
              className="hidden sm:block text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
            >
              About
            </Link>
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <Link
              to="/login"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all hover:bg-indigo-600"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-neutral-200 bg-white/50 py-8 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/50">
        <div className="mx-auto flex flex-col md:flex-row w-full max-w-6xl items-center justify-between px-4 sm:px-6 gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500 text-white">
              <Bird className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Parrit
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/about"
              className="text-xs font-medium text-neutral-500 hover:text-indigo-500 transition-colors"
            >
              About
            </Link>
            <a
              href="/about#contact"
              className="text-xs font-medium text-neutral-500 hover:text-indigo-500 transition-colors"
            >
              Contact
            </a>
            <a
              href="https://github.com/mketiku/parrit/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-neutral-500 hover:text-indigo-500 transition-colors"
            >
              GitHub
            </a>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-600">
            &copy; {new Date().getFullYear()} Michael Ketiku.
          </p>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
