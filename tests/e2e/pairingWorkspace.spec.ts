import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Pairing Workspace', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await login(page);
    // Go to the main app page
    await page.goto('/app');
  });

  test('should load the active pairing boards section', async ({ page }) => {
    const heading = page.getByRole('heading', {
      name: /Active Pairing Boards/i,
    });
    await expect(heading).toBeVisible();
  });

  test('should allow creating a new board', async ({ page }, testInfo) => {
    const boardName = `Rocket Ship Project ${testInfo.project.name}-${testInfo.workerIndex}-${Date.now()}`;
    const addBoardButton = page.getByRole('button', {
      name: /Add new pairing board/i,
    });

    await expect(addBoardButton).toBeVisible();

    await addBoardButton.click();

    const input = page.getByPlaceholder('Board name...');
    await expect(input).toBeVisible();
    await input.fill(boardName);

    const createButton = page.getByRole('button', {
      name: 'Create',
      exact: true,
    });
    await createButton.click();

    // Expect the new board card heading to be present
    await expect(page.getByRole('heading', { name: boardName })).toBeVisible();
  });
});
