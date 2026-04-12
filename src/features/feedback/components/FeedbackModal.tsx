import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Bug, Lightbulb, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useToastStore } from '../../../store/useToastStore';
import { BuyMeACoffeeButton } from '../../../components/ui/BuyMeACoffeeButton';

type FeedbackType = 'bug' | 'idea' | 'general';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_OPTIONS: {
  value: FeedbackType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'general',
    label: 'General',
    icon: <MessageSquare className="h-4 w-4" />,
  },
  { value: 'bug', label: 'Bug', icon: <Bug className="h-4 w-4" /> },
  {
    value: 'idea',
    label: 'Idea',
    icon: <Lightbulb className="h-4 w-4" />,
  },
];

export function FeedbackModal({ isOpen, onClose }: Props) {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const location = useLocation();

  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const { error } = await supabase.from('feedback').insert({
      user_id: user?.id ?? null,
      type,
      message: message.trim(),
      page: location.pathname,
    });
    setIsSubmitting(false);

    if (error) {
      addToast('Failed to submit feedback. Please try again.', 'error');
      return;
    }

    addToast('Thanks for your feedback!', 'success');
    setMessage('');
    setType('general');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
      data-testid="feedback-backdrop"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Share Feedback
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="Close feedback"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            {TYPE_OPTIONS.map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                aria-pressed={type === value}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold border transition-all ${
                  type === value
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-brand-300 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Message */}
          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              placeholder="What's on your mind?"
              rows={4}
              aria-label="Feedback message"
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none resize-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500"
              required
            />
            <p className="mt-1 text-right text-xs text-neutral-400">
              {message.length}/1000
            </p>
          </div>

          <div className="pt-2">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-100 dark:border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="bg-white px-3 text-neutral-400 dark:bg-neutral-900">
                  Support the project
                </span>
              </div>
            </div>
            <BuyMeACoffeeButton className="w-full justify-center" />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-all disabled:opacity-50 active:scale-95"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Send Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
