import { test, expect } from '@playwright/test';

test('should render the Parrit page title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Parrit/);
});

test('should display the Parrit wordmark on the home page', async ({
  page,
}) => {
  await page.goto('/');

  // Check that the logo text is shown
  await expect(page.getByText('Parrit', { exact: true })).toBeVisible();
});
