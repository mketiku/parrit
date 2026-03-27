import React from 'react';
import { ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react';

interface ForcedUpdateOverlayProps {
  onUpdate: () => void;
}

export function ForcedUpdateOverlay({ onUpdate }: ForcedUpdateOverlayProps) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-white/60 backdrop-blur-2xl dark:bg-neutral-950/60 transition-all animate-in fade-in duration-500">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-neutral-200 bg-white p-8 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 ring-1 ring-black/5">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
            <ShieldAlert className="h-8 w-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white leading-tight">
            Security & Performance <br /> Update Required
          </h1>
          <p className="mt-4 text-sm font-medium leading-relaxed text-neutral-500 dark:text-neutral-400 px-2">
            You're running an older version of Parrit. To ensure your data
            remains secure and synchronized, you must update to the latest
            version immediately.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onUpdate}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-brand-500/20 transition-all hover:bg-brand-500 active:scale-[0.98] dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
            Clear Cache & Update Now
          </button>

          <div className="flex items-start gap-3 rounded-2xl bg-amber-50/50 p-4 dark:bg-amber-500/5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs font-semibold leading-normal text-amber-700 dark:text-amber-300">
              Wait! This will perform a hard refresh and unregister all
              background workers, ensuring you have the freshest code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
