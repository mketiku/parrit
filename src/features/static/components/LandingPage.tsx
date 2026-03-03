import React from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import {
  Bird,
  Zap,
  ArrowRight,
  LayoutDashboard,
  Wifi,
  MousePointerClick,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { useAuthStore } from '../../auth/store/useAuthStore';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Dynamic Boards',
    description:
      'Create and rename pairing boards on the fly. Auto-saves every change instantly.',
  },
  {
    icon: MousePointerClick,
    title: 'Drag & Drop',
    description:
      'Move people between boards with a natural, lag-free experience. Bulk-move groups with ease.',
  },
  {
    icon: Wifi,
    title: 'Real-time Sync',
    description:
      'Updates instantly across all teammates in the workspace. No manual refreshing required.',
  },
  {
    icon: Share2,
    title: 'Public View Links',
    description:
      'Share a read-only live dashboard of current pairings with stakeholders or TV displays.',
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function LandingPage() {
  const { user, workspaceName } = useAuthStore();

  return (
    <div className="flex flex-col selection:bg-brand-100 selection:text-brand-900">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        {/* Background gradient blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-brand-500/10 blur-[100px]" />
          <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-accent-500/10 blur-[80px]" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-20 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {user ? (
              <div className="mb-8 inline-flex items-center gap-3 rounded-2xl bg-brand-50/50 px-6 py-3 border border-brand-100 dark:bg-brand-500/5 dark:border-brand-500/10">
                <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-brand-500/20">
                  {workspaceName.substring(0, 1).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest">
                    Signed in as
                  </p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white capitalize leading-tight">
                    {workspaceName} Workspace
                  </p>
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 mb-8">
                <Zap className="h-3.5 w-3.5" />
                Professional-grade pairing for modern teams
              </div>
            )}

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.05]">
              Pairing,{' '}
              <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
                done right.
              </span>
            </h1>

            <p className="mt-6 mx-auto max-w-2xl text-lg sm:text-xl font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Parrit is a fast, beautiful pairing board for engineering teams.
              Sync live with teammates and track your rotation over time —
              without a single email required.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link
                  to="/app"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all dark:bg-brand-500 dark:hover:bg-brand-600"
                >
                  Enter Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <Link
                  to="/login?signup=true"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all dark:bg-brand-500 dark:hover:bg-brand-600"
                >
                  Create a Workspace
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-8 py-4 text-base font-bold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                How it works
              </Link>
            </div>

            {!user && (
              <p className="mt-6 text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400/60 dark:text-neutral-600">
                Free Forever • No Credit Card • Zero Friction
              </p>
            )}
          </motion.div>
        </div>

        {/* App Preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'circOut' }}
          className="mx-auto max-w-5xl px-4 sm:px-6 pb-12"
        >
          <div className="relative rounded-[2.5rem] border border-neutral-200 bg-white/50 p-2 shadow-2xl shadow-black/10 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/50 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 border-b border-neutral-200/50 dark:border-neutral-800/50 px-6 py-4">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400/50" />
                <div className="h-3 w-3 rounded-full bg-amber-400/50" />
                <div className="h-3 w-3 rounded-full bg-green-400/50" />
              </div>
              <div className="ml-4 flex-1 max-w-md rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 tracking-tight">
                parrit.org/workspace/macaw-elite
              </div>
            </div>
            {/* Fake pairing workspace UI */}
            <div className="p-4 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-100">
                  Pairing Boards
                </p>
                <div className="flex gap-2">
                  <div className="h-10 w-32 rounded-2xl bg-brand-500/10 border border-brand-500/20" />
                  <div className="h-10 w-32 rounded-2xl bg-brand-500 shadow-xl shadow-brand-500/20" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {['Toco Toucan 🦤', 'Canada Goose 🪿', 'Board #3 🦜'].map(
                  (name, i) => {
                    const people = [
                      ['Blu', 'Jewel'],
                      ['Roberto', 'Edo', 'Mimi'],
                      ['Nico', 'Pedro'],
                    ][i];

                    return (
                      <div
                        key={i}
                        className="rounded-3xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50 shadow-sm transition-transform hover:scale-[1.02]"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                            {name}
                          </p>
                          <RefreshCw className="h-3 w-3 text-brand-400 opacity-50" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {people.map((p, j) => (
                            <div
                              key={j}
                              className="h-10 px-3 rounded-2xl flex items-center gap-2 text-[11px] font-bold text-neutral-600 border border-neutral-100 bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300"
                            >
                              <div
                                className="h-6 w-6 rounded-lg flex items-center justify-center text-[9px] font-black text-white"
                                style={{
                                  backgroundColor: [
                                    '#6366f1',
                                    '#f59e0b',
                                    '#10b981',
                                  ][(i + j) % 3],
                                }}
                              >
                                {p.charAt(0)}
                              </div>
                              {p}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900 dark:text-white mb-6">
            Everything your team needs
          </h2>
          <p className="text-xl font-medium text-neutral-500 dark:text-neutral-400">
            A specialized toolset built for high-velocity rotation.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className="group rounded-[2rem] border border-neutral-200/60 bg-white p-8 shadow-sm transition-all hover:bg-neutral-50/50 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5 dark:border-neutral-800/60 dark:bg-neutral-900/40 dark:hover:bg-neutral-900"
            >
              <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 transition-all group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-lg font-black text-neutral-900 dark:text-neutral-100">
                {f.title}
              </h3>
              <p className="text-sm font-medium leading-[1.6] text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                {f.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[3rem] bg-neutral-900 p-12 sm:p-20 text-center shadow-2xl dark:bg-brand-500"
        >
          {/* Decorative blobs */}
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl pointer-events-none dark:bg-white/10" />

          <div className="relative z-10">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white/10 backdrop-blur-md">
              <Bird className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-6">
              Ready to pair up?
            </h2>
            <p className="mb-10 text-white/60 text-lg font-medium max-w-md mx-auto leading-relaxed">
              Set up your workspace in under a minute. Free forever. No
              friction.
            </p>
            {user ? (
              <Link
                to="/app"
                className="group inline-flex items-center gap-2 rounded-2xl bg-white px-10 py-5 text-lg font-black text-neutral-900 shadow-xl transition-all hover:bg-neutral-50 hover:scale-[1.02] active:scale-[0.98] dark:text-brand-600"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <Link
                to="/login?signup=true"
                className="group inline-flex items-center gap-2 rounded-2xl bg-white px-10 py-5 text-lg font-black text-neutral-900 shadow-xl transition-all hover:bg-neutral-50 hover:scale-[1.02] active:scale-[0.98] dark:text-brand-600"
              >
                Create a Workspace
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
