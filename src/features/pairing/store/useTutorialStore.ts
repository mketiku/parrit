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
    title: 'Board Focus',
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
      'Let Parrit suggest pairs based on historical data and availability. Very handy for rotating teams efficiently while keeping one person with the knowledge of the board where possible.',
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
    title: 'Evolution Flow',
    description:
      'A bird’s eye view of your team’s progression. See how squads evolved over the last several sessions at a glance.',
    placement: 'bottom',
  },
  {
    targetId: 'history-insights',
    title: 'Deeper Insights',
    description:
      'Toggle the analytical view to surface the pairing heatmap and team-wide stats hidden in your data.',
    placement: 'left',
  },
  {
    targetId: 'history-snapshots-list',
    title: 'Snapshot Archive',
    description:
      'Every time you save a session, it lives here. We’ve grouped them by month to help you find historical records faster.',
    placement: 'right',
  },
  {
    targetId: 'history-bulk-select',
    title: 'Bulk Management',
    description:
      'Need to clean up? Use the check-all or Shift+Click to select multiple sessions for bulk deletion.',
    placement: 'bottom',
  },
  {
    targetId: 'history-session-details',
    title: 'Detailed Inspection',
    description:
      'Select any session to see exactly who was paired on which board. You can even edit the date and time of past records.',
    placement: 'left',
  },
  {
    targetId: 'history-clone-btn',
    title: 'Time Machine',
    description:
      'The ultimate reset button. Clicking Clone will immediately restore your live dashboard to this exact configuration.',
    placement: 'bottom',
  },
  {
    targetId: 'help-btn',
    title: 'Need Help?',
    description: 'You can re-run this tutorial or find help here anytime.',
    placement: 'left',
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
