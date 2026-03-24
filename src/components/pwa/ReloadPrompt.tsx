import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCcw, X, Info } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      if (r) {
        // Check for updates every hour (3600000ms)
        setInterval(() => {
          r.update();
        }, 3600000);
      }
    },
    onRegisterError(error: unknown) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const { addToast } = useToastStore();

  useEffect(() => {
    if (offlineReady) {
      addToast('App ready to work offline! ⚡️', 'success');
      setOfflineReady(false);
    }
  }, [offlineReady, addToast, setOfflineReady]);

  // If there's a need refresh, we'll show a persistent prompt
  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-brand-200 bg-white shadow-2xl shadow-brand-500/10 dark:border-neutral-800 dark:bg-neutral-900 ring-1 ring-black/5">
        <div className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
            <RefreshCcw className="h-6 w-6 animate-spin-slow" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
              New version available!
            </h3>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Refresh now to see the latest features and fixes.
            </p>
          </div>
          <button
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 bg-neutral-50/50 p-4 pt-0 dark:bg-neutral-800/30">
          <button
            onClick={() => updateServiceWorker(true)}
            className="flex-1 rounded-2xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 active:scale-95 transition-all"
          >
            Update & Refresh
          </button>
          <button
            onClick={close}
            className="rounded-2xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 transition-all"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
