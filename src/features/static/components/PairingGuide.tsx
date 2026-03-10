import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bird,
  RotateCw,
  ZapOff,
  Target,
  ArrowRight,
  MessageCircleQuestion,
  Plus,
  ShieldCheck,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';

export function PairingGuide() {
  const principles = [
    {
      title: 'Pair per Story',
      desc: 'Pairs are assigned to a specific story, not for a fixed duration of the day.',
    },
    {
      title: 'Max 2 Days per Pair',
      desc: 'To prevent silos, the same pair works together on a story for a maximum of two days.',
    },
    {
      title: 'Rotate One Person',
      desc: 'After two days, one person stays to preserve context, while the other rotates to spread knowledge.',
    },
  ];

  const rotationGuidelines = {
    acceptable: [
      'Deep debugging is currently in progress.',
      'An active, complex refactor is "mid-flight."',
      'An external dependency unblock is expected within the same day.',
      'High risk of losing fragile context if a handoff occurs now.',
    ],
    unacceptable: [
      'Personal comfort or habit.',
      '"We like working together."',
      'Avoiding the effort of onboarding a new person.',
    ],
  };

  const soloTasks = [
    {
      title: 'Small, well-scoped tasks',
      desc: 'Minor config changes, simple refactors, or copy updates.',
    },
    {
      title: 'Mechanical work',
      desc: 'Renaming fields, formatting, or repetitive boilerplate.',
    },
    {
      title: 'Clear ownership',
      desc: 'Short-lived changes in a well-understood area.',
    },
    {
      title: 'Waiting/Unblock tasks',
      desc: 'Prep work while waiting on an external dependency.',
    },
    {
      title: 'Time-sensitive fixes',
      desc: 'Quick hotfixes where speed is more critical than collaboration.',
    },
  ];

  const bestPractices = [
    {
      title: 'Driver / Navigator Roles',
      desc: 'The Driver focuses on the immediate task (typing), while the Navigator focuses on the "big picture" (edge cases). Swap roles frequently.',
    },
    {
      title: 'Ping-Pong Pairing',
      desc: 'One person writes a failing test; the other writes the code to make it pass and then writes the next failing test.',
    },
    {
      title: 'Strong Style Pairing',
      desc: 'For onboarding, the experienced person navigates while the learner drives.',
    },
    {
      title: 'Regular Breaks',
      desc: 'Use Pomodoro (25 mins work / 5 mins break) to maintain focus and energy.',
    },
  ];

  const faqs = [
    {
      q: 'Is pairing mandatory?',
      a: 'It is the default for stories benefiting from discussion or knowledge sharing. If a story is faster solo, call it out and proceed.',
    },
    {
      q: "What if the story isn't finished after 2 days?",
      a: 'Rotate one person to bring fresh eyes while the remaining person provides continuity.',
    },
    {
      q: 'Do we rotate both people?',
      a: 'No. Rotating both leads to full context loss and stalls momentum.',
    },
    {
      q: "What if a pairing isn't working?",
      a: 'Raise it early and privately. We adjust pairings rather than force unproductive work.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-24 pb-24 selection:bg-brand-100 selection:text-brand-900">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 pt-12"
      >
        <div className="flex justify-center">
          <div className="rounded-[2.5rem] bg-brand-500/10 p-5 ring-1 ring-brand-500/20 shadow-2xl shadow-brand-500/10">
            <Target className="h-10 w-10 text-brand-600 dark:text-brand-400" />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 uppercase">
            Our <span className="text-brand-500">Playbook</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed italic">
            "This isn't a rulebook—it's just what works for us."
          </p>
          <p className="mx-auto max-w-2xl text-sm font-medium text-neutral-400 dark:text-neutral-500 leading-relaxed">
            We use this framework to balance momentum and knowledge sharing.
            Treat these as flexible recommendations to help your team find its
            own rhythm.
          </p>
        </div>
      </motion.div>

      {/* Principles Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {principles.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm transition-all hover:border-brand-500 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900/50"
          >
            <div className="mb-6 h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 group-hover:bg-brand-500 group-hover:text-white transition-colors">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-50 mb-2 uppercase tracking-tight">
              {item.title}
            </h3>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {item.desc}
            </p>
          </motion.div>
        ))}
      </section>

      {/* Rotation Guidelines */}
      <section className="rounded-[3rem] border border-neutral-200 bg-neutral-50/50 p-8 sm:p-12 dark:border-neutral-800 dark:bg-neutral-900/30">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <RotateCw className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 uppercase">
                When to Extend
              </h2>
            </div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              This is a suggestion, not a rigid rule. We find that rotating
              after 2 days keeps the vibes fresh, but use your professional
              judgment.
            </p>
            <ul className="space-y-4">
              {rotationGuidelines.acceptable.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <Plus className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600">
                <ZapOff className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 uppercase">
                Avoid Extending
              </h2>
            </div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Personal comfort is not a reason to silo knowledge.
            </p>
            <ul className="space-y-4">
              {rotationGuidelines.unacceptable.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <ZapOff className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Solo Work Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600">
            <User className="h-3 w-3" />
            Independent Flight
          </div>
          <h2 className="text-3xl font-black text-neutral-900 dark:text-neutral-50 uppercase">
            When Not to Pair
          </h2>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Solo work is encouraged for mechanical or well-scoped tasks where
            the cost of collaboration exceeds the benefit of knowledge sharing.
          </p>
          <div className="space-y-4">
            {soloTasks.map((task, i) => (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-2xl bg-white border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800 transition-transform hover:translate-x-2"
              >
                <div className="h-8 w-8 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                    {task.title}
                  </p>
                  <p className="text-xs font-medium text-neutral-500">
                    {task.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative group">
          <div className="absolute inset-0 bg-brand-500/20 blur-[100px] rounded-full group-hover:bg-brand-500/30 transition-colors" />
          <div className="relative rounded-[3rem] border border-neutral-200 bg-white p-8 sm:p-12 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xl">
            <Bird className="h-16 w-16 text-brand-500 mb-8 animate-bounce-slow" />
            <h3 className="text-2xl font-black mb-6 text-neutral-900 dark:text-neutral-50 uppercase">
              Industry Best Practices
            </h3>
            <div className="space-y-8">
              {bestPractices.map((bp, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    <p className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                      {bp.title}
                    </p>
                  </div>
                  <p className="pl-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {bp.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-bold text-neutral-500 dark:bg-neutral-800">
            <MessageCircleQuestion className="h-4 w-4" />
            Frequently Asked
          </div>
          <h2 className="text-4xl font-black text-neutral-900 dark:text-neutral-50 uppercase tracking-tight">
            Quick Reference
          </h2>
        </div>
        <div className="mx-auto max-w-3xl grid gap-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="group rounded-3xl border border-neutral-100 bg-white p-6 transition-all hover:border-brand-500/30 dark:border-neutral-800 dark:bg-neutral-900/50"
            >
              <h4 className="text-sm font-black text-neutral-900 dark:text-neutral-100 mb-2 uppercase tracking-tight">
                {faq.q}
              </h4>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section>
        <div className="rounded-[4rem] bg-neutral-900 dark:bg-brand-600 p-12 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase tracking-tight italic">
                Outcome Focused
              </h2>
              <p className="mx-auto max-w-xl text-neutral-400 dark:text-brand-100 font-medium">
                The ultimate goal is progress and learning, not strict adherence
                to a schedule. If a handoff is clean or a story naturally
                splits, rotate early!
              </p>
            </div>
            <Link to="/app">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center gap-3 rounded-2xl bg-white px-10 py-4 text-sm font-black uppercase text-neutral-900 tracking-widest shadow-xl transition-all hover:bg-neutral-100 active:scale-95"
              >
                <Bird className="h-5 w-5 text-brand-500 transition-transform group-hover:-translate-y-1" />
                Take flight! RAAA!
              </motion.button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
