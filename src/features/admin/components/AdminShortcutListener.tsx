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
  const { isAdmin, role, user } = useAuthStore();

  useEffect(() => {
    // Debug log to help the user verify their status
    if (user) {
      console.log('--- Auth Debug ---');
      console.log('User:', user.email);
      console.log('Role Claim:', role);
      console.log('Is Admin?:', isAdmin);
      console.log('Shortcut: Shift + Alt + A');
      console.log('------------------');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Physical Key 'A' (regardless of character produced)
      const isAPressed = e.code === 'KeyA';
      const isShift = e.shiftKey;
      const isAlt = e.altKey;
      const isCmd = e.metaKey;

      if (isAPressed && isShift && (isAlt || isCmd)) {
        if (isAdmin) {
          console.log('Shortcut triggered! Navigating to Admin...');
          navigate('/admin');
        } else {
          console.warn('Secret shortcut pressed, but user lacks Admin role.');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isAdmin, role, user]);

  return null;
}
