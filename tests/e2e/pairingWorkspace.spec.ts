import { test, expect } from '@playwright/test';

test.describe('Pairing Workspace', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the main app page
    await page.goto('/');
  });

  test('should load the active pairing boards section', async ({ page }) => {
    const heading = page.getByRole('heading', {
      name: /Active Pairing Boards/i,
    });
    await expect(heading).toBeVisible();
  });

  test('should allow creating a new board', async ({ page }) => {
    const addBoardButton = page.getByRole('button', { name: /Add Board/i });

    // If the workspace is empty, it might auto-start a tutorial or it might not.
    // Assuming we can see the 'Add Board' button.
    await expect(addBoardButton).toBeVisible();

    await addBoardButton.click();

    const input = page.getByPlaceholder('Board name...');
    await expect(input).toBeVisible();
    await input.fill('Rocket Ship Project');

    const createButton = page.getByRole('button', {
      name: 'Create',
      exact: true,
    });
    await createButton.click();

    // Expect to see the new board in the document
    await expect(page.getByText('Rocket Ship Project')).toBeVisible();
  });
});
