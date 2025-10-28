import { test, expect } from '@playwright/test';
import { createMockApi } from './helpers/mockApi';

test.describe('Auth flows', () => {
  test('renders login form', async ({ page }) => {
    const mock = createMockApi();
    mock.reset();
     await mock.attachContext(page.context());
    await mock.attachPage(page);
    await page.goto('/login', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Sign In$/i })).toBeEnabled();
  });

  test('links to register screen', async ({ page }) => {
    const mock = createMockApi();
    mock.reset();
    await mock.attachContext(page.context());
    await mock.attachPage(page);
    await page.goto('/login', { waitUntil: 'networkidle' });

    await page.getByRole('link', { name: /Sign up/i }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible();
  });
});
