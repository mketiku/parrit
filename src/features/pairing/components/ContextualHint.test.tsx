import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { ContextualHint } from './ContextualHint';

vi.mock('@floating-ui/react-dom', () => ({
  useFloating: () => ({
    x: 12,
    y: 24,
    strategy: 'absolute',
    refs: {
      setReference: vi.fn(),
      setFloating: vi.fn(),
    },
  }),
  autoUpdate: vi.fn(),
  offset: vi.fn(),
  flip: vi.fn(),
  shift: vi.fn(),
}));

describe('ContextualHint', () => {
  it('renders nothing when the target element is missing', () => {
    const { container } = render(
      <ContextualHint
        targetId="missing-target"
        title="Tip title"
        description="Tip description"
        onDismiss={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders for an existing target and handles dismiss', async () => {
    const onDismiss = vi.fn();

    render(
      <>
        <button id="save-session-btn">Save</button>
        <ContextualHint
          targetId="save-session-btn"
          title="Your session was saved!"
          description="Head to history next."
          onDismiss={onDismiss}
        />
      </>
    );

    await waitFor(() => {
      expect(screen.getByText(/your session was saved/i)).toBeInTheDocument();
      expect(screen.getByText(/head to history next/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /dismiss tip/i }));

    expect(onDismiss).toHaveBeenCalled();
  });

  it('uses the amber accent variant when requested', async () => {
    render(
      <>
        <div id="heatmap-toggle">Heatmap</div>
        <ContextualHint
          targetId="heatmap-toggle"
          title="Heatmap ready"
          description="You have enough data."
          color="amber"
          onDismiss={vi.fn()}
        />
      </>
    );

    await waitFor(() => {
      expect(screen.getByText(/heatmap ready/i)).toBeInTheDocument();
    });

    const tipLabel = screen.getByText(/tip/i);
    expect(tipLabel.previousSibling).toHaveClass('bg-amber-500');
  });
});
