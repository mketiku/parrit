import React, {
  useState,
  useCallback,
  useLayoutEffect,
  useEffect,
  useRef,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
} from '@floating-ui/react-dom';
import { useTutorialStore } from '../store/useTutorialStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { X, ChevronRight, ChevronLeft, Bird } from 'lucide-react';

export function ProductTutorial() {
  const {
    isActive,
    currentStepIndex,
    nextStep,
    prevStep,
    exitTutorial,
    steps,
  } = useTutorialStore();
  const { setOnboardingCompleted } = useWorkspacePrefsStore();
  const { user } = useAuthStore();
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const currentStep = steps[currentStepIndex];

  // Industry standard positioning logic
  const { x, y, refs, strategy } = useFloating({
    placement: currentStep?.placement || 'bottom',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(16),
      flip({ fallbackAxisSideDirection: 'end' }),
      shift({ padding: 16 }),
    ],
  });

  const updateSpotlight = useCallback(() => {
    if (!currentStep?.targetId) return;
    const el = document.getElementById(currentStep.targetId);
    if (el) {
      refs.setReference(el);
      setSpotlightRect(el.getBoundingClientRect());
    } else {
      refs.setReference(null);
      setSpotlightRect(null);
    }
  }, [currentStep, refs]);

  const handleFinish = useCallback(async () => {
    exitTutorial();
    setOnboardingCompleted(true);
    if (user) {
      await supabase
        .from('workspace_settings')
        .upsert({ user_id: user.id, onboarding_completed: true });
    }
  }, [exitTutorial, setOnboardingCompleted, user]);

  useLayoutEffect(() => {
    if (isActive) {
      const handleResize = () => updateSpotlight();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleFinish();
        if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
          if (currentStepIndex < steps.length - 1) nextStep();
          else handleFinish();
        }
        if (e.key === 'ArrowLeft') prevStep();
      };

      const handle = requestAnimationFrame(updateSpotlight);
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', updateSpotlight, true);
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        cancelAnimationFrame(handle);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', updateSpotlight, true);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [
    isActive,
    updateSpotlight,
    currentStepIndex,
    nextStep,
    prevStep,
    exitTutorial,
    handleFinish,
    steps.length,
  ]);

  const isLastStep = currentStepIndex === steps.length - 1;

  // We only render when we know the coordinates and the rect.
  const isReady = isActive && x != null && y != null && spotlightRect != null;

  // To satisfy the linter about "accessing ref during render",
  // we extract the functions we need.
  const { setFloating } = refs;

  // Manage focus trap
  useEffect(() => {
    if (isReady && dialogRef.current) {
      // Focus the dialog to start the keyboard interaction
      dialogRef.current.focus();
    }
  }, [isReady]);

  // Trap focus inside the dialog
  const handleDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab' && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey) {
        if (
          document.activeElement === firstElement ||
          document.activeElement === dialogRef.current
        ) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }
  };

  return (
    <AnimatePresence>
      {isReady && (
        <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
          {/* Dark Overlay with Circle Cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
            style={{
              clipPath: `polygon(0% 0%, 0% 100%, ${spotlightRect.left}px 100%, ${spotlightRect.left}px ${spotlightRect.top}px, ${spotlightRect.right}px ${spotlightRect.top}px, ${spotlightRect.right}px ${spotlightRect.bottom}px, ${spotlightRect.left}px ${spotlightRect.bottom}px, ${spotlightRect.left}px 100%, 100% 100%, 100% 0%)`,
            }}
            onClick={handleFinish}
          />

          <motion.div
            ref={(node) => {
              setFloating(node);
              dialogRef.current = node;
            }}
            tabIndex={-1}
            onKeyDown={handleDialogKeyDown}
            key={currentStepIndex}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
            aria-describedby="tutorial-description"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute pointer-events-auto z-[101] w-80 rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-neutral-900 focus:outline-none"
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500 text-white">
                  <Bird className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-500">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
              </div>
              <button
                onClick={handleFinish}
                className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10 transition-colors"
                title="Skip Tour"
                aria-label="Skip Tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3
              id="tutorial-title"
              className="mb-2 text-lg font-bold text-neutral-900 dark:text-neutral-50"
            >
              {currentStep.title}
            </h3>
            <p
              id="tutorial-description"
              className="mb-6 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
            >
              {currentStep.description}
            </p>

            <div className="flex items-center justify-between border-t border-neutral-100 pt-5 dark:border-neutral-800">
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
            <div className="mt-5 flex justify-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === currentStepIndex
                      ? 'bg-brand-500 w-8'
                      : 'bg-neutral-200 dark:bg-neutral-800 w-4'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
