import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Parrit/);
});

test('logo is visible', async ({ page }) => {
    await page.goto('/');

    // Check that the logo text is shown
    await expect(page.getByText('Parrit', { exact: true })).toBeVisible();
});
