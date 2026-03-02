import { create } from 'zustand';

export interface TutorialStep {
  targetId: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: 'unpaired-pool',
    title: 'Teammate Pool',
    description:
      'This is where your teammates live. Start by adding people here.',
    placement: 'left',
  },
  {
    targetId: 'board-list',
    title: 'Pairing Boards',
    description:
      'Create boards for different projects or squads. Drag people from the pool and drop them here.',
    placement: 'bottom',
  },
  {
    targetId: 'recommend-btn',
    title: 'Get Recommendations',
    description:
      'Let Parrit suggest pairs based on historical data. Very handy for rotating pairs efficiently.',
    placement: 'bottom',
  },
  {
    targetId: 'share-link-btn',
    title: 'Share the View',
    description:
      'Copy a read-only link to share your pairings with stakeholders instantly.',
    placement: 'bottom',
  },
  {
    targetId: 'save-session-btn',
    title: 'Finalize & Save',
    description:
      'Once pairings are set, click here to log history. This improves future recommendations.',
    placement: 'bottom',
  },
];

interface TutorialState {
  isActive: boolean;
  currentStepIndex: number;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  exitTutorial: () => void;
}

export const useTutorialStore = create<TutorialState>((set) => ({
  isActive: false,
  currentStepIndex: 0,
  startTutorial: () => set({ isActive: true, currentStepIndex: 0 }),
  nextStep: () =>
    set((state) => ({
      currentStepIndex: Math.min(
        state.currentStepIndex + 1,
        TUTORIAL_STEPS.length - 1
      ),
    })),
  prevStep: () =>
    set((state) => ({
      currentStepIndex: Math.max(state.currentStepIndex - 1, 0),
    })),
  exitTutorial: () => set({ isActive: false, currentStepIndex: 0 }),
}));
