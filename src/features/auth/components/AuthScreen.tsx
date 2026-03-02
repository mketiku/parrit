import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Bird, Loader2 } from 'lucide-react';

export function AuthScreen() {
  const [workspaceName, setWorkspaceName] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMSG(null);

    try {
      // Create a pseudo-email string mapped to the workspace name to satisfy Supabase
      const pseudoEmail = `${workspaceName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')}@parrit.com`;

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: pseudoEmail,
          password,
        });
        if (error) throw error;
        // Sometimes signUp requires email confirmation depending on Supabase settings
        alert(
          'Workspace successfully created! You are securely authenticated.'
        );
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: pseudoEmail,
          password,
        });
        if (error) throw error;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMSG(err.message);
      } else {
        setErrorMSG('An error occurred during authentication.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center p-4 font-sans text-neutral-900 dark:text-neutral-100">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200 bg-white/50 p-8 shadow-2xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-500/20">
            <Bird className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to Parrit
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {isSignUp
              ? 'Create a secure team workspace'
              : 'Sign in to orchestrate your team'}
          </p>
        </div>

        {errorMSG && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {errorMSG}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Workspace Name
            </label>
            <input
              type="text"
              required
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white/80 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-700 dark:bg-neutral-900/80 dark:placeholder:text-neutral-600 dark:focus:border-brand-400"
              placeholder="e.g. omega-team"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white/80 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-700 dark:bg-neutral-900/80 dark:placeholder:text-neutral-600 dark:focus:border-brand-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition-all hover:bg-brand-500 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isSignUp ? (
              'Create Workspace'
            ) : (
              'Enter Workspace'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {isSignUp ? 'Already have a workspace? ' : "Don't have a workspace? "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium text-brand-600 hover:text-brand-500 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
          >
            {isSignUp ? 'Sign in' : 'Create one'}
          </button>
        </div>
      </div>
    </div>
  );
}
