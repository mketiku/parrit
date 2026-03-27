import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore } from './useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should have correct default values', () => {
    const state = useToastStore.getState();
    expect(state.toasts).toEqual([]);
  });

  it('should add a toast and assign a unique ID', () => {
    const { addToast } = useToastStore.getState();

    addToast('Test Message', 'success');
    let state = useToastStore.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].message).toBe('Test Message');
    expect(state.toasts[0].variant).toBe('success');
    expect(state.toasts[0].id).toMatch(/^toast-\d+-\d+\.\d+$/);

    addToast('Second Message');
    state = useToastStore.getState();
    expect(state.toasts).toHaveLength(2);
    expect(state.toasts[1].message).toBe('Second Message');
    expect(state.toasts[1].variant).toBe('info'); // Default variant
  });

  it('should remove a toast by ID', () => {
    const { addToast, removeToast } = useToastStore.getState();

    addToast('To remove');
    const id = useToastStore.getState().toasts[0].id;

    removeToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('should auto-dismiss toasts after 4 seconds', () => {
    const { addToast } = useToastStore.getState();

    addToast('Auto dismissible');
    expect(useToastStore.getState().toasts).toHaveLength(1);

    // Fast-forward 4 seconds
    vi.advanceTimersByTime(4000);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('should handle optional actions', () => {
    const { addToast } = useToastStore.getState();
    const onClick = vi.fn();

    addToast('Message with action', 'info', { label: 'Undo', onClick });

    const toast = useToastStore.getState().toasts[0];
    expect(toast.action).toBeDefined();
    expect(toast.action?.label).toBe('Undo');

    toast.action?.onClick();
    expect(onClick).toHaveBeenCalled();
  });
});
