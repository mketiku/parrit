import React from 'react';
import { motion } from 'framer-motion';
import { Bird, Home, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-brand-500 text-white shadow-2xl shadow-brand-500/20">
          <Bird className="h-12 w-12 -rotate-12 transition-transform hover:rotate-0" />
          <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 font-black text-[10px] text-white ring-4 ring-white dark:ring-neutral-950">
            404
          </span>
        </div>

        <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
          That parrit has flown away.
        </h1>
        <p className="mt-4 text-lg font-medium text-neutral-500 dark:text-neutral-400">
          The page you're looking for doesn't exist or has been relocated.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-sm font-bold text-neutral-700 transition-all hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-2xl bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-600"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// Global Error Boundary Component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Parrit Crash Log:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 text-center dark:bg-neutral-950">
          <div className="max-w-md">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-red-500 text-white shadow-xl shadow-red-500/20">
              <Bird className="h-10 w-10 rotate-180" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
              Something went wrong.
            </h1>
            <p className="mt-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              A JavaScript error occurred. This might be due to a live update or
              a temporary sync issue. Don't worry, your data is safe in the
              cloud.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-4 text-sm font-bold text-white dark:bg-brand-500"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
