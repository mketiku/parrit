import React, { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore, type Toast } from '../../store/useToastStore';

const icons = {
  success: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />,
  error: <XCircle className="h-4 w-4 shrink-0 text-red-500" />,
  info: <Info className="h-4 w-4 shrink-0 text-indigo-500" />,
};

const barColors = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-indigo-500',
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore();
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    // Kick off the CSS animation
    requestAnimationFrame(() => {
      el.style.width = '0%';
    });
  }, []);

  return (
    <div className="relative overflow-hidden flex items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 w-80 animate-in slide-in-from-right-4 fade-in duration-200">
      {icons[toast.variant]}
      <p className="flex-1 text-sm font-medium text-neutral-800 dark:text-neutral-100 leading-snug">
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {/* Progress bar */}
      <div
        ref={progressRef}
        style={{ width: '100%', transition: 'width 4s linear' }}
        className={`absolute bottom-0 left-0 h-0.5 ${barColors[toast.variant]}`}
      />
    </div>
  );
}

export function Toaster() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
