import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Dashboard Screenshot', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await login(page);
    // Go to the main app page
    await page.goto('/app');
    // Wait for the workspace to load
    await expect(
      page.getByRole('heading', { name: /Active Pairing Boards/i })
    ).toBeVisible();
  });

  test('should show the download button as a FAB', async ({ page }) => {
    const downloadBtn = page.getByTitle('Download Dashboard as Image');
    await expect(downloadBtn).toBeVisible();

    // Check its position - it should be in the bottom-right area
    const box = await downloadBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      const viewport = page.viewportSize();
      if (viewport) {
        expect(box.x).toBeGreaterThan(viewport.width / 2);
        expect(box.y).toBeGreaterThan(viewport.height / 2);
      }
    }
  });

  test('should trigger screenshot process and show success toast', async ({
    page,
  }) => {
    const downloadBtn = page.getByTitle('Download Dashboard as Image');

    // Click and wait for the toast
    await downloadBtn.click();

    // The toast message should appear
    const toast = page.getByText(/Screenshot downloaded!/i);
    await expect(toast).toBeVisible({ timeout: 10000 });
  });

  test('should temporarily apply data-exporting state to document', async ({
    page,
  }) => {
    const downloadBtn = page.getByTitle('Download Dashboard as Image');

    // Trigger download
    await downloadBtn.click();

    // Verify the data-exporting attribute is temporarily added to the html document
    // We expect the html element to have data-exporting="true"
    const htmlExporting = page.locator('html[data-exporting="true"]');
    await expect(htmlExporting).toBeAttached({ timeout: 2000 });
  });
});
