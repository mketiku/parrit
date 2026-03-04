import { describe, it, expect, beforeEach } from 'vitest';
import { useTutorialStore, DASHBOARD_TUTORIAL_STEPS } from './useTutorialStore';

describe('useTutorialStore', () => {
    beforeEach(() => {
        useTutorialStore.getState().exitTutorial();
    });

    it('should initialize with inactive state', () => {
        const state = useTutorialStore.getState();
        expect(state.isActive).toBe(false);
        expect(state.currentStepIndex).toBe(0);
    });

    it('should start tutorial with default steps', () => {
        const { startTutorial } = useTutorialStore.getState();
        startTutorial();

        const state = useTutorialStore.getState();
        expect(state.isActive).toBe(true);
        expect(state.steps).toEqual(DASHBOARD_TUTORIAL_STEPS);
        expect(state.currentStepIndex).toBe(0);
    });

    it('should navigate through steps', () => {
        const { startTutorial, nextStep, prevStep } = useTutorialStore.getState();
        startTutorial();

        nextStep();
        expect(useTutorialStore.getState().currentStepIndex).toBe(1);

        nextStep();
        expect(useTutorialStore.getState().currentStepIndex).toBe(2);

        prevStep();
        expect(useTutorialStore.getState().currentStepIndex).toBe(1);
    });

    it('should handle exit correctly', () => {
        const { startTutorial, exitTutorial } = useTutorialStore.getState();
        startTutorial();
        exitTutorial();

        const state = useTutorialStore.getState();
        expect(state.isActive).toBe(false);
    });
});
