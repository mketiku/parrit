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

  test('should ensure the export view is present but hidden during normal view', async ({
    page,
  }) => {
    // The export view has an ID or we can find it by its hidden nature
    // It's a div with position: fixed and left: -2000px
    const exportView = page.locator('div[style*="left: -2000px"]');
    await expect(exportView).toBeAttached();

    // It should not be visible to the user (outside viewport)
    // In Playwright, isVisible check if it's rendered and not display:none etc.
    // An element at -2000px might still return true for isVisible if it's not display:none.
    // But we can check its bounding box.
    const box = await exportView.boundingBox();
    if (box) {
      expect(box.x).toBeLessThan(0);
    }
  });
});
