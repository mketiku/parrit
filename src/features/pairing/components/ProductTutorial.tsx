import React, { useState, useCallback, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TUTORIAL_STEPS, useTutorialStore } from '../store/useTutorialStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { X, ChevronRight, ChevronLeft, Bird } from 'lucide-react';

export function ProductTutorial() {
  const { isActive, currentStepIndex, nextStep, prevStep, exitTutorial } =
    useTutorialStore();
  const { setOnboardingCompleted } = useWorkspacePrefsStore();
  const { user } = useAuthStore();
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  // Update spotlight position when step or window changes
  const updateSpotlight = useCallback(() => {
    if (!currentStep?.targetId) return;
    const el = document.getElementById(currentStep.targetId);
    if (el) {
      setSpotlightRect(el.getBoundingClientRect());
    } else {
      setSpotlightRect(null);
    }
  }, [currentStep]);

  useLayoutEffect(() => {
    if (isActive) {
      // Use requestAnimationFrame to avoid synchronous setState inside effect
      const handle = requestAnimationFrame(updateSpotlight);

      window.addEventListener('resize', updateSpotlight);
      window.addEventListener('scroll', updateSpotlight, true);

      return () => {
        cancelAnimationFrame(handle);
        window.removeEventListener('resize', updateSpotlight);
        window.removeEventListener('scroll', updateSpotlight, true);
      };
    }
  }, [isActive, updateSpotlight]);

  const handleFinish = async () => {
    exitTutorial();
    setOnboardingCompleted(true);
    if (user) {
      await supabase
        .from('workspace_settings')
        .upsert({ user_id: user.id, onboarding_completed: true });
    }
  };

  if (!isActive) return null;

  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      {/* Dark Overlay with Circle Cutout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
        style={{
          clipPath: spotlightRect
            ? `polygon(0% 0%, 0% 100%, ${spotlightRect.left}px 100%, ${spotlightRect.left}px ${spotlightRect.top}px, ${spotlightRect.right}px ${spotlightRect.top}px, ${spotlightRect.right}px ${spotlightRect.bottom}px, ${spotlightRect.left}px ${spotlightRect.bottom}px, ${spotlightRect.left}px 100%, 100% 100%, 100% 0%)`
            : 'none',
        }}
        onClick={exitTutorial}
      />

      <AnimatePresence mode="wait">
        {spotlightRect && (
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute pointer-events-auto z-[101] w-80 rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl dark:bg-black/20"
            style={{
              top:
                spotlightRect.bottom + 20 + spotlightRect.height >
                window.innerHeight
                  ? spotlightRect.top - 240
                  : spotlightRect.bottom + 20,
              left: Math.max(
                20,
                Math.min(
                  window.innerWidth - 340,
                  spotlightRect.left + spotlightRect.width / 2 - 160
                )
              ),
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500 text-white">
                  <Bird className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-500">
                  Step {currentStepIndex + 1} of {TUTORIAL_STEPS.length}
                </span>
              </div>
              <button
                onClick={exitTutorial}
                className="rounded-full p-1 text-neutral-400 hover:bg-white/10 transition-colors"
                title="Skip Tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {currentStep.title}
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {currentStep.description}
            </p>

            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-neutral-700 disabled:opacity-0 transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
                Back
              </button>

              <div className="flex gap-2">
                {!isLastStep ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 active:scale-95 transition-all"
                  >
                    Next
                    <ChevronRight className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinish}
                    className="rounded-xl bg-green-500 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-green-500/20 hover:bg-green-600 active:scale-95 transition-all"
                  >
                    Got it!
                  </button>
                )}
              </div>
            </div>

            {/* Progress dots */}
            <div className="mt-6 flex justify-center gap-1.5">
              {TUTORIAL_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-4 rounded-full transition-all duration-300 ${
                    i === currentStepIndex
                      ? 'bg-brand-500 w-8'
                      : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
