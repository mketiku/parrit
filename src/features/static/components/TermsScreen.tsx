import React from 'react';
import { motion } from 'framer-motion';
import { Scale, ShieldCheck, Mail, Info } from 'lucide-react';

export function TermsScreen() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <header className="text-center space-y-4">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-xl dark:bg-brand-500">
            <Scale className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mx-auto max-w-xl text-lg font-medium text-neutral-500 dark:text-neutral-300">
            Simple rules for a better pairing experience.
          </p>
        </header>

        <section className="space-y-8 rounded-[2.5rem] border border-neutral-200 bg-white p-8 sm:p-12 dark:border-neutral-800 dark:bg-neutral-900/50 shadow-sm">
          <div className="flex gap-4 items-start">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black text-xs">
              1
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                Acceptance of Terms
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                By creating a Parrit workspace, you agree to these terms. Parrit
                is provided "as is" without any warranties of any kind. We aim
                for 100% uptime, but we are a spiritual successor to an
                open-source project, not a massive corporation.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black text-xs">
              2
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                Workspace Ownership
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                You own your data. We own the Parrit brand and code. You are
                responsible for maintaining the security of your workspace name
                and password. Since we don't collect emails, if you lose your
                password, we might not be able to recover your account unless
                you've set up a recovery method.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black text-xs">
              3
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                Prohibited Use
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                Don't use Parrit for anything illegal, harmful, or spammy. We
                reserve the right to terminate workspaces that violate these
                common-sense rules.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black text-xs">
              4
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                Service Availability
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                We may modify or discontinue the service at any time. If we ever
                decide to shut down the hosted version, we will provide a 30-day
                notice and a simple way to export all your workspace data.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-neutral-100 bg-neutral-50 px-6 py-8 text-center dark:border-neutral-800 dark:bg-neutral-900/20">
            <ShieldCheck className="mx-auto mb-4 h-6 w-6 text-brand-500" />
            <h4 className="font-bold text-neutral-900 dark:text-white mb-2">
              Privacy First
            </h4>
            <p className="text-xs text-neutral-500">
              Read our dedicated Privacy Policy for data details.
            </p>
          </div>
          <div className="rounded-3xl border border-neutral-100 bg-neutral-50 px-6 py-8 text-center dark:border-neutral-800 dark:bg-neutral-900/20">
            <Info className="mx-auto mb-4 h-6 w-6 text-brand-500" />
            <h4 className="font-bold text-neutral-900 dark:text-white mb-2">
              Open Source
            </h4>
            <p className="text-xs text-neutral-500">
              Parrit is MIT Licensed. Fork it, host it, improve it.
            </p>
          </div>
          <div className="rounded-3xl border border-neutral-100 bg-neutral-50 px-6 py-8 text-center dark:border-neutral-800 dark:bg-neutral-900/20">
            <Mail className="mx-auto mb-4 h-6 w-6 text-brand-500" />
            <h4 className="font-bold text-neutral-900 dark:text-white mb-2">
              Support
            </h4>
            <p className="text-xs text-neutral-500">
              Reach out via GitHub or LinkedIn for help.
            </p>
          </div>
        </div>

        <footer className="pt-12 border-t border-neutral-200 dark:border-neutral-800 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">
          Last Updated: March 21, 2026
        </footer>
      </motion.div>
    </div>
  );
}
