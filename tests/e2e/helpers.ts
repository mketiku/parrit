import { Page } from '@playwright/test';

/**
 * Common helper to login to a test workspace.
 */
export async function login(
  page: Page,
  workspaceName: string = 'test-team',
  password: string = 'password'
) {
  await page.goto('/login');

  // Try to see if we are already logged in (heading should be present if logged in)
  const heading = page.getByRole('heading', { name: /Workspace/i });
  if (await heading.isVisible()) {
    return;
  }

  await page.getByPlaceholder('e.g. apollo-team').fill(workspaceName);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /Enter Workspace/i }).click();

  // Wait for navigation/dashboard load
  await page.waitForURL('**/app**');
}
