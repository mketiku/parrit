import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Bird, Loader2 } from 'lucide-react';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMSG(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // Sometimes signUp requires email confirmation depending on Supabase settings
        alert(
          'Success! Check your email to confirm your account (if enabled), or just sign in now.'
        );
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
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
    <div className="flex min-h-screen w-full items-center justify-center bg-neutral-50 p-4 font-sans text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200 bg-white/50 p-8 shadow-2xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm shadow-indigo-500/20">
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
              Work Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white/80 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-700 dark:bg-neutral-900/80 dark:placeholder:text-neutral-600 dark:focus:border-indigo-400"
              placeholder="you@company.com"
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
              className="w-full rounded-xl border border-neutral-300 bg-white/80 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-700 dark:bg-neutral-900/80 dark:placeholder:text-neutral-600 dark:focus:border-indigo-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 dark:bg-indigo-500 dark:hover:bg-indigo-400"
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
            className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {isSignUp ? 'Sign in' : 'Create one'}
          </button>
        </div>
      </div>
    </div>
  );
}
