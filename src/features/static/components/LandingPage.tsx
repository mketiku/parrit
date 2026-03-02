import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bird,
  Zap,
  Users,
  History,
  ShieldCheck,
  ArrowRight,
  LayoutDashboard,
  Wifi,
  MousePointerClick,
} from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Dynamic Boards',
    description:
      'Create, rename, and delete pairing boards on the fly. Boards auto-save every change — no manual syncing required.',
  },
  {
    icon: MousePointerClick,
    title: 'Drag & Drop',
    description:
      'Move people between boards with a natural drag-and-drop experience. Multi-select and bulk-move entire groups in one gesture.',
  },
  {
    icon: Wifi,
    title: 'Real-time Sync',
    description:
      'Every move updates instantly across all open tabs and teammates in the same workspace. No refreshing, ever.',
  },
  {
    icon: History,
    title: 'Pairing History',
    description:
      "Save your daily configurations and review past sessions. See who paired when and track your team's rotation over time.",
  },
  {
    icon: ShieldCheck,
    title: 'Privacy First',
    description:
      'No personal emails required. Workspaces use an anonymous ID strategy — your team data stays entirely in your control.',
  },
  {
    icon: Users,
    title: 'Team Management',
    description:
      'Add team members with auto-generated colour avatars. Mark boards as "Out of Office" exempt to keep rotations clean.',
  },
];

export function LandingPage() {
  return (
    <div className="flex flex-col">
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
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 mb-8">
            <Zap className="h-3.5 w-3.5" />
            The modern replacement for parrit.io
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.08]">
            Pairing, finally{' '}
            <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
              done right.
            </span>
          </h1>

          <p className="mt-6 mx-auto max-w-2xl text-lg sm:text-xl text-neutral-500 dark:text-neutral-400">
            Parrit is a fast, beautiful pairing board for engineering teams.
            Drag people onto boards, sync live with teammates, and track your
            rotation over time — all without a single email address required.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-600 hover:shadow-brand-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              Create a Workspace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-8 py-4 text-base font-semibold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Learn more
            </Link>
          </div>

          <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-600">
            Free forever. No credit card. No emails.
          </p>
        </div>

        {/* App Preview mockup */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-12">
          <div className="relative rounded-3xl border border-neutral-200/80 bg-white/80 p-1 shadow-2xl shadow-neutral-900/10 backdrop-blur-sm dark:border-neutral-800/80 dark:bg-neutral-900/80 overflow-hidden">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400/80" />
              <div className="h-3 w-3 rounded-full bg-amber-400/80" />
              <div className="h-3 w-3 rounded-full bg-green-400/80" />
              <div className="ml-4 flex-1 rounded-md bg-neutral-100 dark:bg-neutral-800 px-3 py-1 text-xs text-neutral-400 dark:text-neutral-500">
                parrit.app/workspace
              </div>
            </div>
            {/* Fake pairing workspace UI */}
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                  Pairing Boards
                </p>
                <div className="h-7 w-28 rounded-xl bg-brand-500/90 shadow-sm" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  'Blue Macaw 🦜',
                  'Toco Toucan 🍌',
                  'Sulphur Cockatoo 🕊️',
                  'Canada Goose 🇨🇦',
                  'Roseate Spoonbill 🦩',
                  'Out of Office 🛫',
                ].map((name, i) => {
                  const people = [
                    ['Blu', 'Jewel'],
                    ['Roberto', 'Eduardo', 'Mimi'],
                    ['Rafael', 'Eva'],
                    ['Nico', 'Pedro'],
                    ['Alice', 'Chloe'],
                    ['Nigel'], // OOO
                  ][i];

                  return (
                    <div
                      key={i}
                      className={`rounded-2xl border p-4 ${
                        i === 5
                          ? 'border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50'
                          : 'border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                      }`}
                    >
                      <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-3">
                        {name}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {people.map((p, j) => (
                          <div
                            key={j}
                            className="h-9 w-9 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shadow-inner"
                            style={{
                              backgroundColor: [
                                '#6366f1',
                                '#8b5cf6',
                                '#ec4899',
                                '#f59e0b',
                                '#10b981',
                                '#3b82f6',
                              ][(i * 3 + j) % 6],
                            }}
                          >
                            {p.substring(0, 2).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Everything your team needs
          </h2>
          <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
            Built from the ground up for modern engineering teams.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-brand-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-500/30"
            >
              <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 transition-colors group-hover:bg-brand-100 dark:group-hover:bg-brand-500/20">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-bold text-neutral-900 dark:text-neutral-100">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-brand-500 p-10 text-center shadow-2xl shadow-brand-500/30">
          {/* Decorative blobs */}
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent-500/30 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <Bird className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to pair up?
            </h2>
            <p className="mt-3 text-brand-100 max-w-md mx-auto">
              Set up your workspace in under a minute. Free, forever.
            </p>
            <Link
              to="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-brand-600 shadow-lg transition-all hover:bg-brand-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              Create a Free Workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
