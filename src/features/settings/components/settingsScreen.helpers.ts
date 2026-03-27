export interface PasswordValidationResult {
  type: 'error' | 'success';
  text: string;
}

export function validatePasswordUpdate(
  newPassword: string,
  confirmPassword: string
): PasswordValidationResult | null {
  if (newPassword !== confirmPassword) {
    return { type: 'error', text: 'Passwords do not match.' };
  }

  if (newPassword.length < 6) {
    return {
      type: 'error',
      text: 'Password must be at least 6 characters long.',
    };
  }

  return null;
}

export function getWebhookError(value: string): string {
  if (value && !value.startsWith('https://')) {
    return 'Webhook URL must start with https://';
  }

  return '';
}

export function buildWorkspaceExportFilename(
  workspaceName: string,
  date: Date = new Date()
): string {
  return `parrit-workspace-${workspaceName}-${date.toISOString().split('T')[0]}.json`;
}
