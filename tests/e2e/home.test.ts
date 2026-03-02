import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Parrit/);
});

test('get started button is visible', async ({ page }) => {
    await page.goto('/');

    // Click the get started link.
    await expect(page.getByRole('button', { name: /Get Started/i })).toBeVisible();
});
