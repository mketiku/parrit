import React from 'react';
import {
  Bird,
  Heart,
  Linkedin,
  MessageCircleQuestion,
  Rocket,
  ArrowRight,
  Code2,
} from 'lucide-react';

export function AboutScreen() {
  const faqs = [
    {
      question: 'Why was this project built?',
      answer:
        "When the original parrit.io was taken down in 2025, it left a void for my team. I wanted to build a modern successor that felt 'alive'—using real-time sync, a good looking interface, and a modern architecture. It was built to ensure that simple rotation logic remains accessible to the community.",
    },
    {
      question: 'Do you know the old Parrit maintainer?',
      answer:
        "No, the original project was open-source but the hosted version (parrit.io) disappeared. This is a ground-up rebuild designed to honor the original workflow while adding modern features like mobile support and audit trails. Having paired for about 2 years now, I've seen the professional benefits firsthand and believe other teams would too.",
    },
    {
      question: 'Why does Pair Programming still matter?',
      answer:
        "Pairing isn't just about 'two people on one keyboard.' It is a human compiler for code quality. It facilitates instant knowledge transfer, ensures you don't spend four hours debugging a typo, and guarantees that knowledge isn't siloed in a single developer's head—helping your team stay resilient and fast.",
    },
    {
      question: 'How do I implement this in a new team?',
      answer:
        "Don't force it 100% of the time. Start with 'Pairing Thursdays' or use it for complex, high-risk tickets. Once the team feels the benefit of not 'winging it' alone, the culture usually shifts organically. Use the Parrit board during Standups to visualize the day's pecking order.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-20 pb-24">
      {/* Header Section */}
      <div className="text-center space-y-6 pt-8">
        <div className="flex justify-center">
          <div className="rounded-[2rem] bg-brand-500/10 p-4 ring-1 ring-brand-500/20 shadow-xl shadow-brand-500/5">
            <Bird className="h-12 w-12 text-brand-600 dark:text-brand-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 uppercase">
            The Story of <span className="text-brand-500">Parrit</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed">
            A dedicated space for engineering teams to manage their daily
            pairing rotations. Early birds and night owls welcome.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <a
            href="https://www.linkedin.com/in/mketiku"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-neutral-600 shadow-sm border border-neutral-200 hover:border-brand-500 hover:text-brand-600 transition-all dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400"
          >
            <Linkedin className="h-4 w-4" />
            Connect with me
          </a>
        </div>
      </div>

      {/* Philosophy Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-3">
            <Heart className="h-7 w-7 text-red-500" />
            The Fellowship
          </h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4">
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              We believe engineering is a team sport. Parrit was born from the
              realization that when we pair, we don't just write better code—we
              build better relationships.
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              By removing the friction of "who is with whom," we allow teams to
              focus on what actually matters: solving hard problems together.
            </p>
          </div>

          <div className="pt-4 flex gap-8">
            <div className="space-y-1">
              <p className="text-2xl font-black text-brand-500">Live</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Real-time Sync
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-brand-500">Tactile</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Drag & Drop
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-brand-500/20 blur-3xl -z-10 rounded-full" />
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-brand-500" />
              Spread the Gospel
            </h3>
            <ul className="space-y-4">
              {[
                {
                  title: 'Public URLs',
                  desc: 'Show pairings on office TVs. No more squawking for updates.',
                },
                {
                  title: 'Save History',
                  desc: 'Export logs for team retrospectives and rotation tracking.',
                },
                {
                  title: 'Try TDD Next',
                  desc: 'Pairing + TDD is the gold standard for software quality.',
                },
                {
                  title: 'Mob Programming',
                  desc: 'Try 3+ people on a high-stakes fire. Strength in numbers.',
                },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="h-6 w-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 dark:bg-brand-500/10 dark:text-brand-400">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Acknowledgements Section */}
      <section className="rounded-3xl border border-neutral-200 bg-neutral-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
        <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-3 mb-4">
          <Code2 className="h-6 w-6 text-brand-500" />
          Acknowledgements
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-6">
          This project is a spiritual successor to the original Parrit, which
          served the community faithfully for years. We are grateful for the
          inspiration provided by the original creators and the patterns they
          established.
        </p>
        <a
          href="https://github.com/Parrit/Parrit"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
        >
          View the original repository <ArrowRight className="h-4 w-4" />
        </a>
      </section>

      {/* FAQ Section */}
      <section className="space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            <MessageCircleQuestion className="h-3.5 w-3.5" />
            Common Questions
          </div>
          <h2 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Frequently Asked
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm transition-all hover:border-brand-500/50 dark:border-neutral-800 dark:bg-neutral-900/50"
            >
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mb-3">
                {faq.question}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="pt-12">
        <div className="relative overflow-hidden rounded-[3rem] bg-neutral-900 dark:bg-brand-600 px-8 py-16 text-center text-white shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/20 to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tight">
                Let's build together.
              </h2>
              <p className="text-neutral-400 dark:text-brand-100 font-medium">
                Whether you have feedback, bug reports, or just want to talk
                shop about software, I'm always listening.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/mketiku/parrit/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-2xl bg-white text-neutral-900 px-8 py-4 font-bold transition-all hover:bg-neutral-100 active:scale-95"
              >
                Open a GitHub Issue
              </a>
              <a
                href="https://www.linkedin.com/in/mketiku"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-2xl border border-white/20 px-8 py-4 font-bold text-white transition-all hover:bg-white/10 active:scale-95"
              >
                <Linkedin className="h-5 w-5" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
