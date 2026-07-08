import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText(/Telugu/i);
});

test('stories page loads', async ({ page }) => {
  await page.goto('/stories');
  await expect(page.locator('h1')).toContainText(/Stories/i);
});

test('404 page loads', async ({ page }) => {
  await page.goto('/this-route-does-not-exist-xyz');
  await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
});