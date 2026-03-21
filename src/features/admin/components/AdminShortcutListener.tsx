import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/store/useAuthStore';

/**
 * A robust keyboard shortcut listener for navigation.
 * Uses event.code to avoid issues with specialized keyboard characters.
 *
 * Primary: Shift + Alt + A
 * Secondary: Shift + Cmd + A
 */
export function AdminShortcutListener() {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Physical Key 'A' (regardless of character produced)
      const isAPressed = e.code === 'KeyA';
      const isShift = e.shiftKey;
      const isAlt = e.altKey;
      const isCmd = e.metaKey;

      if (isAPressed && isShift && (isAlt || isCmd)) {
        if (isAdmin) {
          navigate('/app/admin');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isAdmin]);

  return null;
}
