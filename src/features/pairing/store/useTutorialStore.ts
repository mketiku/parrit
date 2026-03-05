import { create } from 'zustand';

export interface TutorialStep {
  targetId: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const DASHBOARD_TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: 'unpaired-pool',
    title: 'Teammate Pool',
    description:
      'This is where your unpaired teammates live. Start by adding people here.',
    placement: 'left',
  },
  {
    targetId: 'board-list',
    title: 'Pairing Boards',
    description:
      'Create boards for squads or projects. Drag people from the pool and drop them here.',
    placement: 'bottom',
  },
  {
    targetId: 'board-goals',
    title: 'Daily Goals',
    description:
      'Set focus areas for each board. Click into the goals section to add tasks or video meeting links.',
    placement: 'bottom',
  },
  {
    targetId: 'heatmap-toggle',
    title: 'Pairing Heatmap',
    description:
      'Toggle the heatmap to see who hasn’t paired recently at a glance. Helps maintain healthy rotations.',
    placement: 'bottom',
  },
  {
    targetId: 'recommend-btn',
    title: 'Get Recommendations',
    description:
      'Let Parrit suggest pairs based on historical data. Very handy for rotating teams efficiently.',
    placement: 'bottom',
  },
  {
    targetId: 'download-btn',
    title: 'Share Dashboard',
    description:
      'Download a clean, high-resolution image of your current boards to share with stakeholders.',
    placement: 'left',
  },
  {
    targetId: 'save-session-btn',
    title: 'Save Session',
    description:
      'Once pairings are set, click here to log history. This improves future recommendations.',
    placement: 'bottom',
  },
  {
    targetId: 'help-btn',
    title: 'Need Help?',
    description: 'You can re-run this tutorial or find help here anytime.',
    placement: 'left',
  },
];

export const HISTORY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: 'history-timeline',
    title: 'Pairing Timeline',
    description:
      'Browse through all your past pairing sessions. You can delete or modify past records from here.',
    placement: 'bottom',
  },
  {
    targetId: 'history-insights',
    title: 'Personal Insights',
    description:
      'Click on any person to see their individual pairing history, favorite partners, and stats.',
    placement: 'left',
  },
  {
    targetId: 'history-matrix',
    title: 'Full Heatmap',
    description:
      'View the complete pairing matrix for your entire team. Perfect for finding isolated or siloed team members.',
    placement: 'bottom',
  },
];

interface TutorialState {
  isActive: boolean;
  currentStepIndex: number;
  steps: TutorialStep[];
  startTutorial: (steps?: TutorialStep[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  exitTutorial: () => void;
}

export const useTutorialStore = create<TutorialState>((set) => ({
  isActive: false,
  currentStepIndex: 0,
  steps: DASHBOARD_TUTORIAL_STEPS,
  startTutorial: (steps = DASHBOARD_TUTORIAL_STEPS) =>
    set({ isActive: true, currentStepIndex: 0, steps }),
  nextStep: () =>
    set((state) => ({
      currentStepIndex: Math.min(
        state.currentStepIndex + 1,
        state.steps.length - 1
      ),
    })),
  prevStep: () =>
    set((state) => ({
      currentStepIndex: Math.max(state.currentStepIndex - 1, 0),
    })),
  exitTutorial: () => set({ isActive: false, currentStepIndex: 0 }),
}));
