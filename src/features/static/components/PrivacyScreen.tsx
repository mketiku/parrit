import React from 'react';
import { motion } from 'framer-motion';
import { Shield, EyeOff, Trash2, Download, Lock } from 'lucide-react';

export function PrivacyScreen() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <header className="text-center space-y-4">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-xl shadow-brand-500/20">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mx-auto max-w-xl text-lg font-medium text-neutral-500 dark:text-neutral-300">
            At Parrit, privacy is not a checkbox — it's our core architecture.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900/50 shadow-sm">
            <EyeOff className="mb-4 h-6 w-6 text-brand-500" />
            <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-white">
              Admin Zero-Access
            </h3>
            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Our system is built to prevent peeking. Administrators can see
              high-level stats (like dashboard counts) but can{' '}
              <strong>never</strong> view your team members, pairing goals, or
              private boards.
            </p>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900/50 shadow-sm">
            <Lock className="mb-4 h-6 w-6 text-brand-500" />
            <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-white">
              No Third-Party Trackers
            </h3>
            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              We use no Google Analytics, PostHog, or tracking pixels. We
              believe in providing a great experience without monitoring your
              every move.
            </p>
          </div>
        </section>

        <div className="space-y-12 rounded-[2.5rem] border border-neutral-200 bg-neutral-50 p-8 sm:p-12 dark:border-neutral-800 dark:bg-neutral-900/10 shadow-inner">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">
              Your Rights (GDPR & Beyond)
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
              We fully support your right to control your data. These features
              are accessible directly from your workspace settings without
              needing to contact support.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-neutral-400" />
                <h4 className="font-bold text-neutral-900 dark:text-white">
                  Right to Access (Portability)
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Export your entire workspace — including pairing history and
                team setup — as a structured JSON file at any time. Take your
                data with you whenever you need.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-red-500" />
                <h4 className="font-bold text-neutral-900 dark:text-white">
                  Right to Erasure (Forget Me)
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Use the "Wipe Everything" feature to instantly and permanently
                delete all data associated with your workspace from our
                databases, including audit logs.
              </p>
            </div>
          </div>
        </div>

        <article className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400">
              Data Collection
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              We only store information essential to providing the pairing
              service: your dashboard name, team member names (if provided), and
              board configurations. This data is stored securely in our
              encrypted database.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400">
              Data Sharing
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              We never sell your data. We only share data with service providers
              (like Supabase for database hosting) necessary to keep the app
              running.
            </p>
          </div>

          <footer className="pt-12 border-t border-neutral-200 dark:border-neutral-800 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            Last Updated: March 21, 2026
          </footer>
        </article>
      </motion.div>
    </div>
  );
}
