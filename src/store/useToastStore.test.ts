import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useToastStore } from './useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    // Reset store to default
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should add a toast', () => {
    const { addToast } = useToastStore.getState();
    addToast('Test Message', 'success');

    const state = useToastStore.getState();
    expect(state.toasts.length).toBe(1);
    expect(state.toasts[0].message).toBe('Test Message');
    expect(state.toasts[0].variant).toBe('success');
  });

  it('should remove a toast by id', () => {
    const { addToast, removeToast } = useToastStore.getState();
    addToast('Test Message');
    const id = useToastStore.getState().toasts[0].id;

    removeToast(id);
    expect(useToastStore.getState().toasts.length).toBe(0);
  });

  it('should auto-dismiss toast after 4 seconds', () => {
    const { addToast } = useToastStore.getState();
    addToast('Temporary Toast');

    expect(useToastStore.getState().toasts.length).toBe(1);

    // Fast-forward 4 seconds
    vi.advanceTimersByTime(4000);

    expect(useToastStore.getState().toasts.length).toBe(0);
  });
});
