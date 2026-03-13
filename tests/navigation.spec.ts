import { test, expect } from '@playwright/test';

test.describe('Responsive Navigation & Layout', () => {

  test('Homepage loads and displays branding', async ({ page }) => {
    // Navigate to local instance
    await page.goto('/');

    // Validate the page title
    await expect(page).toHaveTitle(/MangaAI/i);

    // Validate branding is visible
    const logoText = page.locator('text=MangaAI').first();
    await expect(logoText).toBeVisible();
  });

  test('Mobile Bottom Navigation is visible on small screens', async ({ page, isMobile }) => {
    // Only execute if the browser config is marked as isMobile
    if (!isMobile) return;

    await page.goto('/');

    // Check that the mobile bottom nav handles are present
    const bottomNav = page.locator('nav').filter({ hasText: 'Discover' });
    await expect(bottomNav).toBeVisible();

    const discoverBtn = page.getByRole('button', { name: 'Discover' });
    await expect(discoverBtn).toBeVisible();
    
    const mylistBtn = page.getByRole('button', { name: 'My List' });
    await expect(mylistBtn).toBeVisible();
  });

  test('Desktop Navigation is visible on large screens', async ({ page, isMobile }) => {
    // Only execute if not mobile
    if (isMobile) return;

    await page.goto('/');

    // The desktop buttons should be inside the top header, which is not inside the bottom nav
    const headerNav = page.locator('header').filter({ hasText: 'Discover' });
    await expect(headerNav).toBeVisible();
    
    // Bottom mobile nav should NOT be visible
    const bottomNav = page.locator('nav').filter({ hasText: 'Discover' });
    await expect(bottomNav).toBeHidden();
  });
});
