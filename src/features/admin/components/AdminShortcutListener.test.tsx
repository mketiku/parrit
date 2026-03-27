import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminShortcutListener } from './AdminShortcutListener';

const navigateMock = vi.fn();
const authState = vi.hoisted(() => ({ isAdmin: false }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../../auth/store/useAuthStore', () => ({
  useAuthStore: () => authState,
}));

describe('AdminShortcutListener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isAdmin = false;
  });

  it('navigates to the admin portal for admins using Shift+Alt+A', () => {
    authState.isAdmin = true;
    render(<AdminShortcutListener />);

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        code: 'KeyA',
        shiftKey: true,
        altKey: true,
      })
    );

    expect(navigateMock).toHaveBeenCalledWith('/app/admin');
  });

  it('does not navigate for non-admin users', () => {
    render(<AdminShortcutListener />);

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        code: 'KeyA',
        shiftKey: true,
        metaKey: true,
      })
    );

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('removes the listener on unmount', () => {
    authState.isAdmin = true;
    const { unmount } = render(<AdminShortcutListener />);

    unmount();
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        code: 'KeyA',
        shiftKey: true,
        altKey: true,
      })
    );

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
