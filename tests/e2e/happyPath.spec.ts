import { test, expect } from '@playwright/test';

test.describe('Happy Path: Core Pairing Workflow', () => {
  const workspaceName = `test-${Math.floor(Math.random() * 1000000)}`;
  const password = 'Password123!';

  test('should allow a complete pairing session orchestrating', async ({
    page,
  }) => {
    // 1. Create a workspace (Sign Up)
    await page.goto('/login?signup=true');

    // Setup dialog handler BEFORE clicking
    page.on('dialog', async (dialog) => {
      console.log('Dialog message:', dialog.message());
      await dialog.dismiss();
    });

    await page.getByPlaceholder('e.g. apollo-team').fill(workspaceName);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /Create Workspace/i }).click();

    // After alert is dismissed, we should see "Enter Workspace"
    const enterWorkspaceBtn = page.getByRole('button', {
      name: /Enter Workspace/i,
    });
    await expect(enterWorkspaceBtn).toBeVisible({ timeout: 15000 });

    // Fill credentials again (sometimes the fields might clear, but usually they stay)
    // Actually, on setIsSignUp(false), the values remain in the inputs.
    await enterWorkspaceBtn.click();

    await page.waitForURL('**/app', { timeout: 15000 });

    // 2. Add People via Team Screen
    await page.getByRole('link', { name: 'Team' }).click();
    await page.waitForURL('**/app/team');

    const people = ['Alice Wonderland', 'Bob Builder', 'Charlie Chocolate'];
    for (const name of people) {
      await page.getByRole('button', { name: /Add Person/i }).click();
      await page.getByPlaceholder(/Full name/i).fill(name);
      await page.getByRole('button', { name: 'Add', exact: true }).click();
      // Wait for the person to appear in the list before adding the next one
      await expect(page.getByText(name)).toBeVisible();
    }

    // 3. Add a Board via Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL('**/app');

    await page.getByRole('button', { name: /Add Board/i }).click();
    await page.getByPlaceholder('Board name...').fill('Rocket Project');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText('Rocket Project')).toBeVisible();

    // 4. Recommend Pairs
    const recommendBtn = page.getByRole('button', { name: /Recommend Pairs/i });
    await expect(recommendBtn).toBeVisible();
    await recommendBtn.click();

    // Expect "Recommending..." state
    await expect(page.getByText('Recommending...')).toBeVisible();

    // Wait for recommendation to finish
    await expect(recommendBtn).toHaveText('Recommend Pairs', {
      timeout: 15000,
    });

    // 5. Rotate Pair
    const rotateBtn = page.getByTitle(/Rotate pair/i);
    await expect(rotateBtn).toBeVisible();
    await rotateBtn.click();

    // 6. Save Session
    const saveBtn = page.getByRole('button', { name: /Save Session/i });
    await saveBtn.click();

    // Verify "Saving..." state
    await expect(page.getByText('Saving...')).toBeVisible();

    // Verify success toast/message
    await expect(page.getByText(/Session saved/i)).toBeVisible({
      timeout: 15000,
    });
  });
});
