// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildWorkspaceExportFilename,
  getWebhookError,
  validatePasswordUpdate,
} from './settingsScreen.helpers';

describe('settingsScreen helpers', () => {
  it('validates password mismatch and minimum length', () => {
    expect(validatePasswordUpdate('one', 'two')).toEqual({
      type: 'error',
      text: 'Passwords do not match.',
    });
    expect(validatePasswordUpdate('123', '123')).toEqual({
      type: 'error',
      text: 'Password must be at least 6 characters long.',
    });
    expect(validatePasswordUpdate('secret123', 'secret123')).toBeNull();
  });

  it('validates webhook urls', () => {
    expect(getWebhookError('http://hooks.slack.com/foo')).toBe(
      'Webhook URL must start with https://'
    );
    expect(getWebhookError('https://hooks.slack.com/foo')).toBe('');
    expect(getWebhookError('')).toBe('');
  });

  it('builds the export filename with the workspace name and date', () => {
    expect(
      buildWorkspaceExportFilename('TestTeam', new Date('2026-03-27T12:00:00Z'))
    ).toBe('parrit-workspace-TestTeam-2026-03-27.json');
  });
});
