import React from 'react';
import { Bird, MessageSquare, Linkedin, Github, Heart } from 'lucide-react';

export function AboutScreen() {
  return (
    <div className="mx-auto max-w-3xl space-y-12 pb-12">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-brand-50 dark:bg-brand-500/10 p-3 ring-1 ring-brand-500/20">
            <Bird className="h-10 w-10 text-brand-600 dark:text-brand-400" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
          About Parrit
        </h1>
        <p className="mx-auto max-w-xl text-lg text-neutral-500 dark:text-neutral-400">
          A modern, tactile pairing board designed to elevate team collaboration
          and focus.
        </p>
      </div>

      {/* Content Section */}
      <div className="space-y-10">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            The Philosophy
          </h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4">
            <p>
              Parrit was built to fill the gap left when the original parrit.io
              was taken down in 2025. We believe teams deserve a modern,
              reliable home for their pairing sessions—one that prioritizes
              shared context and collective ownership without the friction of
              complex tools.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Features
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                Tactile Interaction
              </h3>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Moving team members around your board should feel as natural as
                shifting magnets on a physical whiteboard.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                Privacy First
              </h3>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Anonymous Workspace IDs mean you can get straight to work
                without providing personal email addresses or sensitive team
                data.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                Real-time Sync
              </h3>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                The entire team stays on the same page. Every move and update is
                instantly shared with everyone in the workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                Bulk Actions
              </h3>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Organize even the largest teams in seconds using selection
                helpers and bulk drag operations.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="space-y-6 pt-6">
          <div className="rounded-3xl bg-neutral-900 p-8 text-white dark:bg-brand-600">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">
                  Get in touch
                </h2>
                <p className="text-neutral-400 dark:text-brand-100 max-w-md">
                  Have feedback, questions, or ideas for Parrit? I'd love to
                  hear from you.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="https://linkedin.com/in/mketiku"
                  target="_blank"
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-semibold transition-all hover:bg-white/20"
                >
                  <Linkedin className="h-5 w-5" />
                  LinkedIn
                </a>
                <a
                  href="https://github.com/mketiku/parrit/issues"
                  target="_blank"
                  className="flex items-center gap-2 rounded-xl bg-white text-neutral-900 px-6 py-3 font-semibold transition-all hover:bg-neutral-100"
                >
                  <Github className="h-5 w-5" />
                  Raise an Issue
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
