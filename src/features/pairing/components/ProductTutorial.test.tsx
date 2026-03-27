import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductTutorial } from './ProductTutorial';
import { useTutorialStore } from '../store/useTutorialStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { supabase } from '../../../lib/supabase';

// Mocks
vi.mock('../store/useTutorialStore');
vi.mock('../../../store/useWorkspacePrefsStore');
vi.mock('../../auth/store/useAuthStore');

// Mock Floating UI to avoid layout issues in JSDOM
vi.mock('@floating-ui/react-dom', () => ({
  useFloating: () => ({
    x: 100,
    y: 100,
    strategy: 'absolute',
    refs: { setReference: vi.fn(), setFloating: vi.fn() },
  }),
  autoUpdate: vi.fn(),
  offset: vi.fn(),
  flip: vi.fn(),
  shift: vi.fn(),
}));

describe('ProductTutorial', () => {
  const mockNextStep = vi.fn();
  const mockPrevStep = vi.fn();
  const mockExitTutorial = vi.fn();
  const mockSetOnboardingCompleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useTutorialStore).mockReturnValue({
      isActive: true,
      currentStepIndex: 0,
      nextStep: mockNextStep,
      prevStep: mockPrevStep,
      exitTutorial: mockExitTutorial,
      steps: [
        { title: 'Step 1', description: 'Desc 1', targetId: 't1' },
        { title: 'Step 2', description: 'Desc 2', targetId: 't2' },
      ],
    } as unknown as ReturnType<typeof useTutorialStore>);

    vi.mocked(useWorkspacePrefsStore).mockReturnValue({
      setOnboardingCompleted: mockSetOnboardingCompleted,
    } as unknown as ReturnType<typeof useWorkspacePrefsStore>);

    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-123' },
    } as unknown as ReturnType<typeof useAuthStore>);
  });

  it('renders the current step when active', () => {
    render(<ProductTutorial />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Desc 1')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
  });

  it('calls nextStep when clicking Next', () => {
    render(<ProductTutorial />);
    fireEvent.click(screen.getByText('Next'));
    expect(mockNextStep).toHaveBeenCalled();
  });

  it('calls handleFinish when on last step and clicking Got it!', () => {
    vi.mocked(useTutorialStore).mockReturnValue({
      isActive: true,
      currentStepIndex: 1, // Last step
      nextStep: mockNextStep,
      prevStep: mockPrevStep,
      exitTutorial: mockExitTutorial,
      steps: [
        { title: 'Step 1', description: 'Desc 1' },
        { title: 'Step 2', description: 'Desc 2' },
      ],
    } as unknown as ReturnType<typeof useTutorialStore>);

    render(<ProductTutorial />);
    fireEvent.click(screen.getByText('Got it!'));

    expect(mockExitTutorial).toHaveBeenCalled();
    expect(mockSetOnboardingCompleted).toHaveBeenCalledWith(true);
    expect(supabase.from).toHaveBeenCalledWith('workspace_settings');
  });

  it('handles keyboard navigation (ArrowRight)', () => {
    render(<ProductTutorial />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mockNextStep).toHaveBeenCalled();
  });

  it('handles keyboard navigation (Escape)', () => {
    render(<ProductTutorial />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockExitTutorial).toHaveBeenCalled();
  });

  it('does not render when not active', () => {
    vi.mocked(useTutorialStore).mockReturnValue({
      isActive: false,
      steps: [],
    } as unknown as ReturnType<typeof useTutorialStore>);
    const { container } = render(<ProductTutorial />);
    expect(container.firstChild).toBeNull();
  });
});
